import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[VERIFY-FOUNDER-PAYMENT] Starting payment verification");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    console.log("[VERIFY-FOUNDER-PAYMENT] Verifying session:", sessionId);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("[VERIFY-FOUNDER-PAYMENT] Session status:", session.payment_status);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        verified: false, 
        error: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if this is a founder offer payment
    const isFounderOffer = session.metadata?.offer === "founder_lifetime";
    if (!isFounderOffer) {
      return new Response(JSON.stringify({ 
        verified: false, 
        error: "Not a founder offer payment" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("[VERIFY-FOUNDER-PAYMENT] Payment verified successfully");

    return new Response(JSON.stringify({
      verified: true,
      email: session.customer_details?.email || null,
      name: session.customer_details?.name || null,
      amountPaid: session.amount_total,
      paymentIntentId: session.payment_intent,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[VERIFY-FOUNDER-PAYMENT] Error:", errorMessage);
    return new Response(JSON.stringify({ 
      verified: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
