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

const STEP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  profile_setup: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  first_course: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  stripe_connect: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  landing_page: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
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
    <Card className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl shadow-premium">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-pink-500" />
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 p-3">
              <Sparkles className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                Configuration de votre académie
              </CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">
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
          <p className="text-xs text-slate-500 mt-2">
            {progress}% complété
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {steps.map((step) => {
          const Icon = STEP_ICONS[step.key];
          const colors = STEP_COLORS[step.key];
          const isCompleted = step.completed || step.skipped;

          return (
            <button
              key={step.key}
              onClick={() => !isCompleted && handleStepClick(step.key)}
              disabled={isCompleted}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                isCompleted 
                  ? "bg-slate-50 border-slate-100 opacity-60 cursor-default" 
                  : `${colors.bg} ${colors.border} hover:shadow-md cursor-pointer`
              )}
            >
              <div className={cn(
                "rounded-xl p-2.5 shrink-0",
                isCompleted ? "bg-green-100" : colors.bg
              )}>
                {isCompleted ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Icon className={cn("h-5 w-5", colors.text)} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-semibold text-sm",
                  isCompleted ? "text-slate-400 line-through" : "text-slate-900"
                )}>
                  {step.title}
                </p>
                <p className={cn(
                  "text-xs truncate mt-0.5",
                  isCompleted ? "text-slate-400" : "text-slate-500"
                )}>
                  {step.description}
                </p>
              </div>

              {!isCompleted && (
                <ChevronRight className={cn("h-5 w-5 shrink-0", colors.text)} />
              )}
            </button>
          );
        })}

        {/* Action button */}
        <div className="pt-3">
          {allCompleted ? (
            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <p className="text-sm font-semibold text-green-700">
                🎉 Félicitations ! Votre académie est configurée
              </p>
              <p className="text-xs text-green-600 mt-1">
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
