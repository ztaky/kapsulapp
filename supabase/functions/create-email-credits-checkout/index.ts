import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_PACKS = {
  starter: {
    priceId: "price_1SZXWiLKhO6E8gMJPTEl1Jw8",
    emails: 1000,
    price: 9,
    name: "Pack Emails Starter",
  },
  pro: {
    priceId: "price_1SZXWjLKhO6E8gMJopAlpYJE",
    emails: 5000,
    price: 29,
    name: "Pack Emails Pro",
  },
  business: {
    priceId: "price_1SZXWkLKhO6E8gMJJP0TMNsS",
    emails: 15000,
    price: 69,
    name: "Pack Emails Business",
  },
};

type PackType = keyof typeof EMAIL_PACKS;

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-EMAIL-CREDITS-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { packType, organizationId, organizationSlug } = await req.json();
    logStep("Received request", { packType, organizationId, organizationSlug });

    if (!packType || !EMAIL_PACKS[packType as PackType]) {
      throw new Error("Invalid pack type");
    }

    if (!organizationId || !organizationSlug) {
      throw new Error("Missing organization info");
    }

    const pack = EMAIL_PACKS[packType as PackType];
    logStep("Pack selected", { pack: pack.name, emails: pack.emails });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";
    const successUrl = `${origin}/school/${organizationSlug}/studio/emails?email_purchase=success`;
    const cancelUrl = `${origin}/school/${organizationSlug}/studio/emails`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price: pack.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: "email_credits",
        pack: packType,
        emails_amount: pack.emails.toString(),
        organization_id: organizationId,
        organization_slug: organizationSlug,
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
