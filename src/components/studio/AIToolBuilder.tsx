import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, RefreshCw, Check, Eye, EyeOff, Calculator, ListChecks, HelpCircle, Gamepad2, SlidersHorizontal, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIToolBuilderProps {
  toolConfig: {
    description?: string;
    generatedCode?: string;
    generatedAt?: string;
    category?: string;
  };
  onChange: (config: any) => void;
  organizationId?: string;
  lessonContext?: {
    title?: string;
    objective?: string;
    content?: string;
  };
  courseContext?: {
    title?: string;
    description?: string;
    specialty?: string;
  };
}

const TOOL_CATEGORIES = [
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Questions à choix multiples avec score', color: 'from-purple-500 to-indigo-500' },
  { id: 'calculator', label: 'Calculateur', icon: Calculator, description: 'Calculs et formules interactives', color: 'from-green-500 to-emerald-500' },
  { id: 'checklist', label: 'Checklist', icon: ListChecks, description: 'Liste de tâches avec progression', color: 'from-orange-500 to-amber-500' },
  { id: 'simulator', label: 'Simulateur', icon: SlidersHorizontal, description: 'Visualisation dynamique', color: 'from-blue-500 to-cyan-500' },
  { id: 'form', label: 'Formulaire', icon: FileText, description: 'Formulaire interactif avec validation', color: 'from-pink-500 to-rose-500' },
  { id: 'game', label: 'Mini-jeu', icon: Gamepad2, description: 'Jeu éducatif ludique', color: 'from-red-500 to-orange-500' },
];

const EXAMPLE_PROMPTS_BY_CATEGORY: Record<string, string[]> = {
  quiz: [
    "Un quiz de 5 questions sur les bases de la nutrition avec explications",
    "Un quiz sur les règles de grammaire française avec 3 niveaux de difficulté",
    "Un quiz interactif sur l'histoire de France avec images",
  ],
  calculator: [
    "Un calculateur de calories journalières basé sur le poids, la taille, l'âge et l'activité",
    "Un calculateur d'IMC avec interprétation des résultats et conseils",
    "Un convertisseur d'unités (kg/lbs, km/miles, °C/°F)",
    "Un calculateur de pourcentage de réduction pour les soldes",
  ],
  checklist: [
    "Une checklist de préparation à un entretien d'embauche",
    "Un tracker d'habitudes quotidiennes (sport, méditation, lecture)",
    "Une liste de contrôle pour un projet avec progression",
  ],
  simulator: [
    "Un simulateur d'épargne avec intérêts composés sur plusieurs années",
    "Un visualiseur de budget mensuel avec graphiques",
    "Un simulateur de croissance d'investissement",
  ],
  form: [
    "Un formulaire de diagnostic de niveau en anglais",
    "Un questionnaire d'auto-évaluation des compétences professionnelles",
    "Un formulaire d'inscription avec validation en temps réel",
  ],
  game: [
    "Un memory game sur le vocabulaire anglais",
    "Un jeu de rapidité pour apprendre les tables de multiplication",
    "Un puzzle de mots pour enrichir le vocabulaire",
  ],
};

