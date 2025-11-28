import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wand2, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { WizardData } from "./LandingPageWizard";
import { 
  getHeroPrompt, 
  getAgitationPrompt,
  getSolutionTimeframePrompt,
  getPedagogyPrompt,
  getProgramPrompt,
  getTestimonialsPrompt,
  getFAQPrompt,
  getBonusPrompt,
  getGuaranteePrompt,
  getInstructorPrompt,
  getPricingPrompt,
  getFAQFinalPrompt,
  getFooterPrompt
} from '@/config/landingPagePrompts';
import { createThemeFromWizard } from '@/config/landingPageSchema';

interface StepGenerationProps {
  data: WizardData;
  onSuccess: () => void;
}

const GENERATION_STEPS = [
  "Préparation du contexte...",
  "Génération Hero (1/13)...",
  "Génération Agitation (2/13)...",
  "Génération Solution (3/13)...",
  "Génération Pédagogie (4/13)...",
  "Génération Programme (5/13)...",
  "Génération Témoignages (6/13)...",
  "Génération FAQ (7/13)...",
  "Génération Bonus (8/13)...",
  "Génération Garantie (9/13)...",
  "Génération Formateur (10/13)...",
  "Génération Pricing (11/13)...",
  "Génération FAQ Finale (12/13)...",
  "Génération Footer (13/13)...",
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
      // Helper function pour appeler Gemini
      const callGemini = async (prompt: string): Promise<any> => {
        const { data: responseData, error } = await supabase.functions.invoke(
          "generate-landing-page-pro",
          {
            body: { prompt, mode: "single-section" }
          }
        );
        
        if (error) throw error;
        
        // Parse la réponse JSON de Gemini
        try {
          return JSON.parse(responseData.content);
        } catch (e) {
          // Si Gemini retourne avec markdown, on nettoie
          const cleaned = responseData.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(cleaned);
        }
      };

      // Créer le thème depuis les données du wizard
      const theme = createThemeFromWizard(data);

      // Génération section par section
      const content: any = {};
      
      setCurrentStep(1);
      content.hero = await callGemini(getHeroPrompt(data));
      
      setCurrentStep(2);
      content.agitation = await callGemini(getAgitationPrompt(data));
      
      setCurrentStep(3);
      content.solutionTimeframe = await callGemini(getSolutionTimeframePrompt(data));
      
      setCurrentStep(4);
      content.pedagogy = await callGemini(getPedagogyPrompt(data));
      
      setCurrentStep(5);
      content.program = await callGemini(getProgramPrompt(data));
      
      setCurrentStep(6);
      content.testimonials = await callGemini(getTestimonialsPrompt(data));
      
      setCurrentStep(7);
      content.faq = await callGemini(getFAQPrompt(data));
      
      setCurrentStep(8);
      content.bonus = await callGemini(getBonusPrompt(data));
      
      setCurrentStep(9);
      content.guarantee = await callGemini(getGuaranteePrompt(data));
      
      setCurrentStep(10);
      content.instructor = await callGemini(getInstructorPrompt(data));
      
      setCurrentStep(11);
      content.pricing = await callGemini(getPricingPrompt(data));
      
      setCurrentStep(12);
      content.faqFinal = await callGemini(getFAQFinalPrompt(data));
      
      setCurrentStep(13);
      content.footer = await callGemini(getFooterPrompt(data));
      
      setCurrentStep(14);

      // Assembler la config complète
      const landingPageConfig = {
        theme,
        content
      };

      setGeneratedContent(landingPageConfig);

      // Sauvegarder dans la DB
      const slug = `${data.courseName?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      
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
        content: JSON.parse(JSON.stringify(landingPageConfig)),
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
          Gemini 3 va créer une landing page professionnelle avec un copywriting expert
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
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-semibold">Génération en cours...</span>
          </div>
          <Progress value={(currentStep / GENERATION_STEPS.length) * 100} />
          <p className="text-sm text-muted-foreground">
            {GENERATION_STEPS[currentStep]}
          </p>
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
            Landing page générée avec succès ! Elle sera bientôt disponible dans votre liste.
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
          Générer avec Gemini 3 (Nouveau Système)
        </Button>
      )}
    </div>
  );
}
