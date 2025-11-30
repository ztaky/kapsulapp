import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wand2, CheckCircle2, Loader2, AlertCircle, Sparkles, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { WizardData } from "./LandingPageWizard";
import { 
  getHeroPrompt,
  getAgitationPrompt,
  getSolutionTimeframePrompt,
  getPedagogyPrompt,
  getProgramPrompt
} from '@/config/landingPagePrompts';
import { createThemeFromWizard } from '@/config/landingPageSchema';

interface StepGenerationProps {
  data: WizardData;
  onSuccess: () => void;
}

const GENERATION_STEPS = [
  "Préparation du contexte...",
  "Génération Hero (Gemini + GPT-5)...",
  "Génération Agitation...",
  "Génération Solution & Timeframe...",
  "Génération Pédagogie...",
  "Génération Programme...",
  "Finalisation et sauvegarde...",
];

export function StepGeneration({ data, onSuccess }: StepGenerationProps) {
  const { currentOrg } = useUserOrganizations();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const handleGenerate = async () => {
    if (!currentOrg?.id) return;

    setIsGenerating(true);
    setError(null);
    setCurrentStep(0);

    try {
      // Helper function pour appeler l'IA via l'edge function (mode single-section)
      const callAI = async (prompt: string): Promise<any> => {
        const { data: responseData, error } = await supabase.functions.invoke(
          "generate-landing-page-pro",
          {
            body: { 
              mode: "single-section",
              prompt: prompt
            }
          }
        );
        
        if (error) throw error;
        
        console.log("Réponse brute de l'IA:", responseData.content);
        
        // Nettoyer la réponse
        let cleaned = responseData.content;
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        cleaned = cleaned.trim();
        cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
        
        console.log("JSON nettoyé:", cleaned);
        
        try {
          return JSON.parse(cleaned);
        } catch (e) {
          console.error("Erreur parsing JSON:", e);
          console.error("JSON problématique:", cleaned);
          throw new Error(`L'IA a retourné un JSON invalide: ${(e as Error).message}`);
        }
      };

      // Créer le thème depuis les données du wizard
      const theme = createThemeFromWizard(data);

      // === ÉTAPE 1 : Hero ===
      setCurrentStep(1);
      console.log("=== Génération Hero ===");
      const heroContent = await callAI(getHeroPrompt(data));
      console.log("Hero généré:", heroContent);

      // === ÉTAPE 2 : Agitation ===
      setCurrentStep(2);
      console.log("=== Génération Agitation ===");
      const agitationContent = await callAI(getAgitationPrompt(data));
      console.log("Agitation généré:", agitationContent);

      // === ÉTAPE 3 : Solution Timeframe ===
      setCurrentStep(3);
      console.log("=== Génération Solution Timeframe ===");
      const solutionTimeframeContent = await callAI(getSolutionTimeframePrompt(data));
      console.log("Solution Timeframe généré:", solutionTimeframeContent);

      // === ÉTAPE 4 : Pédagogie ===
      setCurrentStep(4);
      console.log("=== Génération Pédagogie ===");
      const pedagogyContent = await callAI(getPedagogyPrompt(data));
      console.log("Pédagogie généré:", pedagogyContent);

      // === ÉTAPE 5 : Programme ===
      setCurrentStep(5);
      console.log("=== Génération Programme ===");
      const programContent = await callAI(getProgramPrompt(data));
      console.log("Programme généré:", programContent);

      // === ÉTAPE 6 : Assemblage final ===
      setCurrentStep(6);
      
      const landingPageConfig = {
        theme,
        content: {
          hero: heroContent,
          agitation: agitationContent,
          solutionTimeframe: solutionTimeframeContent,
          pedagogy: pedagogyContent,
          program: programContent,
          // Sections à générer dans une future itération
          testimonials: { headline: "Ils ont transformé leur business", stars: 5, items: [], cta: "" },
          faq: { headline: "Questions fréquentes", questions: [], cta: "" },
          bonus: { headline: "Bonus exclusifs", subheadline: "", items: [], cta: "" },
          guarantee: { title: "Garantie 30 jours", description: "Satisfait ou remboursé", riskPhrase: "" },
          instructor: { 
            headline: "Votre formateur", 
            name: data.trainerName || "", 
            photo: data.trainerPhoto || "", 
            credentials: [], 
            mission: data.trainerBio || "", 
            difference: "" 
          },
          pricing: { headline: "Tarifs", subheadline: "", offers: [] },
          faqFinal: { questions: [] },
          footer: { logo: "", copyright: "", links: [] }
        }
      };

      setGeneratedContent(landingPageConfig);

      // Sauvegarder dans la DB
      const slug = `${data.courseName?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      
      console.log("=== DEBUG SAUVEGARDE ===");
      console.log("Config complète:", landingPageConfig);
      
      const { error: insertError } = await supabase.from("landing_pages").insert([{
        organization_id: currentOrg.id,
        course_id: data.courseId!,
        name: data.courseName || "Ma Landing Page",
        slug,
        status: "draft" as const,
        design_config: {
          colors: data.colors,
          fonts: data.fonts,
          ctaStyle: data.ctaStyle,
          layout: "modern",
        },
        content: JSON.parse(JSON.stringify({
          theme: landingPageConfig.theme,
          ...landingPageConfig.content
        })),
        trainer_info: {
          name: data.trainerName,
          bio: data.trainerBio,
          photo: data.trainerPhoto,
          socials: data.trainerSocials,
        },
        target_audience: data.targetAudience,
        reference_screenshots: data.referenceScreenshots,
        clone_source_url: data.cloneSourceUrl,
      }]);

      if (insertError) throw insertError;

      toast.success("Landing page créée avec succès !");
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Une erreur est survenue lors de la génération");
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Génération de la Landing Page</h3>
        <p className="text-muted-foreground">
          Approche dual-model : Gemini pour la structure + GPT-5 pour le copywriting premium
        </p>
      </div>

      {/* Summary */}
      <Card className="p-6 space-y-4">
        <h4 className="font-semibold">Récapitulatif</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Formation :</span>
            <span className="font-medium">{data.courseName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Couleurs :</span>
            <div className="flex gap-1">
              {data.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Formateur :</span>
            <span className="font-medium">{data.trainerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Références :</span>
            <span className="font-medium">{data.referenceScreenshots.length} image(s)</span>
          </div>
          {data.cloneSourceUrl && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clone :</span>
              <span className="font-medium text-xs truncate max-w-[200px]">
                {data.cloneSourceUrl}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Generation Progress */}
      {isGenerating && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-amber-500 animate-pulse" />
            </div>
            <span className="font-semibold">Génération en cours...</span>
          </div>
          <Progress value={(currentStep / GENERATION_STEPS.length) * 100} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {currentStep <= 1 && <Brain className="h-4 w-4 text-blue-500" />}
            {currentStep > 1 && currentStep < 6 && <Sparkles className="h-4 w-4 text-amber-500" />}
            {currentStep >= 6 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            <span>{GENERATION_STEPS[currentStep]}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Étape {currentStep + 1} / {GENERATION_STEPS.length}
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success */}
      {generatedContent && !isGenerating && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Landing page générée avec succès ! 5 sections complètes créées.
          </AlertDescription>
        </Alert>
      )}

      {/* Generate Button */}
      {!isGenerating && !generatedContent && (
        <Button
          onClick={handleGenerate}
          size="lg"
          className="w-full shadow-premium"
          disabled={isGenerating}
        >
          <Wand2 className="mr-2 h-5 w-5" />
          Générer avec Gemini + GPT-5 (Dual-Model)
        </Button>
      )}
    </div>
  );
}
