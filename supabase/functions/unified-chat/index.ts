import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ChatMode = 'tutor' | 'student' | 'studio' | 'support';

const getSystemPrompt = (mode: ChatMode, context?: Record<string, any>): string => {
  const basePrompts: Record<ChatMode, string> = {
    tutor: `Tu es Kapsul, un tuteur pédagogique bienveillant et encourageant.
${context?.courseTitle ? `L'étudiant suit le cours "${context.courseTitle}"` : ''}
${context?.lessonTitle ? `, leçon "${context.lessonTitle}"` : ''}.
${context?.lessonContent ? `\nContenu de la leçon:\n${context.lessonContent}\n` : ''}

Règles :
- Réponds de façon concise (max 150 mots)
- Encourage l'action et la pratique
- Utilise des exemples concrets liés à la leçon
- Félicite les efforts et progrès
- Si l'étudiant bloque, propose des indices plutôt que des réponses directes
- Utilise des émojis avec parcimonie 🎯
- Adopte un ton amical et motivant
- Contextualise tes réponses par rapport à la leçon en cours`,

    student: `Tu es un assistant pédagogique intelligent qui aide les étudiants avec leurs formations sur Kapsul.

Tes responsabilités:
- Répondre aux questions sur les cours et leçons
- Fournir des explications claires et pédagogiques
- Encourager l'apprentissage et la progression
- Donner des conseils d'étude et d'organisation
- Être bienveillant et motivant

Important:
- Réponds en français
- Sois concis mais complet (max 200 mots)
- Adapte ton niveau au contexte de la question
- Encourage toujours l'étudiant à progresser
- Utilise des exemples concrets`,

    studio: `Tu es un assistant IA expert pour aider les coachs et formateurs sur Kapsul.

Tu es expert en :
- Création et structuration de cours en ligne
- Rédaction de contenus pédagogiques engageants
- Stratégies marketing pour formations
- Engagement et fidélisation des étudiants
- Optimisation des pages de vente
- Tarification et monétisation

${context?.studioContext ? `\n--- CONTEXTE DE L'ACADÉMIE DU COACH ---\n${context.studioContext}\n--- FIN DU CONTEXTE ---\n` : ''}
${context?.organizationName ? `Le coach gère l'académie "${context.organizationName}".` : ''}
${context?.coursesCount !== undefined ? `Il a ${context.coursesCount} cours, ${context.lessonsCount || 0} leçons et ${context.studentsCount || 0} étudiants.` : ''}

INSTRUCTIONS IMPORTANTES:
- Utilise le contexte de l'académie pour personnaliser tes réponses
- Fais référence aux cours existants du coach quand c'est pertinent
- Propose des améliorations concrètes basées sur ses cours actuels
- Si le coach n'a pas de cours, aide-le à démarrer
- Réponds de manière claire, concise et actionnable
- Utilise des exemples concrets et applicables à sa situation
- Propose des templates et structures quand c'est pertinent
- Sois encourageant et positif
- Maximum 300 mots sauf si une liste détaillée est demandée`,

    support: `Tu es l'assistant support de Kapsul, une plateforme SaaS de création de formations en ligne.

Fonctionnalités de Kapsul :
- Création de cours avec modules et leçons
- Outils interactifs (quiz, vidéos)
- Landing pages avec IA
- Gestion des étudiants
- Paiements via Stripe

Problèmes courants :
- Connexion/mot de passe → Réinitialiser via page de connexion
- Vidéos qui ne chargent pas → Vérifier format (MP4) et connexion
- Paiements → Vérifier configuration Stripe dans Paramètres
- Publications → Vérifier que le contenu est complet

Règles :
- Réponds en français, de façon claire et empathique
- Propose des solutions étape par étape
- Si tu ne peux pas résoudre, suggère de créer un ticket support
- Maximum 200 mots`
  };

  return basePrompts[mode] || basePrompts.student;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = 'student', ...context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = getSystemPrompt(mode as ChatMode, context);
    
    console.log(`[unified-chat] Mode: ${mode}, Context keys: ${Object.keys(context).join(', ')}`);
    if (mode === 'studio' && context.studioContext) {
      console.log(`[unified-chat] Studio context length: ${context.studioContext.length} chars`);
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('unified-chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
