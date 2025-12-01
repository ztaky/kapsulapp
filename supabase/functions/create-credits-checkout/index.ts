import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AI Credit Packs Configuration
const AI_CREDIT_PACKS = {
  starter: {
    priceId: "price_1SZSleLKhO6E8gMJNU5FPdCo",
    credits: 1000,
    price: 9,
    name: "Starter"
  },
  pro: {
    priceId: "price_1SZSmBLKhO6E8gMJVqxyieMS",
    credits: 5000,
    price: 29,
    name: "Pro"
  },
  business: {
    priceId: "price_1SZSmILKhO6E8gMJ0auG2woJ",
    credits: 15000,
    price: 69,
    name: "Business"
  }
} as const;

type PackType = keyof typeof AI_CREDIT_PACKS;

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CREDITS-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Parse request body
    const { packType, organizationId, organizationSlug } = await req.json();
    logStep("Request parsed", { packType, organizationId, organizationSlug });

    // Validate pack type
    if (!packType || !AI_CREDIT_PACKS[packType as PackType]) {
      throw new Error(`Invalid pack type: ${packType}. Valid types are: starter, pro, business`);
    }

    const pack = AI_CREDIT_PACKS[packType as PackType];
    logStep("Pack selected", { pack });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Validate organization
    if (!organizationId) {
      throw new Error("Organization ID is required");
    }

    // Use slug for URL, fallback to ID if not provided
    const urlSlug = organizationSlug || organizationId;

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: pack.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/school/${urlSlug}/studio?credits_purchase=success&pack=${packType}`,
      cancel_url: `${req.headers.get("origin")}/school/${urlSlug}/studio?credits_purchase=cancelled`,
      metadata: {
        type: "ai_credits",
        pack: packType,
        organization_id: organizationId,
        credits_amount: pack.credits.toString(),
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
