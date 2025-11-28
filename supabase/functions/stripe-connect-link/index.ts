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

    // Create Supabase client to get user
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
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { organizationId, returnUrl } = await req.json();

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: "Missing organizationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating Stripe Connect OAuth link for org: ${organizationId}`);

    // Create Stripe Connect account link using OAuth
    // First, we need to create a Stripe account (if one doesn't exist)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if org already has a Stripe account
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("stripe_account_id, name")
      .eq("id", organizationId)
      .single();

    if (orgError) {
      console.error("Error fetching org:", orgError);
      return new Response(
        JSON.stringify({ error: "Organization not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accountId = org.stripe_account_id;

    // If no account exists, create a new Express account
    if (!accountId) {
      console.log("Creating new Stripe Express account");
      
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          organization_id: organizationId,
          user_id: user.id,
        },
      });

      accountId = account.id;
      console.log(`Created Stripe account: ${accountId}`);

      // Save the account ID to the organization
      const { error: updateError } = await supabaseAdmin
        .from("organizations")
        .update({ stripe_account_id: accountId })
        .eq("id", organizationId);

      if (updateError) {
        console.error("Error saving Stripe account ID:", updateError);
      }
    }

    // Create account link for onboarding
    const origin = req.headers.get("origin") || returnUrl || "https://lovable.dev";
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/school/${organizationId}/studio/branding?stripe_refresh=true`,
      return_url: `${origin}/school/${organizationId}/studio/branding?stripe_connected=true`,
      type: "account_onboarding",
    });

    console.log(`Created account link for account: ${accountId}`);

    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        accountId: accountId 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating Stripe Connect link:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
