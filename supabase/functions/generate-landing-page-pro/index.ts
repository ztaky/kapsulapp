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

    // MODE A: Single section generation (Gemini only - fast)
    if (mode === "single-section") {
      return await handleSingleSection(body, LOVABLE_API_KEY);
    }

    // MODE B: Dual-model full page generation (Gemini + GPT-5)
    return await handleDualModelGeneration(body, LOVABLE_API_KEY);
    
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

// MODE A: Single section generation with direct prompt (Gemini only)
async function handleSingleSection(body: any, apiKey: string) {
  const { prompt } = body;
  
  if (!prompt) {
    throw new Error("Missing 'prompt' parameter for single-section mode");
  }

  console.log("Single-section mode: Generating with Gemini 2.5 Flash...");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    return handleApiError(response, "Gemini");
  }

  const data = await response.json();
  const generatedText = data.choices?.[0]?.message?.content;
  
  if (!generatedText) {
    throw new Error("No content in Gemini response");
  }

  const cleanedContent = generatedText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  return new Response(
    JSON.stringify({ content: cleanedContent }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// MODE B: Dual-model generation (Gemini for structure + GPT-5 for copywriting)
async function handleDualModelGeneration(body: any, apiKey: string) {
  const {
    courseName,
    courseContent,
    designConfig,
    targetAudience,
    trainerInfo,
    referenceScreenshots,
    cloneSourceUrl,
  } = body;

  console.log("=== DUAL-MODEL GENERATION START ===");
  console.log("Step 1/3: Generating STRUCTURE with Gemini 2.5 Flash...");

  // STEP 1: Generate STRUCTURE with Gemini (fast, reliable for JSON)
  const structurePrompt = buildStructurePrompt({
    courseName,
    courseContent,
    targetAudience,
    trainerInfo,
    designConfig,
    referenceScreenshots,
    cloneSourceUrl,
  });

  const structureResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: STRUCTURE_ARCHITECT_PROMPT },
        { role: "user", content: structurePrompt },
      ],
      max_tokens: 8192,
    }),
  });

  if (!structureResponse.ok) {
    return handleApiError(structureResponse, "Gemini (structure)");
  }

  const structureData = await structureResponse.json();
  const structureText = structureData.choices?.[0]?.message?.content;
  
  if (!structureText) {
    throw new Error("No content in Gemini structure response");
  }

  // Parse the structure JSON
  let structure;
  try {
    const cleanedStructure = structureText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const jsonMatch = cleanedStructure.match(/\{[\s\S]*\}/);
    structure = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedStructure);
    console.log("✓ Structure generated successfully");
  } catch (e) {
    console.error("Failed to parse Gemini structure:", e);
    console.error("Raw response:", structureText.substring(0, 500));
    throw new Error("Failed to parse structure JSON from Gemini");
  }

  console.log("Step 2/3: Generating COPYWRITING with GPT-5...");

  // STEP 2: Generate COPYWRITING with GPT-5 (premium quality text)
  const copyPrompt = buildCopywritingPrompt({
    structure,
    courseName,
    courseContent,
    targetAudience,
    trainerInfo,
  });

  const copyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5",
      messages: [
        { role: "system", content: ELITE_COPYWRITER_PROMPT },
        { role: "user", content: copyPrompt },
      ],
      max_completion_tokens: 8192,
    }),
  });

  if (!copyResponse.ok) {
    return handleApiError(copyResponse, "GPT-5 (copywriting)");
  }

  const copyData = await copyResponse.json();
  const copyText = copyData.choices?.[0]?.message?.content;
  
  if (!copyText) {
    console.error("No content in GPT-5 response, falling back to structure");
    // Fallback: return structure as-is if GPT-5 fails
    return new Response(JSON.stringify({ content: structure }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse the copywriting JSON
  let finalContent;
  try {
    const cleanedCopy = copyText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const jsonMatch = cleanedCopy.match(/\{[\s\S]*\}/);
    finalContent = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedCopy);
    console.log("✓ Copywriting generated successfully");
  } catch (e) {
    console.error("Failed to parse GPT-5 copywriting:", e);
    console.error("Raw response:", copyText.substring(0, 500));
    // Fallback: return structure as-is
    console.log("Falling back to Gemini structure...");
    finalContent = structure;
  }

  console.log("Step 3/3: Validating final content...");
  
  // STEP 3: Validate and return
  const validatedContent = validateAndCleanContent(finalContent);
  
  console.log("=== DUAL-MODEL GENERATION COMPLETE ===");
  console.log("Content structure:", {
    hasHero: !!validatedContent.hero,
    hasProblem: !!validatedContent.problem,
    hasMethod: !!validatedContent.method,
    hasProgram: !!validatedContent.program,
    hasTestimonials: !!validatedContent.testimonials,
    hasFaq: !!validatedContent.faq,
    hasFinalCta: !!validatedContent.final_cta,
  });

  return new Response(JSON.stringify({ content: validatedContent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Handle API errors consistently
async function handleApiError(response: Response, model: string) {
  const errorText = await response.text();
  console.error(`${model} API Error:`, response.status, errorText);
  
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
  
  throw new Error(`${model} generation failed: ${response.status}`);
}

// Validate and clean the final content
function validateAndCleanContent(content: any) {
  // Ensure all required sections exist
  const defaults = {
    hero: {
      badge: "Formation Premium",
      headline: "Transformez votre vie",
      subheadline: "Une méthode éprouvée",
      cta_text: "Commencer maintenant",
      cta_subtext: "Satisfait ou remboursé"
    },
    problem: {
      title: "Le problème",
      agitation_text: "",
      pain_points: [],
      risks: []
    },
    method: {
      title: "La méthode",
      description: "",
      pillars: []
    },
    transformation: {
      title: "La transformation",
      left_card: { title: "", description: "", color: "orange" },
      right_card: { title: "", description: "", color: "pink" }
    },
    program: {
      title: "Le programme",
      modules: []
    },
    trainer: {
      tagline: "",
      title: "Votre formateur",
      bio_highlight: "",
      credentials: [],
      quote: ""
    },
    testimonials: [],
    faq: [],
    final_cta: {
      urgency_badge: "",
      title: "Prêt à commencer ?",
      subtitle: "",
      cta_text: "Je démarre maintenant",
      guarantee: ""
    }
  };

  return {
    hero: { ...defaults.hero, ...content.hero },
    problem: { ...defaults.problem, ...content.problem },
    method: { ...defaults.method, ...content.method },
    transformation: { ...defaults.transformation, ...content.transformation },
    program: { ...defaults.program, ...content.program },
    trainer: { ...defaults.trainer, ...content.trainer },
    testimonials: content.testimonials || defaults.testimonials,
    faq: content.faq || defaults.faq,
    final_cta: { ...defaults.final_cta, ...content.final_cta },
  };
}

// ============================================
// PROMPTS
// ============================================

// Prompt for single section (Gemini)
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
8. Power words émotionnels sans hype artificiel`;

// Prompt for STRUCTURE generation (Gemini - Step 1)
const STRUCTURE_ARCHITECT_PROMPT = `Tu es un ARCHITECTE de landing pages.

Ta mission UNIQUE : Générer la STRUCTURE JSON d'une landing page de vente premium.

RÈGLES ABSOLUES :
1. Retourne UNIQUEMENT du JSON valide
2. Pas de markdown, pas de texte avant/après
3. Concentre-toi sur la STRUCTURE, pas le copywriting final
4. Détermine le bon nombre d'éléments pour chaque section :
   - pain_points : 3-5 selon la complexité du problème
   - pillars : 3 (ni plus, ni moins)
   - testimonials : 3-4
   - faq : 4-6 questions pertinentes
   - modules : Basé sur le contenu réel du cours
5. Pour chaque champ texte, écris un PLACEHOLDER descriptif entre crochets
   Exemple : "[HEADLINE_PROMESSE_TRANSFORMATION_8_MOTS]"

Style de structure "Queen Design" :
- Sections alternées (fond clair / fond sombre)
- Cartes avec effet glass
- CTAs en dégradé
- Espaces généreux`;

// Prompt for COPYWRITING (GPT-5 - Step 2)
const ELITE_COPYWRITER_PROMPT = `Tu es un COPYWRITER D'ÉLITE spécialisé en pages de vente premium à fort taux de conversion.

Ton style signature :
- Framework AIDA (Attention → Interest → Desire → Action)
- Framework PAS (Problem → Agitation → Solution)
- Copywriting "Queen" : Premium mais accessible, expert mais chaleureux

RÈGLES D'OR DU COPYWRITING :
1. Headlines : 8-12 mots MAX, promesse de transformation claire
2. Subheadlines : Clarifient et renforcent, jamais redondantes
3. Pain points : Spécifiques, émotionnels, vécus par la cible
4. Bénéfices > Fonctionnalités (ratio 80/20)
5. Résultats MESURABLES : chiffres, délais, preuves
6. CTAs : Orientés bénéfice, pas action ("Je transforme ma vie" > "S'inscrire")
7. Témoignages : Nom, métier, résultat spécifique chiffré
8. Ton : Conversationnel, empathique, sans hype ni promesses irréalistes
9. Urgence : Subtile et légitime, jamais artificielle

Power words à utiliser :
- Transformation, révolution, secret, découvrir
- Enfin, maintenant, aujourd'hui, immédiatement
- Prouvé, garanti, testé, validé
- Exclusif, limité, unique, rare

RETOURNE uniquement du JSON valide avec tout le contenu textuel finalisé.`;

// ============================================
// PROMPT BUILDERS
// ============================================

function buildStructurePrompt({
  courseName,
  courseContent,
  targetAudience,
  trainerInfo,
  designConfig,
  referenceScreenshots,
  cloneSourceUrl,
}: any) {
  let prompt = `Génère la STRUCTURE JSON d'une landing page pour cette formation :

## FORMATION
Nom : ${courseName}
Description : ${courseContent?.description || 'Non spécifiée'}
Modules : ${courseContent?.modules?.length || 0}
Leçons totales : ${courseContent?.totalLessons || 0}

## CLIENT CIBLE
${targetAudience || 'Non spécifié'}

## FORMATEUR
Nom : ${trainerInfo?.name || 'Non spécifié'}

## DESIGN
Couleurs : ${designConfig?.colors?.join(", ") || 'Non spécifiées'}
`;

  if (referenceScreenshots?.length > 0) {
    prompt += `\n## RÉFÉRENCES VISUELLES\n${referenceScreenshots.length} screenshots pour inspiration\n`;
  }

  if (cloneSourceUrl) {
    prompt += `\n## DESIGN À CLONER\nURL : ${cloneSourceUrl}\n`;
  }

  prompt += `
## STRUCTURE JSON DEMANDÉE

{
  "hero": {
    "badge": "[BADGE_ACCROCHEUR]",
    "headline": "[HEADLINE_PROMESSE_8_12_MOTS]",
    "subheadline": "[SUBHEADLINE_CLARIFICATION]",
    "cta_text": "[CTA_BENEFICE]",
    "cta_subtext": "[REASSURANCE]"
  },
  "problem": {
    "title": "[TITRE_SECTION_PROBLEME]",
    "agitation_text": "[TEXTE_AGITATION_DOULEUR]",
    "pain_points": ["[PAIN_1]", "[PAIN_2]", "[PAIN_3]"],
    "risks": ["[RISQUE_1]", "[RISQUE_2]"]
  },
  "method": {
    "title": "[TITRE_METHODE]",
    "description": "[DESCRIPTION_PHILOSOPHIE]",
    "pillars": [
      { "number": 1, "title": "[PILIER_1]", "description": "[DESC_1]", "icon": "check" },
      { "number": 2, "title": "[PILIER_2]", "description": "[DESC_2]", "icon": "trending" },
      { "number": 3, "title": "[PILIER_3]", "description": "[DESC_3]", "icon": "clock" }
    ]
  },
  "transformation": {
    "title": "[TITRE_TRANSFORMATION]",
    "left_card": { "title": "[RESULTAT_1]", "description": "[DESC]", "color": "orange" },
    "right_card": { "title": "[RESULTAT_2]", "description": "[DESC]", "color": "pink" }
  },
  "program": {
    "title": "[TITRE_PROGRAMME]",
    "modules": [
      { "title": "[MODULE_1]", "description": "[RESUME]", "lessons_count": X }
    ]
  },
  "trainer": {
    "tagline": "[MISSION]",
    "title": "[TITRE_SECTION]",
    "bio_highlight": "[BIO_COURTE]",
    "credentials": ["[CRED_1]", "[CRED_2]"],
    "quote": "[CITATION]"
  },
  "testimonials": [
    { "name": "[PRENOM_N]", "role": "[PROFESSION]", "text": "[TEMOIGNAGE]", "rating": 5 }
  ],
  "faq": [
    { "question": "[Q1]", "answer": "[R1]" }
  ],
  "final_cta": {
    "urgency_badge": "[URGENCE]",
    "title": "[TITRE_EMOTIONNEL]",
    "subtitle": "[RAPPEL_TRANSFORMATION]",
    "cta_text": "[CTA_FINAL]",
    "guarantee": "[GARANTIE]"
  }
}

Adapte le nombre d'éléments (pain_points, testimonials, faq, modules) au contexte.
Retourne UNIQUEMENT le JSON.`;

  return prompt;
}

function buildCopywritingPrompt({
  structure,
  courseName,
  courseContent,
  targetAudience,
  trainerInfo,
}: any) {
  return `Tu as reçu une STRUCTURE de landing page. Ta mission : REMPLIR chaque placeholder avec du copywriting PREMIUM.

## CONTEXTE DE LA FORMATION

**Nom** : ${courseName}
**Description** : ${courseContent?.description || 'Formation en ligne'}
**Modules** : ${JSON.stringify(courseContent?.modules?.map((m: any) => ({ title: m.title, lessons: m.lessons?.length })) || [], null, 2)}

## CLIENT CIBLE
${targetAudience || 'Professionnels cherchant à se former'}

## FORMATEUR
**Nom** : ${trainerInfo?.name || 'Expert'}
**Bio** : ${trainerInfo?.bio || 'Expert dans son domaine'}
**Expérience** : ${trainerInfo?.experience || 'Plusieurs années d\'expérience'}
**Spécialité** : ${trainerInfo?.specialty || 'Formation professionnelle'}

## STRUCTURE À REMPLIR

${JSON.stringify(structure, null, 2)}

## TES INSTRUCTIONS

1. REMPLACE chaque placeholder [TEXTE] par du copywriting percutant
2. GARDE la structure JSON exacte
3. Adapte le ton au client cible
4. Headlines : 8-12 mots, promesse de transformation
5. Pain points : Spécifiques, émotionnels
6. Témoignages : Réalistes avec résultats chiffrés (prénom + métier + résultat)
7. FAQ : Questions que se pose vraiment le client cible
8. CTAs : Orientés bénéfice, jamais génériques

RETOURNE le JSON complet avec tout le contenu textuel finalisé.`;
}
