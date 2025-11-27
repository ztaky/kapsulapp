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
      
      // Log structure for debugging
      console.log("Generated content structure:", {
        hasHero: !!content.hero,
        hasProblem: !!content.problem,
        hasSolution: !!content.solution,
        hasProgram: !!content.program,
        hasTestimonials: !!content.testimonials,
        hasFaq: !!content.faq,
        hasFinalCta: !!content.final_cta,
        modulesCount: content.program?.modules?.length || 0,
        testimonialsCount: content.testimonials?.length || 0,
      });
      
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw AI response:", generatedText.substring(0, 500));
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
## STRUCTURE DEMANDÉE (JSON) - STYLE "QUEEN PREMIUM"

Cette landing page doit suivre le design system "Queen" avec des sections à fort contraste.
Retourne un objet JSON avec cette structure EXACTE :

{
  "hero": {
    "badge": "Badge au-dessus du titre (ex: Pour dirigeants, Formation Premium)",
    "headline": "Titre ultra-percutant en 8-12 mots max qui capture l'attention",
    "subheadline": "Sous-titre qui clarifie la promesse en une phrase",
    "cta_text": "Texte du bouton principal (orienté action immédiate)",
    "cta_subtext": "Texte rassurant sous le bouton (ex: Garantie 30 jours satisfait ou remboursé)"
  },
  "problem": {
    "title": "Titre de la section problème qui résonne émotionnellement",
    "agitation_text": "Paragraphe qui appuie sur la douleur et crée l'urgence (2-3 phrases max)",
    "pain_points": [
      "Ce que vit le client aujourd'hui - douleur 1 (très spécifique)",
      "Ce que vit le client aujourd'hui - douleur 2",
      "Ce que vit le client aujourd'hui - douleur 3"
    ],
    "risks": [
      "Le risque/conséquence si rien ne change - point 1",
      "Le risque/conséquence si rien ne change - point 2"
    ]
  },
  "method": {
    "title": "Pourquoi cette méthode fonctionne (titre bénéfice)",
    "description": "Explication en 2 phrases de la philosophie unique",
    "pillars": [
      {
        "number": 1,
        "title": "Pilier 1 - Court et mémorable (3-5 mots)",
        "description": "Explication du pilier en 2-3 phrases max",
        "icon": "check"
      },
      {
        "number": 2,
        "title": "Pilier 2 - Court et mémorable",
        "description": "Explication claire et concrète",
        "icon": "trending"
      },
      {
        "number": 3,
        "title": "Pilier 3 - Court et mémorable",
        "description": "Explication avec bénéfice mesurable si possible",
        "icon": "clock"
      }
    ]
  },
  "transformation": {
    "title": "Le résultat concret que vous obtenez",
    "left_card": {
      "title": "Premier résultat (ex: Votre Assistant IA)",
      "description": "Description du résultat concret en 2-3 phrases",
      "color": "orange"
    },
    "right_card": {
      "title": "Deuxième résultat (ex: Votre Co-Créateur)",
      "description": "Description du deuxième résultat concret",
      "color": "pink"
    }
  },
  "program": {
    "title": "Un programme court, dense et actionnable",
    "modules": [
      {
        "title": "Module 1 : Titre orienté résultat",
        "description": "Résumé du module en 1-2 phrases avec bénéfices clairs",
        "lessons_count": 5
      }
    ]
  },
  "trainer": {
    "tagline": "Ma mission / Mon expertise",
    "title": "Votre expert(e)",
    "bio_highlight": "Bio courte et impactante en 3-4 phrases qui établit crédibilité",
    "credentials": [
      "Accomplissement mesurable 1",
      "Accomplissement mesurable 2",
      "Accomplissement mesurable 3"
    ],
    "quote": "Citation inspirante et authentique du formateur qui révèle sa philosophie"
  },
  "testimonials": [
    {
      "name": "Prénom N.",
      "role": "Titre/Profession précise",
      "text": "Témoignage très spécifique avec résultats mesurables et transformation concrète (3-4 phrases)",
      "rating": 5
    },
    {
      "name": "Prénom M.",
      "role": "Titre/Profession",
      "text": "Témoignage authentique avec avant/après clair",
      "rating": 5
    },
    {
      "name": "Prénom L.",
      "role": "Titre/Profession",
      "text": "Témoignage qui parle d'un bénéfice spécifique inattendu",
      "rating": 5
    }
  ],
  "faq": [
    {
      "question": "Question d'objection courante 1",
      "answer": "Réponse rassurante et complète qui lève l'objection"
    },
    {
      "question": "Question d'objection courante 2",
      "answer": "Réponse avec preuve sociale ou garantie"
    },
    {
      "question": "Question pratique 3",
      "answer": "Réponse claire et pratique"
    }
  ],
  "final_cta": {
    "urgency_badge": "Message de rareté/urgence (ex: Prix de lancement expire bientôt)",
    "title": "Ne restez pas sur le quai (titre émotionnel et urgent)",
    "subtitle": "Rappel de la transformation en une phrase puissante",
    "cta_text": "Je démarre la formation maintenant",
    "guarantee": "Satisfait ou remboursé 30 jours - Sans conditions"
  }
}

## CONSIGNES CRITIQUES STYLE "QUEEN" :

**SECTION PROBLÈME (Fond sombre - Impact maximal) :**
- Titre qui pose LA question que le client se pose dans sa tête
- Agitation text : appuie sur la douleur sans être négatif, crée l'urgence
- Pain points : très spécifiques à la cible, pas génériques
- Risks : conséquences concrètes et mesurables si rien ne change

**SECTION MÉTHODE (3 Piliers) :**
- Les 3 piliers doivent être DIFFÉRENCIÉS et complémentaires
- Chaque pilier = un principe unique qui rend cette formation différente
- Pas de redondance entre les 3 piliers
- Titres courts et mémorables (style "Zéro Blabla", "Rentabilité", "Micro-Learning")

**SECTION TRANSFORMATION (2 Cartes) :**
- Les 2 résultats doivent être complémentaires mais distincts
- Chaque carte présente un aspect différent du résultat final
- Langage concret et visuel, pas abstrait

**COPYWRITING GÉNÉRAL :**
- Framework AIDA strict : Attention → Interest → Desire → Action
- Bénéfices AVANT fonctionnalités à chaque fois
- Power words émotionnels mais adaptés au public (pas de hype artificiel)
- Témoignages : résultats chiffrés ou transformations très spécifiques
- CTAs orientés bénéfice immédiat : "Je démarre", "J'accède maintenant"
- Ton : conversationnel mais expert, pragmatique mais inspirant
- Phrases courtes : 15-20 mots max
- Chiffres concrets dès que possible

**AUTHENTICITÉ PREMIUM :**
- Pas de promesses irréalistes
- Pas de formules creuses type "révolutionnaire", "secret"
- Langage direct et professionnel adapté à des dirigeants/cadres
- Focus sur résultats mesurables et transformation concrète

Retourne UNIQUEMENT le JSON, sans texte avant ou après, sans balises markdown.`;

  return prompt;
}