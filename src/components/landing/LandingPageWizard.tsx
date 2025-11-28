import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import { StepCourseSelection } from "./StepCourseSelection";
import { StepDesign } from "./StepDesign";
import { StepTargetAudience } from "./StepTargetAudience";
import { StepTrainerInfo } from "./StepTrainerInfo";
import { StepReferences } from "./StepReferences";
import { StepCloneDesign } from "./StepCloneDesign";
import { StepGeneration } from "./StepGeneration";

interface LandingPageWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface WizardData {
  courseId: string;
  courseName?: string;
  courseContent?: any;
  colors: string[];
  fonts: { heading: string; body: string };
  ctaStyle: 'solid' | 'gradient';
  theme: 'light' | 'dark';
  targetAudience: string;
  trainerName: string;
  trainerBio: string;
  trainerPhoto?: string;
  trainerSocials: { platform: string; url: string }[];
  referenceScreenshots: string[];
  cloneSourceUrl?: string;
}

const STEPS = [
  { id: 1, title: "Formation", component: StepCourseSelection },
  { id: 2, title: "Design", component: StepDesign },
  { id: 3, title: "Client Cible", component: StepTargetAudience },
  { id: 4, title: "Formateur", component: StepTrainerInfo },
  { id: 5, title: "Références", component: StepReferences },
  { id: 6, title: "Clone Design", component: StepCloneDesign },
  { id: 7, title: "Génération", component: StepGeneration },
];

export function LandingPageWizard({ open, onClose, onSuccess }: LandingPageWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    courseId: "",
    colors: ["#d97706", "#f59e0b"],
    fonts: { heading: "Inter", body: "Inter" },
    ctaStyle: "gradient",
    theme: "light",
    targetAudience: "",
    trainerName: "",
    trainerBio: "",
    trainerSocials: [],
    referenceScreenshots: [],
  });

  // Reset wizard to step 1 when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
    }
  }, [open]);

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDataUpdate = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.courseId !== "";
      case 2:
        return wizardData.colors.length >= 2 && wizardData.fonts.heading && wizardData.fonts.body && wizardData.theme;
      case 3:
        return wizardData.targetAudience.length > 0;
      case 4:
        return wizardData.trainerName.length > 0 && wizardData.trainerBio.length > 0;
      case 5:
      case 6:
        return true; // Optional steps
      case 7:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Créer une Page de Vente
          </DialogTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Étape {currentStep} sur {STEPS.length}</span>
              <span>{STEPS[currentStep - 1].title}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="py-6">
          <CurrentStepComponent
            data={wizardData}
            onUpdate={handleDataUpdate}
            onSuccess={onSuccess}
          />
        </div>

        {currentStep < 7 && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Suivant
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
