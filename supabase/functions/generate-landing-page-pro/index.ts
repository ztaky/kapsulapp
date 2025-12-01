import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to track AI credits
async function trackAICredits(organizationId: string): Promise<{ success: boolean; error?: string; nearLimit?: boolean }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data, error } = await supabase.rpc('increment_ai_credits', {
      _organization_id: organizationId,
      _month_year: monthYear,
      _amount: 1
    });

    if (error) {
      console.error('[generate-landing-page-pro] Error tracking AI credits:', error);
      return { success: false, error: error.message };
    }

    const result = data?.[0];
    if (result && !result.success) {
      return { success: false, error: 'AI_CREDITS_LIMIT_REACHED' };
    }

    const creditsUsed = result?.new_count || 0;
    const creditsLimit = result?.credits_limit || null;
    const nearLimit = creditsLimit ? (creditsUsed / creditsLimit) >= 0.8 : false;

    console.log(`[generate-landing-page-pro] AI credits: ${creditsUsed}/${creditsLimit || 'unlimited'} (nearLimit: ${nearLimit})`);
    return { success: true, nearLimit };
  } catch (error) {
    console.error('[generate-landing-page-pro] Error in trackAICredits:', error);
    return { success: false, error: 'Internal error' };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { prompt, organizationId } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    if (!prompt) {
      throw new Error("Missing 'prompt' parameter");
    }

    // Track AI credits if organizationId is provided
    let nearLimit = false;
    if (organizationId) {
      const creditsResult = await trackAICredits(organizationId);
      if (!creditsResult.success && creditsResult.error === 'AI_CREDITS_LIMIT_REACHED') {
        return new Response(
          JSON.stringify({ error: 'AI credits limit reached', code: 'AI_CREDITS_LIMIT_REACHED' }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      nearLimit = creditsResult.nearLimit || false;
    }

    console.log("Generating section with Gemini 2.5 Flash...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SECTION_GENERATOR_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error("No content in Gemini response");
    }

    // Clean markdown artifacts
    const cleanedContent = generatedText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log("Section generated successfully");

    return new Response(
      JSON.stringify({ content: cleanedContent, nearLimit }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: any) {
    console.error("Error in generate-landing-page-pro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// System prompt for section generation
const SECTION_GENERATOR_SYSTEM_PROMPT = `Tu es un expert en copywriting et design de landing pages premium.

Ta mission : Générer une section de landing page au format JSON EXACT demandé.

RÈGLES STRICTES :
1. Retourne UNIQUEMENT du JSON valide, sans texte avant ou après
2. Pas de balises markdown (pas de \`\`\`json)
3. Respecte la structure demandée à la lettre
4. Copywriting percutant : bénéfices > fonctionnalités
5. Phrases courtes (15-20 mots max)
6. Ton conversationnel mais expert
7. Résultats mesurables et concrets
8. Power words émotionnels sans hype artificiel
9. Tutoiement systématique
10. Zéro jargon technique

STYLE COPYWRITING :
- Framework AIDA (Attention → Interest → Desire → Action)
- Framework PAS (Problem → Agitation → Solution)
- Headlines : 8-12 mots MAX, promesse de transformation claire
- CTAs : Orientés bénéfice ("Je transforme ma vie" > "S'inscrire")
- Témoignages : Résultats spécifiques et chiffrés

COMMENCE TA RÉPONSE PAR { ET TERMINE PAR }`;
