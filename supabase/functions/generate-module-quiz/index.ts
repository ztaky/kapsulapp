import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuizQuestion {
  question: string;
  answers: string[];
  correct: number;
  explanation: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      moduleId, 
      organizationId,
      questionCount = 7,
      difficulty = "medium",
      questionTypes = ["qcm"]
    } = await req.json();

    if (!moduleId) {
      return new Response(
        JSON.stringify({ error: "moduleId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate parameters
    const validQuestionCount = Math.min(Math.max(questionCount, 3), 15);
    const validDifficulty = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium";
    const validQuestionTypes = questionTypes.filter((t: string) => 
      ["qcm", "true_false", "fill_blank"].includes(t)
    );
    if (validQuestionTypes.length === 0) validQuestionTypes.push("qcm");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get module info
    const { data: moduleData, error: moduleError } = await supabase
      .from("modules")
      .select("id, title, objective")
      .eq("id", moduleId)
      .single();

    if (moduleError) {
      console.error("Error fetching module:", moduleError);
      return new Response(
        JSON.stringify({ error: "Module not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all lessons from this module
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, title, content_text, objective, type")
      .eq("module_id", moduleId)
      .order("position");

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch lessons" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lessons || lessons.length === 0) {
      return new Response(
        JSON.stringify({ error: "No lessons found in this module" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build content context from lessons
    const contentContext = lessons
      .map((lesson) => {
        let content = `### ${lesson.title}`;
        if (lesson.objective) content += `\nObjectif: ${lesson.objective}`;
        if (lesson.content_text) content += `\n${lesson.content_text}`;
        return content;
      })
      .join("\n\n");

    // Track AI credits if organizationId provided
    if (organizationId) {
      const monthYear = new Date().toISOString().slice(0, 7);
      const { data: creditResult } = await supabase.rpc("increment_ai_credits", {
        _organization_id: organizationId,
        _month_year: monthYear,
        _amount: 1,
      });

      if (creditResult && creditResult[0] && !creditResult[0].success) {
        return new Response(
          JSON.stringify({ 
            error: "Limite de crédits IA atteinte pour ce mois",
            code: "AI_CREDITS_LIMIT_REACHED"
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate quiz using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build difficulty instructions
    const difficultyInstructions = {
      easy: "Les questions doivent être simples et directes, testant la compréhension de base. Évite les pièges et les nuances complexes.",
      medium: "Les questions doivent être de difficulté intermédiaire, testant une bonne compréhension du contenu avec quelques nuances.",
      hard: "Les questions doivent être avancées et exigeantes, testant une compréhension approfondie avec des cas particuliers et des nuances."
    };

    // Build question types instructions
    const questionTypeDescriptions: string[] = [];
    if (validQuestionTypes.includes("qcm")) {
      questionTypeDescriptions.push("QCM classiques avec 4 options de réponse");
    }
    if (validQuestionTypes.includes("true_false")) {
      questionTypeDescriptions.push("Questions Vrai/Faux avec seulement 2 options: ['Vrai', 'Faux']");
    }
    if (validQuestionTypes.includes("fill_blank")) {
      questionTypeDescriptions.push("Questions à trous où la réponse est un mot ou une courte phrase (la bonne réponse doit être courte et précise)");
    }

    const systemPrompt = `Tu es un expert en pédagogie qui crée des quiz de qualité pour évaluer la compréhension des apprenants.

Tu dois générer un quiz basé sur le contenu du module fourni. Le quiz doit:
- Contenir exactement ${validQuestionCount} questions
- Niveau de difficulté: ${validDifficulty.toUpperCase()} - ${difficultyInstructions[validDifficulty as keyof typeof difficultyInstructions]}
- Types de questions à utiliser: ${questionTypeDescriptions.join(", ")}
- Avoir des questions claires et précises
- Avoir une seule bonne réponse par question
- Inclure une explication pour chaque réponse

IMPORTANT: Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans texte avant ou après.

Format de réponse attendu:
{
  "questions": [
    {
      "question": "La question posée ?",
      "answers": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
      "correct": 0,
      "explanation": "Explication de pourquoi cette réponse est correcte...",
      "type": "qcm"
    }
  ]
}

Notes importantes:
- Pour les QCM: 4 options de réponse, "correct" est l'index (0-3)
- Pour Vrai/Faux: 2 options ["Vrai", "Faux"], "correct" est 0 ou 1
- Pour texte à trous: "answers" contient uniquement la bonne réponse ["réponse correcte"], "correct" est toujours 0
- Le champ "type" doit être "qcm", "true_false" ou "fill_blank"`;

    const userPrompt = `Génère un quiz de ${validQuestionCount} questions (niveau ${validDifficulty}) pour le module "${moduleData.title}".

${moduleData.objective ? `Objectif du module: ${moduleData.objective}` : ""}

Types de questions à utiliser: ${validQuestionTypes.join(", ")}

Contenu du module:
${contentContext}

Génère uniquement le JSON, sans markdown ni texte additionnel.`;

    console.log("Calling Lovable AI to generate quiz...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service IA temporairement indisponible, réessayez plus tard" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate quiz" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let quizContent = aiData.choices?.[0]?.message?.content;

    if (!quizContent) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "No quiz generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up the response - remove markdown code blocks if present
    quizContent = quizContent
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Parse the JSON response
    let quizData: { questions: QuizQuestion[] };
    try {
      quizData = JSON.parse(quizContent);
    } catch (parseError) {
      console.error("Failed to parse quiz JSON:", parseError, quizContent);
      return new Response(
        JSON.stringify({ error: "Invalid quiz format generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the quiz structure
    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      console.error("Invalid quiz structure:", quizData);
      return new Response(
        JSON.stringify({ error: "Quiz has no questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the generated quiz
    return new Response(
      JSON.stringify({
        success: true,
        quiz: {
          title: `Quiz - ${moduleData.title}`,
          questions: quizData.questions,
        },
        questionsCount: quizData.questions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-module-quiz:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
