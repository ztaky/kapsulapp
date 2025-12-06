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

/**
 * Converts Markdown content to HTML for proper display
 */
function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Emoji headers (🎯 **Objectif** → styled header)
  html = html.replace(/^([\u{1F300}-\u{1F9FF}])\s*\*\*(.+?)\*\*/gmu, '<h4 class="text-md font-semibold mt-4 mb-2 flex items-center gap-2"><span>$1</span>$2</h4>');
  
  // Bullet lists
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="list-disc list-inside my-2">$&</ul>');
  
  // Numbered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 mb-1">$1</li>');
  
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-100 p-3 rounded-lg my-2 overflow-x-auto"><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-sm">$1</code>');
  
  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p class="my-3">');
  html = html.replace(/\n/g, '<br/>');
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p class="my-3">' + html + '</p>';
  }
  
  return html;
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

          // Convert Markdown to HTML before saving
          const htmlContent = markdownToHtml(lesson.content);

          const { error: lessonError } = await (supabase.from("lessons") as any).insert({
            module_id: newModule.id,
            title: lesson.title,
            content_text: htmlContent,
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
