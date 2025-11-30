import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Lesson {
  id: string;
  title: string;
  type: string;
  position: number;
}

interface Module {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  is_published: boolean;
  modules: Module[];
}

interface StudioContext {
  organizationId: string | null;
  organizationName: string | null;
  courses: Course[];
  totalStudents: number;
  totalLessons: number;
  isLoading: boolean;
}

export function useStudioContext(): StudioContext {
  const { slug } = useParams<{ slug: string }>();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContext = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch organization
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('slug', slug)
          .single();

        if (orgError || !org) {
          console.error('Error fetching organization:', orgError);
          setIsLoading(false);
          return;
        }

        setOrganizationId(org.id);
        setOrganizationName(org.name);

        // Fetch courses with modules and lessons
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            price,
            is_published,
            modules (
              id,
              title,
              position,
              lessons (
                id,
                title,
                type,
                position
              )
            )
          `)
          .eq('organization_id', org.id)
          .order('created_at', { ascending: false });

        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
        } else if (coursesData) {
          // Sort modules and lessons by position
          const sortedCourses = coursesData.map(course => ({
            ...course,
            modules: (course.modules || [])
              .sort((a, b) => a.position - b.position)
              .map(mod => ({
                ...mod,
                lessons: (mod.lessons || []).sort((a, b) => a.position - b.position)
              }))
          }));
          setCourses(sortedCourses as Course[]);
        }

        // Fetch student count
        const { count: studentCount } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('role', 'student');

        setTotalStudents(studentCount || 0);
      } catch (error) {
        console.error('Error in useStudioContext:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContext();
  }, [slug]);

  // Calculate total lessons
  const totalLessons = courses.reduce((total, course) => {
    return total + course.modules.reduce((modTotal, mod) => modTotal + mod.lessons.length, 0);
  }, 0);

  return {
    organizationId,
    organizationName,
    courses,
    totalStudents,
    totalLessons,
    isLoading,
  };
}

// Helper to format context for AI
export function formatStudioContextForAI(context: StudioContext): string {
  if (context.courses.length === 0) {
    return "Le coach n'a pas encore créé de cours.";
  }

  let summary = `Académie: ${context.organizationName || 'Non défini'}\n`;
  summary += `Statistiques: ${context.courses.length} cours, ${context.totalLessons} leçons, ${context.totalStudents} étudiants\n\n`;
  summary += "Cours existants:\n";

  context.courses.forEach((course, idx) => {
    summary += `\n${idx + 1}. "${course.title}" (${course.is_published ? 'Publié' : 'Brouillon'}, ${course.price}€)\n`;
    if (course.description) {
      summary += `   Description: ${course.description.substring(0, 100)}${course.description.length > 100 ? '...' : ''}\n`;
    }
    if (course.modules.length > 0) {
      summary += `   Modules (${course.modules.length}):\n`;
      course.modules.slice(0, 5).forEach(mod => {
        summary += `   - ${mod.title} (${mod.lessons.length} leçons)\n`;
      });
      if (course.modules.length > 5) {
        summary += `   ... et ${course.modules.length - 5} autres modules\n`;
      }
    }
  });

  return summary;
}
