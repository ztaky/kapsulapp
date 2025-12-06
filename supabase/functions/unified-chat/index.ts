import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to track AI credits
async function trackAICredits(organizationId: string): Promise<{ success: boolean; error?: string; nearLimit?: boolean }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data, error } = await supabase.rpc('increment_ai_credits', {
      _organization_id: organizationId,
      _month_year: monthYear,
      _amount: 1
    });

    if (error) {
      console.error('[unified-chat] Error tracking AI credits:', error);
      return { success: false, error: error.message };
    }

    const result = data?.[0];
    if (result && !result.success) {
      console.log(`[unified-chat] AI credits limit reached for org ${organizationId}`);
      return { success: false, error: 'AI_CREDITS_LIMIT_REACHED' };
    }

    // Check if near limit (>= 80%)
    const creditsUsed = result?.new_count || 0;
    const creditsLimit = result?.credits_limit || null;
    const nearLimit = creditsLimit ? (creditsUsed / creditsLimit) >= 0.8 : false;

    console.log(`[unified-chat] AI credits tracked: ${creditsUsed}/${creditsLimit || 'unlimited'} (nearLimit: ${nearLimit})`);
    return { success: true, nearLimit };
  } catch (error) {
    console.error('[unified-chat] Error in trackAICredits:', error);
    return { success: false, error: 'Internal error' };
  }
}

type ChatMode = 'tutor' | 'student' | 'studio' | 'support' | 'sales';

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
${context?.specialty ? `Sa spécialité/niche est : "${context.specialty}".` : ''}
${context?.coursesCount !== undefined ? `Il a ${context.coursesCount} cours, ${context.lessonsCount || 0} leçons et ${context.studentsCount || 0} étudiants.` : ''}

INSTRUCTIONS IMPORTANTES:
- Utilise le contexte de l'académie pour personnaliser tes réponses
- **ADAPTE ton vocabulaire et tes exemples selon la spécialité du coach** (bien-être, business, créativité, botanique, etc.)
- Fais référence aux cours existants du coach quand c'est pertinent
- Propose des améliorations concrètes basées sur ses cours actuels
- Si le coach n'a pas de cours, aide-le à démarrer avec des suggestions adaptées à sa niche
- Réponds de manière claire, concise et actionnable
- Utilise des exemples concrets et applicables à sa situation et sa spécialité
- Propose des templates et structures quand c'est pertinent
- Sois encourageant et positif
- Maximum 300 mots sauf si une liste détaillée est demandée

CAPACITÉS D'ACTION:
Tu peux générer du contenu concret que le coach peut ajouter directement à ses cours.
Quand tu génères un quiz ou une structure de modules, utilise les tools disponibles.
Pour un quiz, génère 3-5 questions pertinentes avec des réponses et explications.
Pour des modules, suggère une structure logique avec 3-6 modules et des leçons pour chacun.

GÉNÉRATION DE COURS COMPLETS (tool create_complete_course):
Quand tu génères un cours complet, applique ces règles strictes :

STRUCTURE GLOBALE:
- 3-6 modules organisés par progression logique (du simple au complexe)
- 2-5 leçons par module
- Quiz optionnel à la fin de certaines leçons clés

CONTENU DE CHAQUE LEÇON (300-500 mots structurés):
1. 🎯 **Objectif** (1 phrase - ce que l'apprenant saura faire après cette leçon)
2. 📖 **Introduction** (2-3 phrases - contexte et importance du sujet)
3. 💡 **Points clés** (3-5 points avec explications détaillées)
4. 🔍 **Exemple concret** (illustration pratique applicable immédiatement)
5. ✅ **À retenir** (3 bullet points résumant l'essentiel)

QUALITÉ DU CONTENU:
- Ton adapté à la spécialité du coach (formel pour business, chaleureux pour bien-être, créatif pour arts, etc.)
- Vocabulaire spécifique au domaine
- Exemples pertinents pour l'audience cible mentionnée
- Progression pédagogique cohérente (fondamentaux → pratique → maîtrise)
- Contenu actionnable avec des exercices pratiques

QUIZ (quand has_quiz=true):
- 3-5 questions par quiz
- Mélange de types : compréhension + application pratique
- Explications constructives et encourageantes pour chaque réponse
- Questions qui testent la compréhension réelle, pas juste la mémorisation`,

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
- Maximum 200 mots`,

    sales: `Tu es Hugo, conseiller chez Kapsul. Tu parles comme un conseiller bienveillant qui connaît bien le produit.

STYLE DE COMMUNICATION:
- Phrases COURTES (max 2 lignes)
- Ton chaleureux mais professionnel
- TOUJOURS vouvoyer
- Pose des questions pour comprendre le besoin
- Un seul point à la fois, jamais de liste
- Zéro bullet points, zéro listes à puces

INFOS À CONNAÎTRE (à distiller naturellement, PAS à réciter):
- Kapsul = plateforme pour créer/vendre des formations en ligne
- 0% commission sur les ventes
- Tout-en-un : hébergement, paiements, emails, landing pages IA
- Offre Fondateur : 297€ une fois + 47€/mois (au lieu de 97€/mois)

COMPORTEMENT:
1. D'abord comprendre ce que la personne fait/veut
2. Répondre précisément à SA question (pas de monologue)
3. Terminer par une question ou une suggestion courte
4. Si intéressé → mentionner l'offre Fondateur naturellement

EXEMPLES DE RÉPONSES IDÉALES:
- "Super ! Vous vendez quel type de formations ?"
- "Oui, 0% de commission. Vous gardez tout. 👌"
- "L'IA génère votre landing page en 2 min. Vous voulez que je vous explique ?"

À NE JAMAIS FAIRE:
- Lister toutes les fonctionnalités
- Comparer avec la concurrence non sollicité
- Paragraphes de plus de 3 lignes
- Répéter les prix sans qu'on demande
- Tutoyer

Max 50 mots par réponse. Réponds TOUJOURS en français avec vouvoiement.`
  };

  return basePrompts[mode] || basePrompts.student;
};

