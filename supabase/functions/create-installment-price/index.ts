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

    const { courseId, totalPrice, installmentsCount } = await req.json();

    if (!courseId || !totalPrice || !installmentsCount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating installment price: ${totalPrice}€ in ${installmentsCount}x for course ${courseId}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("title, organization_id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      console.error("Course not found:", courseError);
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate monthly price (round up to avoid losing cents)
    const monthlyAmount = Math.ceil((totalPrice * 100) / installmentsCount);

    // Create or update Stripe product for the course
    let productId: string;
    
    // Search for existing product
    const products = await stripe.products.search({
      query: `metadata['course_id']:'${courseId}'`,
      limit: 1,
    });

    if (products.data.length > 0) {
      productId = products.data[0].id;
      console.log(`Found existing product: ${productId}`);
    } else {
      // Create new product
      const product = await stripe.products.create({
        name: `${course.title} (${installmentsCount}x)`,
        metadata: {
          course_id: courseId,
          type: "installment",
        },
      });
      productId = product.id;
      console.log(`Created new product: ${productId}`);
    }

    // Create recurring price for installments
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: monthlyAmount,
      currency: "eur",
      recurring: {
        interval: "month",
        interval_count: 1,
      },
      metadata: {
        course_id: courseId,
        total_installments: installmentsCount.toString(),
        total_price: totalPrice.toString(),
        type: "installment",
      },
    });

    console.log(`Created installment price: ${price.id} - ${monthlyAmount / 100}€/month x ${installmentsCount}`);

    // Update course with installment settings
    const { error: updateError } = await supabaseAdmin
      .from("courses")
      .update({
        installments_enabled: true,
        installments_count: installmentsCount,
        installment_price_id: price.id,
      })
      .eq("id", courseId);

    if (updateError) {
      console.error("Error updating course:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update course" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        priceId: price.id,
        monthlyAmount: monthlyAmount / 100,
        installmentsCount,
        totalPrice,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating installment price:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
