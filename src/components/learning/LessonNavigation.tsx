import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface Module {
  id: string;
  title?: string;
  lessons: { id: string; position: number }[];
}

interface UserProgress {
  lesson_id: string;
  is_completed: boolean;
}

interface LessonNavigationProps {
  courseId: string;
  lessonId: string;
  modules: Module[];
  progress: UserProgress[];
  slug: string;
}

export function LessonNavigation({
  courseId,
  lessonId,
  modules,
  progress,
  slug,
}: LessonNavigationProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const allLessons = modules
    .flatMap((module, moduleIndex) =>
      module.lessons.map(lesson => ({
        ...lesson,
        moduleIndex,
        moduleId: module.id,
        moduleTitle: module.title
      }))
    )
    .sort((a, b) => {
      if (a.moduleIndex !== b.moduleIndex) {
        return a.moduleIndex - b.moduleIndex;
      }
      return a.position - b.position;
    });

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const currentLesson = allLessons[currentIndex];
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = progress.find((p) => p.lesson_id === lessonId)?.is_completed;

  // Calculate current module progress
  const currentModuleIndex = currentLesson?.moduleIndex ?? 0;
  const currentModule = modules[currentModuleIndex];
  const currentModuleLessons = currentModule?.lessons || [];
  const completedLessonsInModule = currentModuleLessons.filter(
    lesson => progress.find(p => p.lesson_id === lesson.id && p.is_completed)
  ).length;
  const moduleProgressPercent = currentModuleLessons.length > 0 
    ? (completedLessonsInModule / currentModuleLessons.length) * 100 
    : 0;

  // Check if current lesson is the last one in the module
  const isLastLessonInModule = currentLesson && (
    !nextLesson || nextLesson.moduleIndex !== currentLesson.moduleIndex
  );

  // Check if completing this lesson will complete the module
  const willCompleteModule = isLastLessonInModule && !isCompleted && 
    completedLessonsInModule === currentModuleLessons.length - 1;

  const launchModuleCompletionCelebration = () => {
    // Fire confetti from multiple angles for module completion
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#ea580c', '#db2777', '#10b981', '#3b82f6', '#f59e0b'];

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      // Fire from both sides
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors
      });
    }, 50);

    // Big burst in the center
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors
      });
    }, 200);
  };

  const launchLessonCompletionCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ea580c', '#db2777', '#10b981', '#3b82f6'],
    });
  };

  const markAsCompleteMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("Non authentifié");

      const { data: existing } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", session.session.user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_progress")
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_progress").insert({
          user_id: session.session.user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      return { willCompleteModule };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });

      if (data.willCompleteModule) {
        // Special celebration for module completion
        launchModuleCompletionCelebration();
        toast({ 
          title: "🏆 Module terminé !", 
          description: `Félicitations ! Vous avez terminé le module "${currentModule?.title || `Module ${currentModuleIndex + 1}`}"`,
        });
      } else {
        // Regular lesson celebration
        launchLessonCompletionCelebration();
        toast({ 
          title: "🎉 Félicitations !", 
          description: "Leçon terminée avec succès" 
        });
      }

      // Navigate to next lesson after enjoying the confetti
      if (nextLesson) {
        setTimeout(() => {
          navigate(`/school/${slug}/learn/${courseId}/lessons/${nextLesson.id}`);
        }, data.willCompleteModule ? 2000 : 1000);
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la leçon comme terminée",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 p-6 border-t border-slate-200 bg-white/80 backdrop-blur-sm rounded-3xl shadow-premium">
      {/* Module progress indicator */}
      <div className="flex items-center justify-center gap-3">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {currentModule?.title || `Module ${currentModuleIndex + 1}`}
        </span>
        <span className="text-xs text-muted-foreground">
          {completedLessonsInModule}/{currentModuleLessons.length} leçons
        </span>
        <div className="w-32">
          <Progress value={moduleProgressPercent} className="h-2" />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() =>
            previousLesson &&
            navigate(`/school/${slug}/learn/${courseId}/lessons/${previousLesson.id}`)
          }
          disabled={!previousLesson}
          className="rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Précédent
        </Button>

        <Button
          variant="gradient"
          size="lg"
          onClick={() => markAsCompleteMutation.mutate()}
          disabled={isCompleted || markAsCompleteMutation.isPending}
          className="min-w-[220px] shadow-lg"
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          {isCompleted ? "Terminé ✓" : "Marquer comme terminé"}
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            nextLesson && navigate(`/school/${slug}/learn/${courseId}/lessons/${nextLesson.id}`)
          }
          disabled={!nextLesson}
          className="rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300"
        >
          Suivant
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
