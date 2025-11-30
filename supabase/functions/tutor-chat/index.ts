import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, courseContext, currentLessonTitle } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build rich system prompt with full course context
    let systemPrompt = `Tu es Kapsul, un tuteur pédagogique bienveillant, encourageant et expert.

Règles de communication :
- Réponds de façon concise (max 200 mots sauf si l'étudiant demande plus de détails)
- Encourage l'action et la pratique
- Utilise des exemples concrets liés au contenu du cours
- Félicite les efforts et progrès
- Si l'étudiant bloque, propose des indices plutôt que des réponses directes
- Utilise des émojis avec parcimonie pour rendre tes réponses plus engageantes 🎯
- Adopte un ton amical et motivant
- Contextualise toujours tes réponses par rapport au cours

`;

    if (courseContext) {
      systemPrompt += `\n=== CONTEXTE DU COURS ===\n${courseContext}\n=== FIN DU CONTEXTE ===\n\n`;
    }

    if (currentLessonTitle) {
      systemPrompt += `L'étudiant est actuellement sur la leçon : "${currentLessonTitle}"
Priorise les réponses en lien avec cette leçon, mais tu peux aussi répondre aux questions sur les autres parties du cours.`;
    }

    console.log('Tutor chat request - lesson:', currentLessonTitle);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('tutor-chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
