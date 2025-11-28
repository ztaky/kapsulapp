import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const mode = body.mode || "legacy";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // MODE A: Single section generation
    if (mode === "single-section") {
      return await handleSingleSection(body, LOVABLE_API_KEY);
    }

    // MODE B: Legacy full page generation
    return await handleLegacy(body, LOVABLE_API_KEY);
    
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

// MODE A: Single section generation with direct prompt
async function handleSingleSection(body: any, apiKey: string) {
  const { prompt } = body;
  
  if (!prompt) {
    throw new Error("Missing 'prompt' parameter for single-section mode");
  }

  console.log("Single-section mode: Generating with Gemini...");
  console.log("Prompt length:", prompt.length);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: SECTION_GENERATOR_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable AI Gateway Error:", response.status, errorText);
    
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
    
    throw new Error(`AI generation failed: ${response.status}`);
  }

  const data = await response.json();
  const generatedText = data.choices?.[0]?.message?.content;
  
  if (!generatedText) {
    throw new Error("Invalid response from AI Gateway");
  }

  console.log("AI Response received, length:", generatedText.length);

  // Clean and return the content
  const cleanedContent = generatedText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  return new Response(
    JSON.stringify({ content: cleanedContent }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// MODE B: Legacy full page generation
async function handleLegacy(body: any, apiKey: string) {
  const {
    courseName,
    courseContent,
    designConfig,
    targetAudience,
    trainerInfo,
    referenceScreenshots,
    cloneSourceUrl,
  } = body;

  // Build expert copywriting prompt with coach preferences
  const prompt = buildLegacyPrompt({
    courseName,
    courseContent,
    targetAudience,
    trainerInfo,
    designConfig,
    referenceScreenshots,
    cloneSourceUrl,
  });

  console.log("Legacy mode: Generating full landing page with Gemini...");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: EXPERT_DESIGNER_COPYWRITER_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API Error:", response.status, errorText);
    
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
    
    throw new Error(`AI generation failed: ${response.status}`);
  }

  const data = await response.json();
  const generatedText = data.choices[0].message.content;
  
  console.log("AI Response received, length:", generatedText.length);

  // Parse JSON from response
  let content;
  try {
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = JSON.parse(jsonMatch[0]);
    } else {
      content = JSON.parse(generatedText);
    }
    
    console.log("Generated content structure:", {
      hasHero: !!content.hero,
      hasProblem: !!content.problem,
      hasMethod: !!content.method,
      hasProgram: !!content.program,
      hasTestimonials: !!content.testimonials,
      hasFaq: !!content.faq,
      hasFinalCta: !!content.final_cta,
    });
    
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    console.error("Raw AI response:", generatedText.substring(0, 500));
    throw new Error("Failed to parse AI response");
  }

  return new Response(JSON.stringify({ content }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// System prompt for single section generation
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

Style de copywriting :
- Framework AIDA (Attention, Interest, Desire, Action)
- Framework PAS (Problem, Agitation, Solution)
- CTAs orientés bénéfice immédiat
- Témoignages spécifiques avec résultats chiffrés`;

// System prompt for legacy full page generation
const EXPERT_DESIGNER_COPYWRITER_PROMPT = `Tu es un DUO AI composé de :

1. UN DESIGNER UI/UX SENIOR spécialisé dans les landing pages premium minimalistes à fort taux de conversion.
   - Style "Queen Design System" : Épuré, minimaliste, moderne
   - Effet glass (backdrop-blur) sur les cartes
   - Ombres douces et subtiles (jamais trop appuyées)
   - JAMAIS de liserés/bordures colorées sur les côtés (border-l-4 = INTERDIT)
   - Dégradés UNIQUEMENT pour les CTAs
   - Cartes blanches avec coins très arrondis (rounded-3xl)
   - Espaces généreux, hiérarchie visuelle claire
   - Contraste fort entre sections (fonds clairs alternés avec fonds sombres)
   - Responsive first : mobile → tablette → desktop

2. UN COPYWRITER EXPERT en pages de vente premium.
   - Framework AIDA (Attention, Interest, Desire, Action) + PAS (Problem, Agitation, Solution)
   - Ton : Conversationnel mais expert, pragmatique mais inspirant
   - Power words émotionnels sans hype artificiel
   - Résultats mesurables et transformation concrète
   - Phrases courtes (15-20 mots max)
   - Bénéfices AVANT fonctionnalités
   - Témoignages spécifiques avec résultats chiffrés
   - CTAs orientés bénéfice immédiat
   
Ta mission : Créer des landing pages qui convertissent à 10%+ grâce à un design épuré et un copywriting percutant.`;

function buildLegacyPrompt({
  courseName,
  courseContent,
  targetAudience,
  trainerInfo,
  designConfig,
  referenceScreenshots,
  cloneSourceUrl,
}: any) {
  let prompt = `Crée une landing page ultra-performante style "Queen Design" pour cette formation :

## FORMATION
Nom : ${courseName}
Description : ${courseContent?.description || 'Non spécifiée'}
Nombre de modules : ${courseContent?.modules?.length || 0}
Nombre total de leçons : ${courseContent?.totalLessons || 0}

## CLIENT CIBLE
${targetAudience || 'Non spécifié'}

## FORMATEUR
Nom : ${trainerInfo?.name || 'Non spécifié'}
Bio : ${trainerInfo?.bio || 'Non spécifiée'}

## DESIGN
Couleurs principales : ${designConfig?.colors?.join(", ") || 'Non spécifiées'}
Polices : ${designConfig?.fonts?.heading || 'Non spécifiée'} (titres), ${designConfig?.fonts?.body || 'Non spécifiée'} (texte)
Style CTA : ${designConfig?.ctaStyle === 'gradient' ? 'Dégradé de couleurs' : 'Couleur unie'}
`;

  if (referenceScreenshots && referenceScreenshots.length > 0) {
    prompt += `\n## RÉFÉRENCES VISUELLES
${referenceScreenshots.length} screenshots fournis pour inspiration\n`;
  }

  if (cloneSourceUrl) {
    prompt += `\n## DESIGN À CLONER
URL source : ${cloneSourceUrl}
Instructions : Reproduis la structure et le style visuel de cette page\n`;
  }

  prompt += `
## STRUCTURE DEMANDÉE (JSON)

Retourne un objet JSON avec cette structure :

{
  "hero": {
    "badge": "Badge au-dessus du titre",
    "headline": "Titre ultra-percutant en 8-12 mots",
    "subheadline": "Sous-titre qui clarifie la promesse",
    "cta_text": "Texte du bouton principal",
    "cta_subtext": "Texte rassurant sous le bouton"
  },
  "problem": {
    "title": "Titre de la section problème",
    "agitation_text": "Paragraphe qui appuie sur la douleur",
    "pain_points": ["Point 1", "Point 2", "Point 3"],
    "risks": ["Risque 1", "Risque 2"]
  },
  "method": {
    "title": "Pourquoi cette méthode fonctionne",
    "description": "Explication de la philosophie",
    "pillars": [
      { "number": 1, "title": "Pilier 1", "description": "Description", "icon": "check" },
      { "number": 2, "title": "Pilier 2", "description": "Description", "icon": "trending" },
      { "number": 3, "title": "Pilier 3", "description": "Description", "icon": "clock" }
    ]
  },
  "transformation": {
    "title": "Le résultat concret",
    "left_card": { "title": "Résultat 1", "description": "Description", "color": "orange" },
    "right_card": { "title": "Résultat 2", "description": "Description", "color": "pink" }
  },
  "program": {
    "title": "Programme",
    "modules": [
      { "title": "Module 1", "description": "Résumé", "lessons_count": 5 }
    ]
  },
  "trainer": {
    "tagline": "Mission",
    "title": "Votre expert(e)",
    "bio_highlight": "Bio courte",
    "credentials": ["Accomplissement 1", "Accomplissement 2"],
    "quote": "Citation inspirante"
  },
  "testimonials": [
    { "name": "Prénom N.", "role": "Profession", "text": "Témoignage", "rating": 5 }
  ],
  "faq": [
    { "question": "Question 1", "answer": "Réponse 1" }
  ],
  "final_cta": {
    "urgency_badge": "Message d'urgence",
    "title": "Titre émotionnel",
    "subtitle": "Rappel de la transformation",
    "cta_text": "Je démarre maintenant",
    "guarantee": "Satisfait ou remboursé 30 jours"
  }
}

Retourne UNIQUEMENT le JSON, sans texte avant ou après, sans balises markdown.`;

  return prompt;
}
