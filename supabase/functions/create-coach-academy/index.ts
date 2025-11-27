import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { academyName, slug, userId } = await req.json();

    if (!academyName || !slug || !userId) {
      throw new Error('Missing required fields: academyName, slug, userId');
    }

    console.log('Creating academy:', { academyName, slug, userId });

    // 1. Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: academyName,
        slug: slug,
        brand_color: '#ea580c', // Kapsul orange
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      throw orgError;
    }

    console.log('Organization created:', organization);

    // 2. Add user as coach
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: userId,
        role: 'coach',
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      throw memberError;
    }

    console.log('User added as coach');

    // 3. Create default design preferences
    const { error: prefsError } = await supabase
      .from('coach_design_preferences')
      .insert({
        organization_id: organization.id,
        preferred_colors: ['#ea580c', '#ec4899'],
        preferred_layout_style: 'queen',
        preferred_cta_style: 'gradient',
        preferred_fonts: {
          heading: 'Plus Jakarta Sans',
          body: 'Plus Jakarta Sans',
        },
      });

    if (prefsError) {
      console.error('Design preferences error:', prefsError);
      // Non-blocking error
    }

    console.log('Academy creation complete');

    return new Response(
      JSON.stringify({ organization, slug }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error occurred' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
