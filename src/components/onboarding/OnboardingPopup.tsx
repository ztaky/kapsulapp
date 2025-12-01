import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  PartyPopper,
  X,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface OnboardingPopupProps {
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
    title: "Bienvenue ! 🎉",
    subtitle: "Configuration",
    description: "Configurons ensemble votre académie en quelques étapes.",
    icon: Sparkles,
    bgColor: "bg-gradient-to-br from-orange-100 to-pink-100",
  },
  {
    key: "profile_setup",
    title: "Personnalisez",
    subtitle: "Logo & couleurs",
    description: "Ajoutez votre logo et couleur de marque.",
    icon: Palette,
    bgColor: "bg-gradient-to-br from-blue-100 to-cyan-100",
    actionLabel: "Paramètres",
    actionPath: "/branding",
  },
  {
    key: "first_course",
    title: "Première formation",
    subtitle: "Contenu",
    description: "Créez et structurez votre premier cours.",
    icon: BookOpen,
    bgColor: "bg-gradient-to-br from-green-100 to-emerald-100",
    actionLabel: "Créer",
    actionPath: "/courses",
  },
  {
    key: "stripe_connect",
    title: "Paiements",
    subtitle: "Stripe Connect",
    description: "Connectez Stripe pour recevoir vos paiements.",
    icon: CreditCard,
    bgColor: "bg-gradient-to-br from-purple-100 to-violet-100",
    actionLabel: "Connecter",
    actionPath: "/branding",
  },
  {
    key: "landing_page",
    title: "Page de vente",
    subtitle: "Landing page",
    description: "Générez une page de vente avec l'IA.",
    icon: FileText,
    bgColor: "bg-gradient-to-br from-amber-100 to-orange-100",
    actionLabel: "Créer",
    actionPath: "/landing-pages",
  },
  {
    key: "complete",
    title: "C'est prêt ! 🚀",
    subtitle: "Terminé",
    description: "Votre académie est configurée !",
    icon: PartyPopper,
    bgColor: "bg-gradient-to-br from-orange-100 to-pink-100",
  },
];

const MINIMIZED_KEY = "onboarding_minimized";

export function OnboardingPopup({
  open,
  onOpenChange,
  organizationSlug,
  organizationName,
  onStepAction,
  currentStepIndex = 0,
}: OnboardingPopupProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(currentStepIndex);
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(MINIMIZED_KEY) === "true";
    }
    return false;
  });

  const step = WIZARD_STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep) / (WIZARD_STEPS.length - 1)) * 100;

  useEffect(() => {
    localStorage.setItem(MINIMIZED_KEY, String(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1 && !isMinimized) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8, x: 0.9 },
      });
    }
  }, [currentStep, isMinimized]);

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
    setIsMinimized(false);
    localStorage.removeItem(MINIMIZED_KEY);
  };

  const handleClose = () => {
    onOpenChange(false);
    setIsMinimized(false);
    localStorage.removeItem(MINIMIZED_KEY);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  if (!open) return null;

  // Minimized badge
  if (isMinimized) {
    return (
      <button
        onClick={handleMaximize}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-full shadow-elevated hover:shadow-lg transition-all hover:scale-105 animate-slide-in-right-bottom"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {currentStep + 1}/{WIZARD_STEPS.length}
        </span>
        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </button>
    );
  }

  // Full popup
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] animate-slide-in-right-bottom">
      <div className="bg-card border border-border rounded-2xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Configuration</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleMinimize}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Minimiser"
            >
              <Minus className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Étape {currentStep + 1} sur {WIZARD_STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Content */}
        <div className="p-4 text-center">
          <div className={cn("mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3", step.bgColor)}>
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {step.subtitle}
          </p>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {currentStep === 0 && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                Académie : <span className="font-medium text-foreground">{organizationName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex flex-col gap-2">
          {step.key === "welcome" ? (
            <Button onClick={handleNext} className="w-full rounded-full h-10 text-sm font-semibold">
              Commencer
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : step.key === "complete" ? (
            <Button onClick={handleFinish} className="w-full rounded-full h-10 text-sm font-semibold">
              Terminer
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button onClick={handleAction} className="w-full rounded-full h-10 text-sm font-semibold">
                {(step as { actionLabel?: string }).actionLabel}
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handlePrev} className="flex-1 rounded-full h-9 text-sm">
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                    Retour
                  </Button>
                )}
                <Button variant="ghost" onClick={handleSkip} className="flex-1 rounded-full h-9 text-sm text-muted-foreground">
                  Plus tard
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
