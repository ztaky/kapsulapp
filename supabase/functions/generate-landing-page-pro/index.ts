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
      organizationId,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build expert copywriting prompt with coach preferences
    const prompt = await buildExpertPrompt({
      courseName,
      courseContent,
      targetAudience,
      trainerInfo,
      designConfig,
      referenceScreenshots,
      cloneSourceUrl,
      organizationId,
    });

    console.log("Generating landing page with Gemini 3 Pro...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

async function buildExpertPrompt({
  courseName,
  courseContent,
  targetAudience,
  trainerInfo,
  designConfig,
  referenceScreenshots,
  cloneSourceUrl,
  organizationId,
}: any) {
  let prompt = `Crée une landing page ultra-performante style "Queen Design" pour cette formation :

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
Style CTA : ${designConfig.ctaStyle === 'gradient' ? 'Dégradé de couleurs' : 'Couleur unie'}
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

Cette landing page doit suivre le design system "Queen" avec :
- Des cartes glass effect (backdrop-blur, bg-white/95)
- AUCUN liseré coloré sur les côtés (border-l-4 = INTERDIT)
- Des sections à fort contraste (fond clair / fond sombre)
- Des dégradés UNIQUEMENT sur les CTAs
- Des marges responsive (px-5 sm:px-8 lg:px-12)
- Des cartes arrondies (rounded-3xl) avec hover effects subtils

Retourne un objet JSON avec cette structure EXACTE :

{
  "hero": {
    "badge": "Badge au-dessus du titre (ex: Formation Premium, Pour Dirigeants)",
    "headline": "Titre ultra-percutant en 8-12 mots max qui capture l'attention",
    "subheadline": "Sous-titre qui clarifie la promesse en une phrase",
    "cta_text": "Texte du bouton principal (orienté action immédiate)",
    "cta_subtext": "Texte rassurant sous le bouton (ex: Garantie 30 jours)"
  },
  "problem": {
    "title": "Titre de la section problème qui résonne émotionnellement",
    "agitation_text": "Paragraphe qui appuie sur la douleur et crée l'urgence (2-3 phrases max)",
    "pain_points": [
      "Point de douleur spécifique 1 - très concret (pas générique)",
      "Point de douleur spécifique 2 - lié à leur quotidien",
      "Point de douleur spécifique 3 - émotionnellement chargé"
    ],
    "risks": [
      "Risque/conséquence mesurable si rien ne change - point 1",
      "Risque/conséquence concrète si rien ne change - point 2"
    ]
  },
  "method": {
    "title": "Pourquoi cette méthode fonctionne (titre bénéfice, pas feature)",
    "description": "Explication en 2 phrases de la philosophie unique de cette méthode",
    "pillars": [
      {
        "number": 1,
        "title": "Pilier 1 - Court et mémorable (3-5 mots max)",
        "description": "Explication du pilier en 2-3 phrases max avec bénéfice clair",
        "icon": "check"
      },
      {
        "number": 2,
        "title": "Pilier 2 - DIFFÉRENT du pilier 1 (3-5 mots)",
        "description": "Explication claire et concrète, complémentaire au pilier 1",
        "icon": "trending"
      },
      {
        "number": 3,
        "title": "Pilier 3 - DIFFÉRENT des 2 autres (3-5 mots)",
        "description": "Explication avec bénéfice mesurable si possible",
        "icon": "clock"
      }
    ]
  },
  "transformation": {
    "title": "Le résultat concret que vous obtenez (orienté bénéfice)",
    "left_card": {
      "title": "Premier résultat concret (ex: Votre Assistant IA Personnel)",
      "description": "Description du résultat en 2-3 phrases, très visuelle et concrète",
      "color": "orange"
    },
    "right_card": {
      "title": "Deuxième résultat COMPLÉMENTAIRE (ex: Votre Co-Créateur de Contenu)",
      "description": "Description du deuxième résultat, différent mais complémentaire",
      "color": "pink"
    }
  },
  "program": {
    "title": "Un programme court, dense et actionnable",
    "modules": [
      {
        "title": "Module 1 : Titre orienté résultat (pas description)",
        "description": "Résumé du module en 1-2 phrases avec bénéfices clairs",
        "lessons_count": 5
      },
      {
        "title": "Module 2 : Titre orienté résultat",
        "description": "Résumé avec transformation concrète",
        "lessons_count": 4
      }
    ]
  },
  "trainer": {
    "tagline": "Ma mission / Mon expertise en une phrase",
    "title": "Votre expert(e)",
    "bio_highlight": "Bio courte et impactante en 3-4 phrases qui établit crédibilité et légitimité",
    "credentials": [
      "Accomplissement mesurable 1 (avec chiffres si possible)",
      "Accomplissement mesurable 2",
      "Accomplissement mesurable 3"
    ],
    "quote": "Citation inspirante et authentique du formateur qui révèle sa philosophie"
  },
  "testimonials": [
    {
      "name": "Prénom N.",
      "role": "Titre/Profession précise",
      "text": "Témoignage très spécifique avec résultats mesurables et transformation concrète (3-4 phrases). Mentionner un avant/après clair.",
      "rating": 5
    },
    {
      "name": "Prénom M.",
      "role": "Titre/Profession différente",
      "text": "Témoignage authentique avec un angle différent (résultat inattendu ou bénéfice secondaire surprenant)",
      "rating": 5
    },
    {
      "name": "Prénom L.",
      "role": "Titre/Profession différente",
      "text": "Témoignage qui parle d'un bénéfice spécifique et mesurable (chiffres, délais, ROI)",
      "rating": 5
    }
  ],
  "faq": [
    {
      "question": "Question d'objection courante 1 (ex: combien de temps ça prend ?)",
      "answer": "Réponse rassurante et complète qui lève l'objection avec preuve sociale"
    },
    {
      "question": "Question d'objection courante 2 (ex: est-ce que ça marche pour moi ?)",
      "answer": "Réponse avec garantie ou témoignage qui rassure"
    },
    {
      "question": "Question pratique 3 (ex: comment accéder au contenu ?)",
      "answer": "Réponse claire et pratique"
    },
    {
      "question": "Question technique 4 (ex: ai-je besoin de compétences préalables ?)",
      "answer": "Réponse qui élargit l'audience cible"
    }
  ],
  "final_cta": {
    "urgency_badge": "Message de rareté/urgence (ex: Prix de lancement expire bientôt, Places limitées)",
    "title": "Ne restez pas sur le quai (titre émotionnel et urgent)",
    "subtitle": "Rappel de la transformation en une phrase puissante",
    "cta_text": "Je démarre la formation maintenant",
    "guarantee": "Satisfait ou remboursé 30 jours - Sans conditions ni justifications"
  }
}

## CONSIGNES CRITIQUES STYLE "QUEEN" :

**DESIGN ÉPURÉ :**
- Cartes blanches avec effet glass (backdrop-blur-sm bg-white/95)
- AUCUN border-l-4 nulle part (liserés colorés = INTERDIT)
- Coins très arrondis (rounded-3xl partout)
- Ombres douces (shadow-lg, pas shadow-xl)
- Hover effects subtils (hover:-translate-y-1, hover:shadow-xl)
- Dégradés UNIQUEMENT sur les CTAs finaux

**SECTION PROBLÈME (Fond sombre ${designConfig.colors[1] || '#1a1a1a'}) :**
- Titre qui pose LA question que le client se pose
- Pain points dans des cartes glass semi-transparentes (bg-white/5)
- Très spécifiques à la cible, pas génériques
- Risks dans des cartes colorées subtiles avec l'accent tertiary

**SECTION MÉTHODE (3 Piliers) :**
- Les 3 piliers doivent être TRÈS DIFFÉRENTS et complémentaires
- Pas de redondance ! Chaque pilier = un principe unique
- Titres courts style "Zéro Blabla", "Action Directe", "Résultats Rapides"
- Cartes glass avec numéro coloré en haut (pas de border-l)

**SECTION TRANSFORMATION (2 Cartes) :**
- Résultats complémentaires mais distincts
- Langage concret et visuel, pas abstrait
- Cartes avec fond légèrement coloré (primaryLight, secondaryLight)

**PROGRAMME (Timeline épurée) :**
- Ligne verticale fine à gauche (w-0.5, pas w-1)
- Cercles numérotés DÉTACHÉS des cartes
- Cartes blanches glass SANS border-l-4
- Mobile first : numéro intégré dans le titre sur petit écran

**COPYWRITING EXPERT :**
- Framework AIDA strict
- Bénéfices AVANT fonctionnalités
- Power words émotionnels adaptés (pas de hype)
- Témoignages : résultats chiffrés ou transformations spécifiques
- CTAs orientés bénéfice : "Je démarre", "J'accède maintenant"
- Ton conversationnel mais expert
- Phrases courtes : 15-20 mots max
- Chiffres concrets dès que possible

**AUTHENTICITÉ PREMIUM :**
- Pas de promesses irréalistes
- Pas de formules creuses ("révolutionnaire", "secret")
- Langage direct adapté à des professionnels
- Focus sur résultats mesurables

**RESPONSIVE FIRST :**
- Marges : px-5 sm:px-8 lg:px-12
- Titres : text-3xl sm:text-4xl md:text-5xl lg:text-6xl
- Espacement : py-16 sm:py-20 lg:py-24

Retourne UNIQUEMENT le JSON, sans texte avant ou après, sans balises markdown.`;

  return prompt;
}
