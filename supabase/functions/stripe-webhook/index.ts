import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Helper function to send outgoing webhooks
async function sendOutgoingWebhook(
  webhookUrl: string,
  event: string,
  data: Record<string, unknown>
) {
  if (!webhookUrl) return;

  try {
    console.log(`Sending outgoing webhook: ${event} to ${webhookUrl}`);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      }),
    });

    console.log(`Webhook response status: ${response.status}`);
  } catch (error) {
    console.error(`Error sending webhook ${event}:`, error);
    // Don't throw - we don't want webhook failures to affect the main flow
  }
}

// Helper function to enroll user in email sequences
async function enrollInSequences(
  supabaseAdmin: any,
  userId: string,
  organizationId: string,
  courseId: string,
  triggerEvent: string
) {
  try {
    console.log(`Checking for sequences to enroll: trigger=${triggerEvent}, orgId=${organizationId}, courseId=${courseId}`);

    // Find active sequences matching the trigger
    const { data: sequences, error: seqError } = await supabaseAdmin
      .from("email_sequences")
      .select("id, name, trigger_course_id")
      .eq("organization_id", organizationId)
      .eq("trigger_event", triggerEvent)
      .eq("is_active", true);

    if (seqError) {
      console.error("Error fetching sequences:", seqError);
      return;
    }

    if (!sequences || sequences.length === 0) {
      console.log("No active sequences found for this trigger");
      return;
    }

    for (const sequence of sequences as any[]) {
      // Check if sequence is for specific course or all courses
      if (sequence.trigger_course_id && sequence.trigger_course_id !== courseId) {
        console.log(`Sequence ${sequence.name} is for different course, skipping`);
        continue;
      }

      // Check if user is already enrolled in this sequence
      const { data: existingEnrollment } = await supabaseAdmin
        .from("sequence_enrollments")
        .select("id")
        .eq("sequence_id", sequence.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingEnrollment) {
        console.log(`User already enrolled in sequence ${sequence.name}`);
        continue;
      }

      // Get the first step to determine initial delay
      const { data: firstStep } = await supabaseAdmin
        .from("email_sequence_steps")
        .select("step_order, delay_hours")
        .eq("sequence_id", sequence.id)
        .order("step_order", { ascending: true })
        .limit(1)
        .single();

      if (!firstStep) {
        console.log(`No steps found for sequence ${sequence.name}, skipping enrollment`);
        continue;
      }

      // Calculate next email time based on first step's delay
      const step = firstStep as any;
      const nextEmailAt = new Date(Date.now() + step.delay_hours * 60 * 60 * 1000);

      // Create enrollment
      const { error: enrollError } = await supabaseAdmin
        .from("sequence_enrollments")
        .insert({
          sequence_id: sequence.id,
          user_id: userId,
          course_id: courseId,
          current_step: step.step_order,
          next_email_at: nextEmailAt.toISOString(),
          is_active: true,
        });

      if (enrollError) {
        console.error(`Error enrolling in sequence ${sequence.name}:`, enrollError);
      } else {
        console.log(`Successfully enrolled user in sequence ${sequence.name}, first email at ${nextEmailAt.toISOString()}`);
      }
    }
  } catch (error) {
    console.error("Error in enrollInSequences:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      console.error("No Stripe signature found");
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        { status: 400, headers: corsHeaders }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`Webhook signature verification failed: ${errorMessage}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${errorMessage}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Received event: ${event.type}`);

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Checkout session completed:", session.id);
      console.log("Session metadata:", session.metadata);

      // Check if this is an AI credits purchase
      if (session.metadata?.type === "ai_credits") {
        console.log("Processing AI credits purchase");
        
        const organizationId = session.metadata.organization_id;
        const creditsAmount = parseInt(session.metadata.credits_amount || "0", 10);
        const packType = session.metadata.pack;
        const userId = session.metadata.user_id;
        const amountPaid = session.amount_total ? session.amount_total / 100 : 0;

        if (!organizationId || !creditsAmount) {
          console.error("Missing organization_id or credits_amount in metadata");
          return new Response(
            JSON.stringify({ error: "Missing metadata" }),
            { status: 400, headers: corsHeaders }
          );
        }

        // Create Supabase admin client
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get current month
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Add bonus credits
        const { data: creditsResult, error: creditsError } = await supabaseAdmin.rpc(
          "add_bonus_credits",
          {
            _organization_id: organizationId,
            _credits_amount: creditsAmount,
            _month_year: monthYear,
          }
        );

        if (creditsError) {
          console.error("Error adding bonus credits:", creditsError);
          return new Response(
            JSON.stringify({ error: "Failed to add credits" }),
            { status: 500, headers: corsHeaders }
          );
        }

        console.log("Bonus credits added:", creditsResult);

        // Record the purchase
        const { error: purchaseError } = await supabaseAdmin
          .from("ai_credits_purchases")
          .insert({
            organization_id: organizationId,
            pack_type: packType,
            credits_amount: creditsAmount,
            price_paid: amountPaid,
            stripe_session_id: session.id,
            stripe_payment_id: session.payment_intent as string,
          });

        if (purchaseError) {
          console.error("Error recording purchase:", purchaseError);
          // Don't fail - credits are already added
        } else {
          console.log("Purchase recorded successfully");
        }

        // Send notification to the coach
        if (userId) {
          try {
            await supabaseAdmin.rpc("create_notification", {
              _user_id: userId,
              _title: "Crédits IA ajoutés !",
              _message: `${creditsAmount.toLocaleString("fr-FR")} crédits IA ont été ajoutés à votre compte.`,
              _type: "credits",
              _metadata: { pack: packType, credits: creditsAmount },
            });
            console.log("Notification sent to user");
          } catch (notifError) {
            console.error("Error sending notification:", notifError);
          }
        }

        return new Response(
          JSON.stringify({ received: true, type: "ai_credits", credits_added: creditsAmount }),
          { status: 200, headers: corsHeaders }
        );
      }

      // Check if this is an email credits purchase
      if (session.metadata?.type === "email_credits") {
        console.log("Processing email credits purchase");
        
        const organizationId = session.metadata.organization_id;
        const emailsAmount = parseInt(session.metadata.emails_amount || "0", 10);
        const packType = session.metadata.pack;
        const userId = session.metadata.user_id;
        const amountPaid = session.amount_total ? session.amount_total / 100 : 0;

        if (!organizationId || !emailsAmount) {
          console.error("Missing organization_id or emails_amount in metadata");
          return new Response(
            JSON.stringify({ error: "Missing metadata" }),
            { status: 400, headers: corsHeaders }
          );
        }

        // Create Supabase admin client
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get current month
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Add bonus emails using existing function
        const { data: emailsResult, error: emailsError } = await supabaseAdmin.rpc(
          "add_bonus_emails",
          {
            _organization_id: organizationId,
            _emails_amount: emailsAmount,
            _month_year: monthYear,
          }
        );

        if (emailsError) {
          console.error("Error adding bonus emails:", emailsError);
          return new Response(
            JSON.stringify({ error: "Failed to add emails" }),
            { status: 500, headers: corsHeaders }
          );
        }

        console.log("Bonus emails added:", emailsResult);

        // Send notification to the coach
        if (userId) {
          try {
            await supabaseAdmin.rpc("create_notification", {
              _user_id: userId,
              _title: "Crédits emails ajoutés !",
              _message: `${emailsAmount.toLocaleString("fr-FR")} emails ont été ajoutés à votre compte.`,
              _type: "credits",
              _metadata: { pack: packType, emails: emailsAmount },
            });
            console.log("Notification sent to user");
          } catch (notifError) {
            console.error("Error sending notification:", notifError);
          }
        }

        return new Response(
          JSON.stringify({ received: true, type: "email_credits", emails_added: emailsAmount }),
          { status: 200, headers: corsHeaders }
        );
      }

      // Check if this is a founder payment
      if (session.metadata?.offer === "founder_lifetime") {
        console.log("Processing founder payment");

        const customerEmail = session.customer_email || session.customer_details?.email;
        const customerName = session.customer_details?.name;
        const amountTotal = session.amount_total ? session.amount_total / 100 : 297;

        if (!customerEmail) {
          console.error("No customer email found in founder session");
          return new Response(
            JSON.stringify({ received: true, warning: "No customer email" }),
            { status: 200, headers: corsHeaders }
          );
        }

        // Send founder welcome email
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        try {
          console.log("Sending founder welcome email to:", customerEmail);
          const welcomeResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-transactional-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                type: "founder_welcome",
                recipientEmail: customerEmail,
                recipientName: customerName || undefined,
                amount: amountTotal,
              }),
            }
          );

          if (!welcomeResponse.ok) {
            const errorText = await welcomeResponse.text();
            console.error("Founder welcome email failed:", errorText);
          } else {
            console.log("Founder welcome email sent successfully");
          }
        } catch (emailError) {
          console.error("Error sending founder welcome email:", emailError);
        }

        return new Response(
          JSON.stringify({ received: true, type: "founder_payment" }),
          { status: 200, headers: corsHeaders }
        );
      }

      // Regular course purchase flow
      const userId = session.client_reference_id;
      const courseId = session.metadata?.course_id;
      const amountTotal = session.amount_total
        ? session.amount_total / 100
        : 0;

      if (!userId) {
        console.error("No client_reference_id found in session");
        return new Response(
          JSON.stringify({ error: "Missing user ID" }),
          { status: 400, headers: corsHeaders }
        );
      }

      if (!courseId) {
        console.error("No course_id found in session metadata");
        return new Response(
          JSON.stringify({ error: "Missing course ID" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Create Supabase admin client
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Check if purchase already exists
      const { data: existingPurchase } = await supabaseAdmin
        .from("purchases")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (existingPurchase) {
        console.log("Purchase already recorded");
        return new Response(
          JSON.stringify({ received: true, already_exists: true }),
          { status: 200, headers: corsHeaders }
        );
      }

      // Insert purchase into database
      const { data: purchase, error: insertError } = await supabaseAdmin
        .from("purchases")
        .insert({
          user_id: userId,
          course_id: courseId,
          amount: amountTotal,
          status: "completed",
          stripe_session_id: session.id,
          stripe_payment_id: session.payment_intent as string,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting purchase:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to record purchase" }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log("Purchase recorded successfully:", purchase.id);

      // Fetch course and organization info for emails and webhooks
      const { data: course, error: courseError } = await supabaseAdmin
        .from("courses")
        .select("title, organization_id")
        .eq("id", courseId)
        .single();

      if (courseError || !course) {
        console.error("Error fetching course:", courseError);
        // Continue anyway, purchase is recorded
      } else if (course.organization_id) {
        // Fetch organization including webhook settings
        const { data: org, error: orgError } = await supabaseAdmin
          .from("organizations")
          .select("slug, name, webhook_url, webhook_events")
          .eq("id", course.organization_id)
          .single();

        // Check if user is already a member
        const { data: existingMember } = await supabaseAdmin
          .from("organization_members")
          .select("id")
          .eq("organization_id", course.organization_id)
          .eq("user_id", userId)
          .maybeSingle();

        const isNewStudent = !existingMember;

        // Add student to organization if not already a member
        const { error: memberError } = await supabaseAdmin
          .from("organization_members")
          .upsert(
            {
              organization_id: course.organization_id,
              user_id: userId,
              role: "student",
            },
            { onConflict: "organization_id,user_id" }
          );

        if (memberError) {
          console.error("Error adding student to organization:", memberError);
        } else {
          console.log("Student added to organization successfully");
        }

        // Enroll user in relevant email sequences
        await enrollInSequences(
          supabaseAdmin,
          userId,
          course.organization_id,
          courseId,
          "purchase_completed"
        );

        // Fetch user info for emails and webhooks
        const { data: user, error: userError } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (userError || !user) {
          console.error("Error fetching user:", userError);
        } else {
          const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
          const courseUrl = org 
            ? `https://lovable.dev/school/${org.slug}/learning/${courseId}`
            : undefined;

          // Send outgoing webhooks if configured
          if (org?.webhook_url) {
            const webhookEvents = org.webhook_events || ["new_student", "new_purchase"];

            // Send new_student webhook if it's a new student and event is enabled
            if (isNewStudent && webhookEvents.includes("new_student")) {
              await sendOutgoingWebhook(org.webhook_url, "new_student", {
                student_email: user.email,
                student_name: user.full_name || null,
                academy_name: org.name,
                academy_slug: org.slug,
                joined_at: new Date().toISOString(),
              });
            }

            // Send new_purchase webhook if event is enabled
            if (webhookEvents.includes("new_purchase")) {
              await sendOutgoingWebhook(org.webhook_url, "new_purchase", {
                student_email: user.email,
                student_name: user.full_name || null,
                course_name: course.title,
                course_id: courseId,
                amount: amountTotal,
                currency: "EUR",
                payment_id: session.payment_intent as string,
                academy_name: org.name,
                academy_slug: org.slug,
                purchased_at: new Date().toISOString(),
              });
            }
          }

          // Send welcome email
          try {
            console.log("Sending welcome email to:", user.email);
            const welcomeResponse = await fetch(
              `${supabaseUrl}/functions/v1/send-transactional-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({
                  type: "welcome_purchase",
                  organizationId: course.organization_id,
                  recipientEmail: user.email,
                  recipientName: user.full_name || undefined,
                  courseName: course.title,
                  courseUrl: courseUrl,
                }),
              }
            );

            if (!welcomeResponse.ok) {
              const errorText = await welcomeResponse.text();
              console.error("Welcome email failed:", errorText);
            } else {
              console.log("Welcome email sent successfully");
            }
          } catch (emailError) {
            console.error("Error sending welcome email:", emailError);
          }

          // Send invoice email
          try {
            console.log("Sending invoice email to:", user.email);
            const invoiceResponse = await fetch(
              `${supabaseUrl}/functions/v1/send-transactional-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({
                  type: "invoice",
                  organizationId: course.organization_id,
                  recipientEmail: user.email,
                  recipientName: user.full_name || undefined,
                  courseName: course.title,
                  coursePrice: amountTotal,
                  purchaseDate: new Date().toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                  paymentId: session.payment_intent as string,
                }),
              }
            );

            if (!invoiceResponse.ok) {
              const errorText = await invoiceResponse.text();
              console.error("Invoice email failed:", errorText);
            } else {
              console.log("Invoice email sent successfully");
            }
          } catch (emailError) {
            console.error("Error sending invoice email:", emailError);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
