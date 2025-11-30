import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CourseContextData {
  courseTitle: string;
  courseDescription: string | null;
  coachSpecialty: string | null;
  organizationName: string | null;
  modules: {
    title: string;
    lessons: {
      title: string;
      contentText: string | null;
    }[];
  }[];
}

export function useCourseContext(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-context", courseId],
    queryFn: async (): Promise<CourseContextData | null> => {
      if (!courseId) return null;

      // Fetch course with organization
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select(`
          title,
          description,
          organizations(name, specialty)
        `)
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch modules with lessons
      const { data: modules, error: modulesError } = await supabase
        .from("modules")
        .select(`
          title,
          position,
          lessons(title, content_text, position)
        `)
        .eq("course_id", courseId)
        .order("position", { ascending: true });

      if (modulesError) throw modulesError;

      const org = course.organizations as { name: string; specialty: string | null } | null;

      return {
        courseTitle: course.title,
        courseDescription: course.description,
        coachSpecialty: org?.specialty || null,
        organizationName: org?.name || null,
        modules: modules.map((m) => ({
          title: m.title,
          lessons: (m.lessons as any[])
            ?.sort((a, b) => a.position - b.position)
            .map((l) => ({
              title: l.title,
              contentText: l.content_text,
            })) || [],
        })),
      };
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function formatCourseContextForAI(context: CourseContextData): string {
  const lines: string[] = [];

  if (context.coachSpecialty) {
    lines.push(`Spécialité du formateur : ${context.coachSpecialty}`);
  }

  lines.push(`\nCours : "${context.courseTitle}"`);
  
  if (context.courseDescription) {
    lines.push(`Description : ${context.courseDescription}`);
  }

  lines.push(`\nContenu complet du cours :`);

  context.modules.forEach((module, i) => {
    lines.push(`\n## Module ${i + 1} : ${module.title}`);
    module.lessons.forEach((lesson, j) => {
      lines.push(`### Leçon ${j + 1} : ${lesson.title}`);
      if (lesson.contentText) {
        // Limit content to avoid token overflow
        const truncated = lesson.contentText.length > 1000 
          ? lesson.contentText.substring(0, 1000) + "..." 
          : lesson.contentText;
        lines.push(truncated);
      }
    });
  });

  return lines.join("\n");
}
