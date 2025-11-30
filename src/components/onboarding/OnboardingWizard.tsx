import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Palette, 
  BookOpen, 
  CreditCard, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  PartyPopper
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationSlug: string;
  organizationName: string;
  onStepAction: (stepKey: string, action: "complete" | "skip") => void;
  currentStepIndex?: number;
}

const WIZARD_STEPS = [
  {
    key: "welcome",
    title: "Bienvenue sur Kapsul ! 🎉",
    subtitle: "Configurons ensemble votre académie",
    description: "En quelques étapes, vous aurez tout ce qu'il faut pour créer et vendre vos formations en ligne.",
    icon: Sparkles,
    color: "from-orange-500 to-pink-500",
    bgColor: "bg-gradient-to-br from-orange-50 to-pink-50",
  },
  {
    key: "profile_setup",
    title: "Personnalisez votre académie",
    subtitle: "Logo & couleurs",
    description: "Ajoutez votre logo et choisissez votre couleur de marque pour refléter votre identité.",
    icon: Palette,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
    actionLabel: "Aller aux Paramètres",
    actionPath: "/branding",
  },
  {
    key: "first_course",
    title: "Créez votre première formation",
    subtitle: "Structurez votre contenu",
    description: "Organisez votre savoir en modules et leçons. Notre assistant IA peut vous aider à structurer votre cours.",
    icon: BookOpen,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
    actionLabel: "Créer une formation",
    actionPath: "/courses",
  },
  {
    key: "stripe_connect",
    title: "Connectez vos paiements",
    subtitle: "Stripe Connect",
    description: "Recevez vos paiements directement sur votre compte bancaire grâce à Stripe.",
    icon: CreditCard,
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-gradient-to-br from-purple-50 to-violet-50",
    actionLabel: "Connecter Stripe",
    actionPath: "/branding",
  },
  {
    key: "landing_page",
    title: "Créez une page de vente",
    subtitle: "Génération IA",
    description: "Notre IA génère une landing page professionnelle pour vendre votre formation.",
    icon: FileText,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
    actionLabel: "Créer une landing page",
    actionPath: "/landing-pages",
  },
  {
    key: "complete",
    title: "Vous êtes prêt ! 🚀",
    subtitle: "Configuration terminée",
    description: "Votre académie est configurée. Vous pouvez maintenant créer du contenu et accueillir vos premiers étudiants !",
    icon: PartyPopper,
    color: "from-orange-500 to-pink-500",
    bgColor: "bg-gradient-to-br from-orange-50 to-pink-50",
  },
];

export function OnboardingWizard({
  open,
  onOpenChange,
  organizationSlug,
  organizationName,
  onStepAction,
  currentStepIndex = 0,
}: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(currentStepIndex);
  const step = WIZARD_STEPS[currentStep];
  const Icon = step.icon;

  const progress = ((currentStep) / (WIZARD_STEPS.length - 1)) * 100;

  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      // Fire confetti on completion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    const actionPath = (step as { actionPath?: string }).actionPath;
    if (actionPath) {
      onStepAction(step.key, "complete");
      navigate(`/school/${organizationSlug}/studio${actionPath}`);
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    if (step.key !== "welcome" && step.key !== "complete") {
      onStepAction(step.key, "skip");
    }
    handleNext();
  };

  const handleFinish = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Étape {currentStep + 1} sur {WIZARD_STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          <DialogHeader className="text-center space-y-4">
            <div className={cn("mx-auto w-20 h-20 rounded-3xl flex items-center justify-center", step.bgColor)}>
              <Icon className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {step.subtitle}
              </p>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {step.title}
              </DialogTitle>
            </div>
          </DialogHeader>

          <p className="text-center text-muted-foreground mt-4 leading-relaxed">
            {step.description}
          </p>

          {currentStep === 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-secondary/50 border border-border">
              <p className="text-sm text-center">
                <span className="text-muted-foreground">Académie : </span>
                <span className="font-semibold text-foreground">{organizationName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex flex-col gap-3">
          {step.key === "welcome" ? (
            <Button onClick={handleNext} className="w-full rounded-full h-12 text-base font-semibold">
              Commencer la configuration
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : step.key === "complete" ? (
            <Button onClick={handleFinish} className="w-full rounded-full h-12 text-base font-semibold">
              Aller au tableau de bord
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <>
              <Button onClick={handleAction} className="w-full rounded-full h-12 text-base font-semibold">
                {(step as { actionLabel?: string }).actionLabel}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handlePrev} className="flex-1 rounded-full">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                )}
                <Button variant="ghost" onClick={handleSkip} className="flex-1 rounded-full text-muted-foreground">
                  Plus tard
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
