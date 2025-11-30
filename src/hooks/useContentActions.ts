import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuizQuestion {
  question: string;
  answers: string[];
  correctIndex: number;
  explanation?: string;
}

interface QuizConfig {
  title: string;
  questions: QuizQuestion[];
}

interface ModuleData {
  title: string;
  lessons: { title: string; type?: "video" | "interactive_tool" }[];
}

export function useContentActions() {
  const saveQuizToLesson = async (lessonId: string, quizConfig: QuizConfig) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("lessons") as any)
        .update({
          type: "interactive_tool",
          tool_id: "quiz",
          tool_config: quizConfig,
        })
        .eq("id", lessonId);

      if (error) throw error;

      toast.success(`Quiz "${quizConfig.title}" ajouté à la leçon !`);
      return { success: true };
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Erreur lors de l'ajout du quiz");
      return { success: false, error };
    }
  };

  const createModulesForCourse = async (courseId: string, modulesData: ModuleData[]) => {
    try {
      // Get current max position
      const { data: existingModules } = await supabase
        .from("modules")
        .select("position")
        .eq("course_id", courseId)
        .order("position", { ascending: false })
        .limit(1);

      let startPosition = (existingModules?.[0]?.position ?? -1) + 1;

      for (const moduleData of modulesData) {
        // Create module
        const { data: newModule, error: moduleError } = await supabase
          .from("modules")
          .insert({
            course_id: courseId,
            title: moduleData.title,
            position: startPosition++,
          })
          .select()
          .single();

        if (moduleError) throw moduleError;

        // Create lessons for this module
        if (moduleData.lessons.length > 0) {
          const lessonsToInsert = moduleData.lessons.map((lesson, idx) => ({
            module_id: newModule.id,
            title: lesson.title,
            type: lesson.type || "video",
            position: idx,
          }));

          const { error: lessonsError } = await supabase
            .from("lessons")
            .insert(lessonsToInsert);

          if (lessonsError) throw lessonsError;
        }
      }

      toast.success(`${modulesData.length} modules créés avec succès !`);
      return { success: true };
    } catch (error) {
      console.error("Error creating modules:", error);
      toast.error("Erreur lors de la création des modules");
      return { success: false, error };
    }
  };

  return {
    saveQuizToLesson,
    createModulesForCourse,
  };
}