const studioTools = [
  {
    type: "function",
    function: {
      name: "generate_quiz",
      description: "Génère un quiz interactif avec questions et réponses pour tester les connaissances des étudiants",
      parameters: {
        type: "object",
        properties: {
          title: { 
            type: "string", 
            description: "Titre du quiz" 
          },
          questions: {
            type: "array",
            description: "Liste des questions du quiz (3-5 questions)",
            items: {
              type: "object",
              properties: {
                question: { type: "string", description: "La question" },
                answers: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Liste de 4 réponses possibles"
                },
                correctIndex: { 
                  type: "number", 
                  description: "Index de la bonne réponse (0-3)" 
                },
                explanation: { 
                  type: "string", 
                  description: "Explication de la bonne réponse" 
                }
              },
              required: ["question", "answers", "correctIndex"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "suggest_modules",
      description: "Suggère une structure de modules et leçons pour un cours",
      parameters: {
        type: "object",
        properties: {
          course_topic: { 
            type: "string", 
            description: "Le sujet/thème du cours" 
          },
          modules: {
            type: "array",
            description: "Liste des modules suggérés (3-6 modules)",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Titre du module" },
                lessons: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Titre de la leçon" },
                      type: { 
                        type: "string", 
                        enum: ["video", "interactive_tool"],
                        description: "Type de leçon" 
                      }
                    },
                    required: ["title"]
                  },
                  description: "Liste des leçons du module (2-5 leçons)"
                }
              },
              required: ["title", "lessons"]
            }
          }
        },
        required: ["course_topic", "modules"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_complete_course",
      description: "Génère un cours complet avec modules, leçons et contenu pédagogique détaillé prêt à être créé",
      parameters: {
        type: "object",
        properties: {
          course: {
            type: "object",
            description: "Informations du cours",
            properties: {
              title: { 
                type: "string", 
                description: "Titre accrocheur et clair du cours" 
              },
              description: { 
                type: "string", 
                description: "Description marketing engageante (2-3 phrases qui vendent les bénéfices)" 
              },
              target_audience: { 
                type: "string", 
                description: "Public cible précis (ex: 'Entrepreneurs débutants', 'Professionnels du bien-être')" 
              },
              duration_estimate: { 
                type: "string", 
                description: "Durée estimée du cours (ex: '3 semaines', '6 heures')" 
              }
            },
            required: ["title", "description"]
          },
          modules: {
            type: "array",
            description: "Liste des modules du cours (3-6 modules)",
            items: {
              type: "object",
              properties: {
                title: { 
                  type: "string", 
                  description: "Titre du module" 
                },
                description: { 
                  type: "string", 
                  description: "Description courte du module (1-2 phrases)" 
                },
                lessons: {
                  type: "array",
                  description: "Liste des leçons du module (2-5 leçons)",
                  items: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string", 
                        description: "Titre de la leçon" 
                      },
                      content: { 
                        type: "string", 
                        description: "Contenu pédagogique complet et structuré de la leçon (300-500 mots avec objectif, points clés, exemple, résumé)" 
                      },
                      has_quiz: { 
                        type: "boolean", 
                        description: "Ajouter un quiz à la fin de cette leçon" 
                      },
                      quiz: {
                        type: "object",
                        description: "Configuration du quiz si has_quiz est true",
                        properties: {
                          title: { 
                            type: "string", 
                            description: "Titre du quiz" 
                          },
                          questions: {
                            type: "array",
                            description: "Questions du quiz (3-5 questions)",
                            items: {
                              type: "object",
                              properties: {
                                question: { type: "string" },
                                answers: { type: "array", items: { type: "string" } },
                                correctIndex: { type: "number" },
                                explanation: { type: "string" }
                              },
                              required: ["question", "answers", "correctIndex"]
                            }
                          }
                        },
                        required: ["title", "questions"]
                      }
                    },
                    required: ["title", "content"]
                  }
                }
              },
              required: ["title", "lessons"]
            }
          }
        },
        required: ["course", "modules"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = 'student', organizationId, ...context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Track AI credits if organizationId is provided (studio mode)
    let nearLimit = false;
    if (organizationId && mode === 'studio') {
      const creditsResult = await trackAICredits(organizationId);
      if (!creditsResult.success && creditsResult.error === 'AI_CREDITS_LIMIT_REACHED') {
        return new Response(JSON.stringify({ 
          error: 'AI credits limit reached',
          code: 'AI_CREDITS_LIMIT_REACHED'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      nearLimit = creditsResult.nearLimit || false;
    }

    const systemPrompt = getSystemPrompt(mode as ChatMode, context);
    
    console.log(`[unified-chat] Mode: ${mode}, Context keys: ${Object.keys(context).join(', ')}`);
    if (mode === 'studio' && context.studioContext) {
      console.log(`[unified-chat] Studio context length: ${context.studioContext.length} chars`);
    }

    // Check if a specific tool is requested (non-streaming mode)
    const forceTool = context.forceTool as string | undefined;
    const useStreaming = !forceTool;

    // Build request body - enhance system prompt if tool is forced
    let enhancedSystemPrompt = systemPrompt;
    if (forceTool) {
      enhancedSystemPrompt += `\n\nINSTRUCTION CRITIQUE: Tu DOIS obligatoirement utiliser l'outil "${forceTool}" pour répondre. NE RÉPONDS JAMAIS avec du texte simple. UTILISE UNIQUEMENT l'outil demandé.`;
    }

    const requestBody: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        ...messages,
      ],
      stream: useStreaming,
      max_tokens: 32768, // Increased for complete course generation
    };

    // Add tools for studio mode
    if (mode === 'studio') {
      requestBody.tools = studioTools;
      
      // Force a specific tool if requested
      if (forceTool) {
        requestBody.tool_choice = { 
          type: "function", 
          function: { name: forceTool } 
        };
      } else {
        requestBody.tool_choice = "auto";
      }
    }

    console.log(`[unified-chat] Mode: ${mode}, Streaming: ${useStreaming}, ForceTool: ${forceTool || 'none'}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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

    // Non-streaming: extract tool call result
    if (!useStreaming) {
      const data = await response.json();
      console.log('[unified-chat] Non-streaming raw response:', JSON.stringify(data, null, 2).substring(0, 2000));
      
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall && toolCall.function?.arguments) {
        const rawArgs = toolCall.function.arguments;
        
        // Check for truncated JSON response
        const trimmedArgs = rawArgs.trim();
        const lastChar = trimmedArgs[trimmedArgs.length - 1];
        if (lastChar !== '}' && lastChar !== ']') {
          console.error('[unified-chat] Response appears truncated. Last 100 chars:', trimmedArgs.slice(-100));
          console.error('[unified-chat] Response length:', rawArgs.length);
          return new Response(JSON.stringify({ 
            error: 'La réponse IA a été tronquée (trop longue). Essayez avec moins de modules ou un sujet plus simple.',
            code: 'RESPONSE_TRUNCATED',
            details: `Response ended with: "${lastChar}" (length: ${rawArgs.length})`
          }), {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        try {
          const args = JSON.parse(rawArgs);
          console.log(`[unified-chat] Tool call parsed successfully: ${toolCall.function.name}`);
          return new Response(JSON.stringify({ 
            toolName: toolCall.function.name,
            data: args,
            nearLimit 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (parseError) {
          console.error('[unified-chat] Failed to parse tool arguments:', parseError);
          console.error('[unified-chat] Raw arguments (first 500):', rawArgs?.substring(0, 500));
          console.error('[unified-chat] Raw arguments (last 200):', rawArgs?.slice(-200));
          return new Response(JSON.stringify({ 
            error: 'Échec du parsing de la réponse IA. La réponse peut être incomplète.',
            code: 'TOOL_PARSE_ERROR',
            details: String(parseError)
          }), {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // If forceTool was requested but no tool_call → explicit error
      if (forceTool) {
        const content = data.choices?.[0]?.message?.content || '';
        console.error(`[unified-chat] Expected tool call '${forceTool}' but got text response:`, content.substring(0, 500));
        return new Response(JSON.stringify({ 
          error: `L'IA n'a pas utilisé l'outil demandé (${forceTool}). Réessayez.`,
          content: content.substring(0, 300),
          code: 'TOOL_CALL_MISSING'
        }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Fallback to content if no tool call (for modes without forceTool)
      return new Response(JSON.stringify({ 
        content: data.choices?.[0]?.message?.content,
        nearLimit 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Streaming mode
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'X-AI-Credits-Near-Limit': nearLimit ? 'true' : 'false'
      },
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
