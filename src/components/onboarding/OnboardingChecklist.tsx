import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Check, 
  ChevronRight, 
  Palette, 
  BookOpen, 
  CreditCard, 
  FileText,
  Sparkles,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingStep } from "@/hooks/useOnboarding";

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  progress: number;
  completedCount: number;
  totalSteps: number;
  organizationSlug: string;
  onOpenWizard: () => void;
  onComplete: () => void;
}

const STEP_ICONS: Record<string, typeof Palette> = {
  profile_setup: Palette,
  first_course: BookOpen,
  stripe_connect: CreditCard,
  landing_page: FileText,
};

const STEP_PATHS: Record<string, string> = {
  profile_setup: "/branding",
  first_course: "/courses",
  stripe_connect: "/branding",
  landing_page: "/landing-pages",
};

export function OnboardingChecklist({
  steps,
  progress,
  completedCount,
  totalSteps,
  organizationSlug,
  onOpenWizard,
  onComplete,
}: OnboardingChecklistProps) {
  const navigate = useNavigate();

  const handleStepClick = (stepKey: string) => {
    const path = STEP_PATHS[stepKey];
    if (path) {
      navigate(`/school/${organizationSlug}/studio${path}`);
    }
  };

  const allCompleted = completedCount >= totalSteps;

  return (
    <Card className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl shadow-sm">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-pink-500" />
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3">
              <Sparkles className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                Configuration de votre académie
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {completedCount} sur {totalSteps} étapes complétées
              </p>
            </div>
          </div>
          {allCompleted && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onComplete}
              className="rounded-full text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Masquer
            </Button>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {progress}% complété
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {steps.map((step) => {
          const Icon = STEP_ICONS[step.key];
          const isCompleted = step.completed || step.skipped;

          return (
            <button
              key={step.key}
              onClick={() => !isCompleted && handleStepClick(step.key)}
              disabled={isCompleted}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                isCompleted 
                  ? "bg-slate-50/50 border-slate-100 opacity-60 cursor-default" 
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer"
              )}
            >
              <div className={cn(
                "rounded-lg p-2.5 shrink-0",
                isCompleted ? "bg-emerald-50" : "bg-amber-50"
              )}>
                {isCompleted ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Icon className="h-4 w-4 text-slate-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm",
                  isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {step.title}
                </p>
                <p className={cn(
                  "text-xs truncate mt-0.5",
                  isCompleted ? "text-muted-foreground" : "text-muted-foreground"
                )}>
                  {step.description}
                </p>
              </div>

              {!isCompleted && (
                <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
              )}
            </button>
          );
        })}

        {/* Action button */}
        <div className="pt-3">
          {allCompleted ? (
            <div className="text-center p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <p className="text-sm font-semibold text-emerald-700">
                Félicitations ! Votre académie est configurée
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Vous êtes prêt à créer et vendre vos formations
              </p>
            </div>
          ) : (
            <Button 
              onClick={onOpenWizard}
              variant="outline"
              className="w-full rounded-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Ouvrir l'assistant de configuration
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
