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
    const { courseName, targetAudience, benefits, currentDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating sales page for:", courseName);

    const prompt = `Génère une page de vente professionnelle et persuasive pour cette formation :

Nom du cours : ${courseName}
Public cible : ${targetAudience}
Bénéfices clés : ${benefits}
${currentDescription ? `Description actuelle : ${currentDescription}` : ''}

Génère du contenu pour :
1. Un titre accrocheur (max 10 mots)
2. Un sous-titre engageant (max 20 mots)
3. Une description détaillée et persuasive (3-4 paragraphes)
4. 5 bénéfices clés avec des icônes suggérées
5. Un appel à l'action puissant
6. 3 témoignages fictifs mais réalistes

Format de réponse en JSON strict :
{
  "title": "titre",
  "subtitle": "sous-titre",
  "description": "description longue",
  "benefits": [{"icon": "🎯", "text": "bénéfice"}],
  "cta": "texte du CTA",
  "testimonials": [{"name": "nom", "role": "rôle", "text": "témoignage"}]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu es un expert en copywriting et marketing pour formations en ligne. Réponds uniquement en JSON valide." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédit requis, veuillez recharger votre compte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    if (content.includes("```json")) {
      jsonContent = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonContent = content.split("```")[1].split("```")[0].trim();
    }
    
    const salesPageContent = JSON.parse(jsonContent);

    return new Response(
      JSON.stringify(salesPageContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate sales page error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
