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
    const {
      courseId,
      courseName,
      courseContent,
      designConfig,
      targetAudience,
      trainerInfo,
      referenceScreenshots,
      cloneSourceUrl,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build expert copywriting prompt
    const prompt = buildExpertPrompt({
      courseName,
      courseContent,
      targetAudience,
      trainerInfo,
      designConfig,
      referenceScreenshots,
      cloneSourceUrl,
    });

    console.log("Generating landing page with Gemini 3 Pro...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          {
            role: "system",
            content: EXPERT_COPYWRITER_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Parse JSON from response
    let content;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0]);
      } else {
        content = JSON.parse(generatedText);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

const EXPERT_COPYWRITER_SYSTEM_PROMPT = `You are an elite copywriter specializing in high-converting landing pages for online courses and digital products.

Your expertise includes:
- AIDA Framework (Attention, Interest, Desire, Action)
- PAS Framework (Problem, Agitation, Solution)
- Psychological triggers and emotional storytelling
- Power words and social proof
- Scarcity and urgency tactics
- Benefit-driven copy over feature-focused

You write in French with:
- Clear, punchy headlines that stop scrolling
- Conversational but authoritative tone
- Short sentences and paragraphs for readability
- Bullet points for quick scanning
- Compelling CTAs that drive action
- Testimonials that feel authentic and specific

Your goal: Create landing pages that convert visitors into paying students.`;

function buildExpertPrompt({
  courseName,
  courseContent,
  targetAudience,
  trainerInfo,
  designConfig,
  referenceScreenshots,
  cloneSourceUrl,
}: any) {
  let prompt = `Crée une landing page ultra-performante pour cette formation :

## FORMATION
Nom : ${courseName}
Description : ${courseContent.description}
Nombre de modules : ${courseContent.modules?.length || 0}
Nombre total de leçons : ${courseContent.totalLessons || 0}

## CLIENT CIBLE
${targetAudience}

## FORMATEUR
Nom : ${trainerInfo.name}
Bio : ${trainerInfo.bio}

## DESIGN
Couleurs principales : ${designConfig.colors.join(", ")}
Polices : ${designConfig.fonts.heading} (titres), ${designConfig.fonts.body} (texte)
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

Retourne un objet JSON avec cette structure EXACTE :

{
  "hero": {
    "headline": "Titre ultra-percutant qui capture l'attention",
    "subheadline": "Sous-titre qui clarifie la promesse",
    "cta_text": "Texte du bouton principal",
    "cta_subtext": "Texte sous le bouton (ex: Garantie 30 jours)"
  },
  "problem": {
    "title": "Titre de la section problème",
    "pain_points": [
      "Point de douleur 1 du client cible",
      "Point de douleur 2",
      "Point de douleur 3"
    ]
  },
  "solution": {
    "title": "Titre de la section solution",
    "description": "Description de comment la formation résout les problèmes",
    "benefits": [
      { "title": "Bénéfice 1", "description": "Explication du bénéfice" },
      { "title": "Bénéfice 2", "description": "Explication" },
      { "title": "Bénéfice 3", "description": "Explication" }
    ]
  },
  "program": {
    "title": "Ce que vous allez apprendre",
    "modules": [
      { "title": "Module 1", "description": "Résumé du module", "lessons_count": 5 }
    ]
  },
  "trainer": {
    "title": "Votre formateur",
    "bio_highlight": "Version courte et impactante de la bio",
    "credentials": ["Accomplissement 1", "Accomplissement 2"],
    "quote": "Citation inspirante du formateur"
  },
  "testimonials": [
    {
      "name": "Prénom N.",
      "role": "Titre/Profession",
      "text": "Témoignage authentique et spécifique avec résultats",
      "rating": 5
    }
  ],
  "faq": [
    { "question": "Question fréquente", "answer": "Réponse rassurante" }
  ],
  "final_cta": {
    "title": "Titre final qui pousse à l'action",
    "subtitle": "Rappel de la transformation",
    "cta_text": "Texte du bouton",
    "guarantee": "Texte de la garantie satisfait ou remboursé",
    "urgency": "Message de rareté/urgence"
  }
}

CONSIGNES CRITIQUES :
- Utilise le framework AIDA pour structurer le message
- Commence chaque section par un bénéfice, pas une fonctionnalité
- Utilise des power words émotionnels (transformez, maîtrisez, libérez, découvrez)
- Les témoignages doivent mentionner des résultats spécifiques
- Les CTAs doivent être orientés action et bénéfice
- Ton conversationnel mais professionnel
- Court et scannable : phrases de max 20 mots
- Inclus des chiffres concrets quand possible

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

  return prompt;
}