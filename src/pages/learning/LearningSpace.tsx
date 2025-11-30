import { useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CourseSidebar } from "@/components/learning/CourseSidebar";
import { ContentRenderer } from "@/components/learning/ContentRenderer";
import { LessonNavigation } from "@/components/learning/LessonNavigation";
import { TutorChatWidget } from "@/components/learning/TutorChatWidget";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function LearningSpace() {
  const { slug, courseId, lessonId } = useParams<{
    slug: string;
    courseId: string;
    lessonId?: string;
  }>();
  const navigate = useNavigate();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course-learning", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          organizations(name, slug, brand_color)
        `)
        .eq("id", courseId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select(`
          *,
          lessons(*)
        `)
        .eq("course_id", courseId)
        .order("position", { ascending: true });

      if (error) throw error;

      return data.map((m) => ({
        ...m,
        lessons: m.lessons?.sort((a: any, b: any) => a.position - b.position) || [],
      }));
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["user-progress", courseId, session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return [];

      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", session.user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user.id,
  });

  const { data: hasPurchased, isLoading: purchaseLoading } = useQuery({
    queryKey: ["has-purchased", courseId, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id || !course) return true;

      // Si le cours est gratuit, accès direct
      if (course.price === 0) return true;

      const { data } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("course_id", courseId)
        .eq("status", "completed")
        .maybeSingle();

      return !!data;
    },
    enabled: !!session?.user?.id && !!courseId && !!course,
  });

  const { data: currentLesson } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      if (!lessonId) return null;

      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });

  // Redirect to first incomplete lesson if no lessonId
  useEffect(() => {
    if (!lessonId && modules && modules.length > 0 && progress) {
      const allLessons = modules.flatMap((m) => m.lessons);
      const firstIncomplete = allLessons.find(
        (lesson: any) => !progress.find((p) => p.lesson_id === lesson.id && p.is_completed)
      );

      const targetLesson = firstIncomplete || allLessons[0];
      if (targetLesson) {
        navigate(`/school/${slug}/learn/${courseId}/lessons/${targetLesson.id}`, {
          replace: true,
        });
      }
    }
  }, [lessonId, modules, progress, navigate, slug, courseId]);

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (courseLoading || modulesLoading || purchaseLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course || !modules) {
    return <Navigate to="/dashboard" replace />;
  }

  // Vérifier l'accès au cours (achat requis)
  if (!hasPurchased) {
    return <Navigate to={`/school/${slug}/course/${courseId}`} replace />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-slate-50/30 to-orange-50/20">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 border-r border-slate-100 bg-white/60 backdrop-blur-sm overflow-y-auto">
        <CourseSidebar
          course={course}
          modules={modules}
          progress={progress || []}
          currentLessonId={lessonId}
        />
      </aside>

      {/* Mobile Menu */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-2xl shadow-lg bg-white/90 backdrop-blur-sm border-slate-200">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-white/95 backdrop-blur-md">
            <CourseSidebar
              course={course}
              modules={modules}
              progress={progress || []}
              currentLessonId={lessonId}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 lg:p-12">
          {currentLesson && (
            <>
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-900 via-slate-800 to-orange-900 bg-clip-text text-transparent tracking-tight">
                  {currentLesson.title}
                </h1>
              </div>

              <ContentRenderer lesson={currentLesson} />

              <div className="mt-12">
                <LessonNavigation
                  courseId={courseId!}
                  lessonId={lessonId!}
                  modules={modules}
                  progress={progress || []}
                  slug={slug!}
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* AI Tutor Widget */}
      {courseId && currentLesson && (
        <TutorChatWidget 
          courseId={courseId}
          currentLessonTitle={currentLesson.title}
        />
      )}
    </div>
  );
}
