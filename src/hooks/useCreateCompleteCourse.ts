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

interface LessonData {
  title: string;
  content: string;
  has_quiz?: boolean;
  quiz?: QuizConfig;
}

interface ModuleData {
  title: string;
  description?: string;
  lessons: LessonData[];
}

interface CourseData {
  title: string;
  description: string;
  target_audience?: string;
  duration_estimate?: string;
}

interface CompleteCourseData {
  course: CourseData;
  modules: ModuleData[];
}

export function useCreateCompleteCourse() {
  const createCompleteCourse = async (
    organizationId: string,
    courseData: CompleteCourseData
  ): Promise<{ success: boolean; courseId?: string; error?: string }> => {
    try {
      // 1. Créer le cours
      const { data: newCourse, error: courseError } = await supabase
        .from("courses")
        .insert({
          organization_id: organizationId,
          title: courseData.course.title,
          description: courseData.course.description,
          price: 0,
          is_published: false,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 2. Créer les modules et leçons
      for (let moduleIdx = 0; moduleIdx < courseData.modules.length; moduleIdx++) {
        const moduleData = courseData.modules[moduleIdx];

        // Créer le module
        const { data: newModule, error: moduleError } = await supabase
          .from("modules")
          .insert({
            course_id: newCourse.id,
            title: moduleData.title,
            position: moduleIdx,
          })
          .select()
          .single();

        if (moduleError) throw moduleError;

        // 3. Créer les leçons pour ce module
        for (let lessonIdx = 0; lessonIdx < moduleData.lessons.length; lessonIdx++) {
          const lesson = moduleData.lessons[lessonIdx];

          const { error: lessonError } = await (supabase.from("lessons") as any).insert({
            module_id: newModule.id,
            title: lesson.title,
            content_text: lesson.content,
            type: lesson.has_quiz ? "interactive_tool" : "video",
            tool_id: lesson.has_quiz ? "quiz" : null,
            tool_config: lesson.has_quiz && lesson.quiz ? lesson.quiz : null,
            position: lessonIdx,
          });

          if (lessonError) throw lessonError;
        }
      }

      toast.success(`Cours "${courseData.course.title}" créé avec succès !`);
      return { success: true, courseId: newCourse.id };
    } catch (error) {
      console.error("Error creating complete course:", error);
      toast.error("Erreur lors de la création du cours");
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  };

  return { createCompleteCourse };
}
