import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, instruction, currentSection, pageContent, trainerInfo, designConfig, prompt } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Handle image generation
    if (action === 'generate-image') {
      console.log('Generating image with prompt:', prompt);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            { 
              role: 'user', 
              content: `Generate a professional, high-quality image for a landing page: ${prompt}. 
              The image should be clean, modern, and suitable for a professional course or training program.
              Aspect ratio: 16:9, style: professional photography or clean illustration.`
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image generation error:', response.status, errorText);
        throw new Error('Image generation failed');
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        throw new Error('No image generated');
      }

      return new Response(
        JSON.stringify({ imageUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle content editing
    if (action === 'edit') {
      console.log('Processing edit instruction:', instruction);
      console.log('Current section:', currentSection);
      
      const systemPrompt = `Tu es un expert en copywriting et en création de pages de vente à haute conversion.
Tu aides les coachs et formateurs à améliorer leur contenu marketing.

CONTEXTE DE LA PAGE ACTUELLE:
${JSON.stringify(pageContent, null, 2)}

INFORMATIONS DU FORMATEUR:
${JSON.stringify(trainerInfo, null, 2)}

CONFIG DESIGN:
${JSON.stringify(designConfig, null, 2)}

SECTION EN COURS D'ÉDITION: ${currentSection || 'non spécifiée'}

RÈGLES IMPORTANTES:
1. Réponds TOUJOURS en français
2. Garde un ton professionnel mais engageant
3. Utilise des techniques de copywriting éprouvées (AIDA, PAS, etc.)
4. Sois concis et percutant
5. Adapte le style au public cible (coaches/formateurs)

FORMAT DE RÉPONSE OBLIGATOIRE:
Tu DOIS répondre UNIQUEMENT avec un objet JSON valide, sans AUCUN texte avant ou après.
Pas de markdown, pas de \`\`\`json, pas d'explication en dehors du JSON.

Structure exacte à utiliser:
{"message": "Ta réponse conversationnelle expliquant ce que tu proposes", "suggestion": {"section": "nom_de_la_section", "newValue": {"clé": "valeur"}}}

Si tu ne peux pas proposer de modification concrète:
{"message": "Ton explication ici"}

EXEMPLES DE SECTIONS ET LEUR STRUCTURE:
- hero: { badge, headline, subheadline, cta_text, cta_subtext, hero_image }
- problem: { title, agitation_text, pain_points: [], risks: [] }
- method: { title, description, pillars: [{ title, description, icon_url }] }
- transformation: { title, left_card: { title, description }, right_card: { title, description } }
- program: { title, modules: [{ title, description, lessons_count }] }
- trainer: { tagline, title, bio_highlight, credentials: [], quote }
- testimonials: [{ name, role, text, rating, avatar }]
- faq: [{ question, answer }]
- final_cta: { urgency_badge, title, subtitle, cta_text, guarantee }

RAPPEL: Réponds UNIQUEMENT en JSON, rien d'autre.`;

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
            { role: 'user', content: instruction }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Trop de requêtes, veuillez réessayer dans quelques secondes.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Crédits IA épuisés. Veuillez recharger votre compte.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error('AI gateway error');
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      
      console.log('AI raw response:', aiResponse);

      // Try to parse JSON response with robust extraction
      let parsedResponse;
      try {
        let jsonStr = aiResponse.trim();
        
        // 1. Try to extract from markdown code blocks
        const jsonCodeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        const genericCodeBlockMatch = aiResponse.match(/```\s*([\s\S]*?)\s*```/);
        
        if (jsonCodeBlockMatch) {
          jsonStr = jsonCodeBlockMatch[1].trim();
        } else if (genericCodeBlockMatch) {
          jsonStr = genericCodeBlockMatch[1].trim();
        } else {
          // 2. Try to find a JSON object in the text (looking for {"message":...)
          const jsonObjectMatch = aiResponse.match(/\{[\s\S]*"message"[\s\S]*\}/);
          if (jsonObjectMatch) {
            jsonStr = jsonObjectMatch[0];
          }
        }
        
        parsedResponse = JSON.parse(jsonStr);
        console.log('Successfully parsed JSON response');
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Raw AI response:', aiResponse);
        
        // Fallback: clean up the response and return as message
        const cleanedMessage = aiResponse
          .replace(/```json[\s\S]*?```/g, '')
          .replace(/```[\s\S]*?```/g, '')
          .replace(/^\s*\{[\s\S]*\}\s*$/g, '')
          .trim();
        
        parsedResponse = {
          message: cleanedMessage || "Je n'ai pas pu traiter votre demande correctement. Pouvez-vous reformuler ?",
          suggestion: null
        };
      }

      return new Response(
        JSON.stringify(parsedResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in edit-landing-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
