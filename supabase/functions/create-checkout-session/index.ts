import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Guest checkout: authentication is now OPTIONAL
    const authHeader = req.headers.get("Authorization");
    let user = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser(token);
      if (!userError && authUser) {
        user = authUser;
        console.log("Authenticated user:", user.email);
      }
    }
    
    console.log("Guest checkout enabled:", !user);

    const { courseId, successUrl, cancelUrl, paymentType = "full" } = await req.json();

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: "Missing courseId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get course details with installment fields
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("*, organizations:organization_id(*)")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      console.error("Course not found:", courseError);
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const organization = course.organizations;
    const origin = req.headers.get("origin") || "https://lovable.dev";

    // Check if organization has a connected Stripe account
    if (organization?.stripe_account_id) {
      console.log(`Using connected account: ${organization.stripe_account_id}`);

      // Verify the connected account is ready for charges
      const account = await stripe.accounts.retrieve(organization.stripe_account_id);
      
      if (!account.charges_enabled) {
        console.error("Connected account not ready for charges");
        return new Response(
          JSON.stringify({ error: "Stripe account not fully configured" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prepare common session config
      const baseMetadata = {
        course_id: courseId,
        organization_id: organization.id,
        payment_type: paymentType,
        is_guest: user ? "false" : "true",
        ...(user && { user_id: user.id }),
      };

      // Handle installment payment
      if (paymentType === "installments" && course.installments_enabled && course.installment_price_id) {
        console.log(`Creating installment checkout: ${course.installments_count}x payments`);
        
        const installmentsCount = course.installments_count || 3;
        const monthlyAmount = Math.ceil((course.price * 100) / installmentsCount);

        // Create subscription checkout session with cancellation after N payments
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: course.installment_price_id,
              quantity: 1,
            },
          ],
          // For authenticated users, use client_reference_id; for guests, let Stripe collect email
          ...(user && { client_reference_id: user.id }),
          ...(user && { customer_email: user.email }),
          metadata: {
            ...baseMetadata,
            total_installments: installmentsCount.toString(),
          },
          subscription_data: {
            metadata: {
              ...baseMetadata,
              total_installments: installmentsCount.toString(),
              payments_made: "0",
            },
            application_fee_percent: 10,
            transfer_data: {
              destination: organization.stripe_account_id,
            },
          },
          success_url: successUrl || `${origin}/school/${organization.slug}/learn/${courseId}?success=true&type=installments`,
          cancel_url: cancelUrl || `${origin}/school/${organization.slug}/course/${courseId}?canceled=true`,
        });

        console.log(`Created installment checkout session: ${session.id} (guest: ${!user})`);

        return new Response(
          JSON.stringify({ url: session.url, sessionId: session.id, type: "installments" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Handle full payment (one-time)
      const amount = Math.round(course.price * 100);
      const applicationFeeAmount = Math.round(amount * 0.10);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: course.title,
                description: course.description || undefined,
                images: course.cover_image ? [course.cover_image] : undefined,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        // For authenticated users, use client_reference_id; for guests, let Stripe collect email
        ...(user && { client_reference_id: user.id }),
        ...(user && { customer_email: user.email }),
        metadata: baseMetadata,
        success_url: successUrl || `${origin}/school/${organization.slug}/learn/${courseId}?success=true`,
        cancel_url: cancelUrl || `${origin}/school/${organization.slug}/course/${courseId}?canceled=true`,
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: organization.stripe_account_id,
          },
        },
      });

      console.log(`Created checkout session: ${session.id} with connected account (guest: ${!user})`);

      return new Response(
        JSON.stringify({ url: session.url, sessionId: session.id, type: "full" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // No Stripe Connect - return clear error
      console.error("Organization has no Stripe Connect account configured");
      return new Response(
        JSON.stringify({ 
          error: "Stripe Connect non configuré. Le formateur doit connecter son compte Stripe pour recevoir les paiements.",
          code: "STRIPE_NOT_CONNECTED"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
