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
      
      const systemPrompt = `Tu es un expert en COPYWRITING et en DESIGN de pages de vente à haute conversion.
Tu aides les coachs et formateurs à améliorer leur contenu ET leur design.

CONTEXTE DE LA PAGE ACTUELLE:
${JSON.stringify(pageContent, null, 2)}

INFORMATIONS DU FORMATEUR:
${JSON.stringify(trainerInfo, null, 2)}

CONFIG DESIGN ACTUELLE:
${JSON.stringify(designConfig, null, 2)}

SECTION EN COURS D'ÉDITION: ${currentSection || 'non spécifiée'}

TU AS 2 TYPES DE CAPACITÉS:

1. COPYWRITING (type: "content")
   - Modifier les textes (titres, descriptions, témoignages, FAQ, etc.)
   - Améliorer les accroches, CTA, arguments de vente
   - Sections disponibles: hero, problem, method, transformation, program, trainer, testimonials, faq, final_cta

2. DESIGN (type: "design")
   - Modifier les couleurs (palette.primary, palette.secondary)
   - Modifier les polices (fonts.heading, fonts.body)
   - Changer le thème (theme: "light" ou "dark")
   
   Polices disponibles: Inter, Poppins, Roboto, Montserrat, Open Sans, Lato, Playfair Display, Merriweather, Oswald, Raleway

RÈGLES IMPORTANTES:
1. Réponds TOUJOURS en français
2. Garde un ton professionnel mais engageant
3. Utilise des techniques de copywriting éprouvées (AIDA, PAS, etc.)
4. Pour le design, propose des changements harmonieux et professionnels
5. Si l'utilisateur demande un changement de couleur/police/thème, utilise type: "design"
6. Si l'utilisateur demande un changement de texte, utilise type: "content"

FORMAT DE RÉPONSE OBLIGATOIRE:
Tu DOIS répondre UNIQUEMENT avec un objet JSON valide, sans AUCUN texte avant ou après.

Pour une modification de CONTENU:
{"message": "Explication de ta suggestion", "suggestion": {"type": "content", "section": "hero", "newValue": {"headline": "Nouveau titre"}}}

Pour une modification de DESIGN:
{"message": "Explication de ta suggestion", "suggestion": {"type": "design", "designKey": "palette.primary", "newValue": "#3B82F6"}}

Exemples de designKey valides:
- "palette.primary" -> couleur principale (hex)
- "palette.secondary" -> couleur secondaire (hex)
- "fonts.heading" -> police des titres
- "fonts.body" -> police du texte
- "theme" -> "light" ou "dark"

Si tu ne peux pas proposer de modification:
{"message": "Ton explication ici", "suggestion": null}

EXEMPLES DE SECTIONS CONTENT ET LEUR STRUCTURE:
- hero: { badge, headline, subheadline, cta_text, cta_subtext, hero_image }
- problem: { title, agitation_text, pain_points: [], risks: [] }
- method: { title, description, pillars: [{ title, description, icon_url }] }
- transformation: { title, left_card: { title, description }, right_card: { title, description } }
- program: { title, modules: [{ title, description, lessons_count }] }
- trainer: { tagline, title, bio_highlight, credentials: [], quote }
- testimonials: [{ name, role, text, rating, avatar }]
- faq: [{ question, answer }]
- final_cta: { urgency_badge, title, subtitle, cta_text, guarantee }

RAPPEL CRITIQUE: Réponds UNIQUEMENT en JSON valide, rien d'autre avant ou après.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-preview',
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
          // 2. Try to find a JSON object with "message" key
          const jsonObjectMatch = aiResponse.match(/\{[\s\S]*"message"[\s\S]*\}/);
          if (jsonObjectMatch) {
            // Find the balanced JSON object
            let depth = 0;
            let start = -1;
            let end = -1;
            for (let i = 0; i < aiResponse.length; i++) {
              if (aiResponse[i] === '{') {
                if (depth === 0) start = i;
                depth++;
              } else if (aiResponse[i] === '}') {
                depth--;
                if (depth === 0 && start !== -1) {
                  end = i + 1;
                  break;
                }
              }
            }
            if (start !== -1 && end !== -1) {
              jsonStr = aiResponse.slice(start, end);
            }
          }
        }
        
        parsedResponse = JSON.parse(jsonStr);
        console.log('Successfully parsed JSON response:', parsedResponse);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Raw AI response:', aiResponse);
        
        // Fallback: clean up the response and return as message
        const cleanedMessage = aiResponse
          .replace(/```json[\s\S]*?```/g, '')
          .replace(/```[\s\S]*?```/g, '')
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
