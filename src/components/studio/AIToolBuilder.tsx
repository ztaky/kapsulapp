import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, RefreshCw, Check, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIToolBuilderProps {
  toolConfig: {
    description?: string;
    generatedCode?: string;
    generatedAt?: string;
  };
  onChange: (config: any) => void;
  organizationId?: string;
}

const EXAMPLE_PROMPTS = [
  "Un calculateur de calories qui demande le poids, la taille, l'âge et le niveau d'activité",
  "Un quiz interactif sur les bases de la nutrition avec 5 questions",
  "Une checklist interactive pour suivre ses habitudes quotidiennes",
  "Un convertisseur d'unités (kg/lbs, km/miles, etc.)",
  "Un calculateur d'IMC avec interprétation des résultats",
];

export function AIToolBuilder({ toolConfig, onChange, organizationId }: AIToolBuilderProps) {
  const [description, setDescription] = useState(toolConfig.description || '');
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
        body: { description, organizationId },
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

  return (
    <div className="space-y-4">
      <div>
        <Label>Description de l'outil à créer</Label>
        <Textarea
          rows={4}
          placeholder="Décrivez l'outil interactif que vous souhaitez créer pour vos étudiants..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Soyez précis : fonctionnalités, champs de saisie, calculs, résultats attendus...
        </p>
      </div>

      {/* Exemples de prompts */}
      <div>
        <p className="text-sm font-medium mb-2">Exemples d'outils :</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-auto py-1 px-2"
              onClick={() => useExample(example)}
            >
              {example.slice(0, 40)}...
            </Button>
          ))}
        </div>
      </div>

      {/* Bouton de génération */}
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

      {/* État de génération réussie */}
      {toolConfig.generatedCode && (
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Outil généré le {new Date(toolConfig.generatedAt!).toLocaleString('fr-FR')}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Prévisualisation avec iframe sandboxé */}
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

// Composant de prévisualisation sandboxé avec iframe
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
