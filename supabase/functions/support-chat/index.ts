import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Tu es l'assistant support de Kapsul, une plateforme SaaS de création et vente de formations en ligne.

FONCTIONNALITÉS PRINCIPALES :
- Création de cours avec modules et leçons (vidéo, quiz, outils interactifs)
- Pages de vente avec génération IA
- Gestion des étudiants et suivi de progression
- Paiements via Stripe
- Branding personnalisé par académie

PROBLÈMES COURANTS ET SOLUTIONS :
- Vidéo ne se charge pas : Vérifier le format (MP4, WebM) et la taille (<500MB)
- Paiement échoué : Vérifier la configuration Stripe dans Branding
- Étudiant n'a pas accès : Vérifier l'achat et le statut du cours (publié)
- Page de vente non visible : Vérifier que le statut est "published"

INSTRUCTIONS :
1. Sois amical et professionnel
2. Pose des questions de clarification si nécessaire
3. Fournis des solutions étape par étape
4. Si tu ne peux pas résoudre le problème après 3-4 échanges, suggère de créer un ticket

À la fin de chaque réponse, évalue si tu as pu résoudre le problème.
Ajoute toujours à la fin: [RESOLVED: true] ou [RESOLVED: false]`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Support chat request received with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Support chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
