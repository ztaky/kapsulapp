import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      console.error('[generate-interactive-tool] Error tracking AI credits:', error);
      return { success: false, error: error.message };
    }

    const result = data?.[0];
    if (result && !result.success) {
      return { success: false, error: 'AI_CREDITS_LIMIT_REACHED' };
    }

    const creditsUsed = result?.new_count || 0;
    const creditsLimit = result?.credits_limit || null;
    const nearLimit = creditsLimit ? (creditsUsed / creditsLimit) >= 0.8 : false;

    console.log(`[generate-interactive-tool] AI credits: ${creditsUsed}/${creditsLimit || 'unlimited'} (nearLimit: ${nearLimit})`);
    return { success: true, nearLimit };
  } catch (error) {
    console.error('[generate-interactive-tool] Error in trackAICredits:', error);
    return { success: false, error: 'Internal error' };
  }
}

const SYSTEM_PROMPT = `Tu es un expert en création d'outils interactifs HTML/CSS/JavaScript pour des formations en ligne.

RÈGLES STRICTES :
1. Génère UNIQUEMENT du HTML valide avec CSS inline et JavaScript inline
2. L'outil doit être ENTIÈREMENT autonome (pas de dépendances externes)
3. Design moderne et professionnel avec des couleurs agréables
4. Interface responsive et accessible
5. Pas de frameworks, juste du HTML/CSS/JS pur
6. Le code doit être sécurisé (pas d'eval, pas de innerHTML non sanitisé pour les entrées utilisateur)
7. Utilise des styles inline ou une balise <style> dans le HTML
8. Le JavaScript doit être dans une balise <script> à la fin

FORMAT DE SORTIE :
Retourne UNIQUEMENT le code HTML complet, sans explication, sans markdown, sans backticks.
Le code doit commencer directement par <div> ou <style>.

EXEMPLE DE STRUCTURE :
<style>
  .tool-container { ... }
</style>
<div class="tool-container">
  <!-- Contenu de l'outil -->
</div>
<script>
  // Logique JavaScript
</script>`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, organizationId } = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Track AI credits if organizationId is provided
    let nearLimit = false;
    if (organizationId) {
      const creditsResult = await trackAICredits(organizationId);
      if (!creditsResult.success && creditsResult.error === 'AI_CREDITS_LIMIT_REACHED') {
        return new Response(
          JSON.stringify({ error: 'Limite de crédits IA atteinte', code: 'AI_CREDITS_LIMIT_REACHED' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      nearLimit = creditsResult.nearLimit || false;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Crée un outil interactif pour une formation en ligne avec les spécifications suivantes :

${description}

L'outil doit être intuitif, visuellement attrayant et fonctionnel. Génère le code HTML complet.` 
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez dans quelques minutes' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits insuffisants, veuillez recharger votre compte' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Erreur du service IA');
    }

    const data = await response.json();
    let generatedCode = data.choices?.[0]?.message?.content || '';

    // Nettoyer le code (enlever les backticks markdown si présents)
    generatedCode = generatedCode
      .replace(/^```html?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    console.log('Generated tool code length:', generatedCode.length);

    return new Response(
      JSON.stringify({ code: generatedCode, nearLimit }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating tool:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});