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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { courseId, successUrl, cancelUrl } = await req.json();

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

    // Get course details
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

      // Calculate platform fee (10%)
      const amount = Math.round(course.price * 100); // Convert to cents
      const applicationFeeAmount = Math.round(amount * 0.10); // 10% platform fee

      // Create checkout session with connected account
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
        client_reference_id: user.id,
        customer_email: user.email,
        metadata: {
          course_id: courseId,
          organization_id: organization.id,
          user_id: user.id,
        },
        success_url: successUrl || `${origin}/school/${organization.slug}/learning/${courseId}?success=true`,
        cancel_url: cancelUrl || `${origin}/school/${organization.slug}/course/${courseId}?canceled=true`,
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: organization.stripe_account_id,
          },
        },
      }, {
        stripeAccount: undefined, // Use platform account for the session
      });

      console.log(`Created checkout session: ${session.id} with connected account`);

      return new Response(
        JSON.stringify({ url: session.url, sessionId: session.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Fallback: Use existing payment link if no connected account
      if (course.payment_link_url) {
        console.log("Using existing payment link");
        return new Response(
          JSON.stringify({ url: course.payment_link_url }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "No payment method configured for this course" }),
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
