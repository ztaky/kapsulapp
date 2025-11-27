import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

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

    // Gérer l'événement checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Checkout session completed:", session.id);

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

      // Créer le client Supabase avec la clé service
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Vérifier si l'achat existe déjà
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

      // Insérer l'achat dans la base de données
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
