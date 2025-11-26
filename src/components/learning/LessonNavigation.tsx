import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Module {
  id: string;
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
    .flatMap((m) => m.lessons)
    .sort((a, b) => a.position - b.position);

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = progress.find((p) => p.lesson_id === lessonId)?.is_completed;

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
      toast({ title: "Leçon terminée !" });

      // Navigate to next lesson
      if (nextLesson) {
        setTimeout(() => {
          navigate(`/school/${slug}/learn/${courseId}/lessons/${nextLesson.id}`);
        }, 500);
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
    <div className="flex items-center justify-between gap-4 p-6 border-t">
      <Button
        variant="outline"
        onClick={() =>
          previousLesson &&
          navigate(`/school/${slug}/learn/${courseId}/lessons/${previousLesson.id}`)
        }
        disabled={!previousLesson}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Précédent
      </Button>

      <Button
        size="lg"
        onClick={() => markAsCompleteMutation.mutate()}
        disabled={isCompleted || markAsCompleteMutation.isPending}
        className="min-w-[200px]"
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
      >
        Suivant
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
