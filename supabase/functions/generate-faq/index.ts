import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .single();

    if (!roleData) {
      throw new Error("Unauthorized - Super admin access required");
    }

    // Fetch resolved tickets with AI conversations
    const { data: tickets, error: ticketsError } = await supabase
      .from("support_tickets")
      .select(`
        id,
        subject,
        description,
        category,
        ai_conversation,
        resolved_at
      `)
      .in("status", ["resolved", "closed"])
      .not("ai_conversation", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(50);

    if (ticketsError) {
      console.error("Error fetching tickets:", ticketsError);
      throw new Error("Failed to fetch tickets");
    }

    if (!tickets || tickets.length === 0) {
      return new Response(
        JSON.stringify({ message: "No resolved tickets with AI conversations found", generated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing FAQ entries to avoid duplicates
    const { data: existingFaq } = await supabase
      .from("faq_entries")
      .select("source_ticket_ids");

    const existingTicketIds = new Set(
      existingFaq?.flatMap(f => f.source_ticket_ids || []) || []
    );

    // Filter out already processed tickets
    const newTickets = tickets.filter(t => !existingTicketIds.has(t.id));

    if (newTickets.length === 0) {
      return new Response(
        JSON.stringify({ message: "All tickets already processed", generated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare context for AI
    const ticketSummaries = newTickets.map(t => ({
      id: t.id,
      subject: t.subject,
      description: t.description,
      category: t.category,
      aiConversation: t.ai_conversation
    }));

    const systemPrompt = `Tu es un assistant expert en création de FAQ. Analyse les tickets de support résolus et génère des entrées FAQ pertinentes.

Pour chaque groupe de problèmes similaires, crée UNE entrée FAQ avec:
- Une question claire et concise (comme un utilisateur la poserait)
- Une réponse détaillée et utile
- Une catégorie (technique, facturation, compte, formation, autre)

Réponds UNIQUEMENT avec un JSON valide, un tableau d'objets avec cette structure:
[
  {
    "question": "La question",
    "answer": "La réponse détaillée",
    "category": "technique|facturation|compte|formation|autre",
    "sourceTicketIds": ["id1", "id2"]
  }
]

Règles:
- Fusionne les problèmes similaires en une seule FAQ
- Maximum 10 entrées FAQ
- Les réponses doivent être utiles et actionnables
- Utilise un ton professionnel mais accessible`;

    const userPrompt = `Voici les tickets de support résolus à analyser:\n\n${JSON.stringify(ticketSummaries, null, 2)}`;

    console.log("Calling AI to generate FAQ entries...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI API error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content from AI");
    }

    // Parse JSON from AI response
    let faqEntries;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      faqEntries = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse FAQ entries from AI");
    }

    if (!Array.isArray(faqEntries) || faqEntries.length === 0) {
      return new Response(
        JSON.stringify({ message: "AI did not generate any FAQ entries", generated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert FAQ entries
    const faqToInsert = faqEntries.map(entry => ({
      question: entry.question,
      answer: entry.answer,
      category: entry.category || "autre",
      source_ticket_ids: entry.sourceTicketIds || [],
      is_published: false
    }));

    const { data: insertedFaq, error: insertError } = await supabase
      .from("faq_entries")
      .insert(faqToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting FAQ:", insertError);
      throw new Error("Failed to insert FAQ entries");
    }

    console.log(`Generated ${insertedFaq.length} FAQ entries`);

    return new Response(
      JSON.stringify({ 
        message: `Successfully generated ${insertedFaq.length} FAQ entries`,
        generated: insertedFaq.length,
        entries: insertedFaq
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-faq:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