export function AIToolBuilder({ toolConfig, onChange, organizationId, lessonContext, courseContext }: AIToolBuilderProps) {
  const [description, setDescription] = useState(toolConfig.description || '');
  const [category, setCategory] = useState(toolConfig.category || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generateTool = async () => {
    if (!description.trim()) {
      toast.error('Veuillez décrire l\'outil que vous souhaitez créer');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-interactive-tool', {
        body: { 
          description, 
          organizationId,
          category: category || undefined,
          lessonContext,
          courseContext,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.code === 'AI_CREDITS_LIMIT_REACHED') {
          toast.error('Limite de crédits IA atteinte pour ce mois');
        } else {
          toast.error(data.error);
        }
        return;
      }

      // Check for near limit warning
      if (data.nearLimit) {
        toast.warning("Attention : vous approchez de votre limite de crédits IA (80%)", {
          duration: 5000,
        });
      }

      onChange({
        description,
        category,
        generatedCode: data.code,
        generatedAt: new Date().toISOString(),
      });

      toast.success('Outil généré avec succès !');
      setShowPreview(true);
    } catch (error: any) {
      console.error('Error generating tool:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const useExample = (example: string) => {
    setDescription(example);
  };

  const selectCategory = (catId: string) => {
    setCategory(catId === category ? '' : catId);
  };

  const currentExamples = category ? EXAMPLE_PROMPTS_BY_CATEGORY[category] || [] : [];

  return (
    <div className="space-y-4">
      {/* Context indicator */}
      {(lessonContext?.title || courseContext?.title) && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>🎯 Contexte détecté :</strong>{' '}
              {courseContext?.title && <span>Cours "{courseContext.title}"</span>}
              {lessonContext?.title && <span> - Leçon "{lessonContext.title}"</span>}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              L'IA utilisera ce contexte pour générer un outil adapté à votre formation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category Selection */}
      <div>
        <Label className="mb-2 block">Type d'outil (optionnel)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TOOL_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
                <p className="font-medium text-sm">{cat.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label>Description de l'outil à créer</Label>
        <Textarea
          rows={4}
          placeholder={category 
            ? `Décrivez votre ${TOOL_CATEGORIES.find(c => c.id === category)?.label.toLowerCase() || 'outil'}...`
            : "Décrivez l'outil interactif que vous souhaitez créer pour vos étudiants..."
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Soyez précis : fonctionnalités, champs de saisie, calculs, résultats attendus...
        </p>
      </div>

      {/* Example prompts by category */}
      {currentExamples.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">💡 Exemples pour {TOOL_CATEGORIES.find(c => c.id === category)?.label} :</p>
          <div className="flex flex-wrap gap-2">
            {currentExamples.map((example, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1.5 px-3 whitespace-normal text-left"
                onClick={() => useExample(example)}
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={generateTool}
          disabled={isGenerating || !description.trim()}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : toolConfig.generatedCode ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Régénérer l'outil
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Générer avec l'IA
            </>
          )}
        </Button>

        {toolConfig.generatedCode && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Success state */}
      {toolConfig.generatedCode && (
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Outil généré le {new Date(toolConfig.generatedAt!).toLocaleString('fr-FR')}
              {toolConfig.category && ` (${TOOL_CATEGORIES.find(c => c.id === toolConfig.category)?.label})`}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Preview with sandboxed iframe */}
      {showPreview && toolConfig.generatedCode && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Prévisualisation (Mode Coach)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg bg-background overflow-hidden">
              <AIToolPreview code={toolConfig.generatedCode} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Sandboxed preview component with iframe
function AIToolPreview({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(300);

  useEffect(() => {
    if (!code) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'resize' && typeof event.data.height === 'number') {
        setIframeHeight(Math.max(200, event.data.height + 20));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code]);

  if (!code) {
    return <p className="text-muted-foreground text-center py-8">Aucun code généré</p>;
  }

  // Wrap the generated code with auto-resize script
  const wrappedCode = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        body { 
          margin: 0; 
          padding: 16px; 
          font-family: system-ui, -apple-system, sans-serif;
          background: transparent;
        }
      </style>
    </head>
    <body>
      ${code}
      <script>
        // Auto-resize iframe
        function sendHeight() {
          const height = document.body.scrollHeight;
          parent.postMessage({ type: 'resize', height }, '*');
        }
        
        // Send height on load and on DOM changes
        window.addEventListener('load', sendHeight);
        window.addEventListener('resize', sendHeight);
        
        // Observe DOM changes
        const observer = new MutationObserver(sendHeight);
        observer.observe(document.body, { 
          childList: true, 
          subtree: true, 
          attributes: true 
        });
        
        // Initial send
        setTimeout(sendHeight, 100);
      </script>
    </body>
    </html>
  `;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={wrappedCode}
      sandbox="allow-scripts allow-forms"
      className="w-full border-0"
      style={{ height: `${iframeHeight}px`, minHeight: '200px' }}
      title="Prévisualisation de l'outil IA"
    />
  );
}
