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
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { organizationId } = await req.json();

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: "Missing organizationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get organization's Stripe account ID
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("stripe_account_id")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: "Organization not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!org.stripe_account_id) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          accountId: null,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch account details from Stripe
    try {
      const account = await stripe.accounts.retrieve(org.stripe_account_id);
      
      console.log(`Stripe account status for ${org.stripe_account_id}:`, {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      });

      return new Response(
        JSON.stringify({
          connected: true,
          accountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          email: account.email,
          businessProfile: account.business_profile,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (stripeError: any) {
      console.error("Error fetching Stripe account:", stripeError);
      
      // If account doesn't exist on Stripe, clear it from our DB
      if (stripeError?.code === "account_invalid") {
        await supabaseAdmin
          .from("organizations")
          .update({ stripe_account_id: null })
          .eq("id", organizationId);
      }

      return new Response(
        JSON.stringify({ 
          connected: false,
          accountId: null,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
          error: "Account not found or invalid"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error checking Stripe Connect status:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
