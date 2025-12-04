import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DashboardHeader } from "@/components/shared/DashboardHeader";

interface CourseWithProgress {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  organization_slug: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserCourses(session.user.id);
      }
    });
  }, []);

  const fetchUserCourses = async (userId: string) => {
    setLoading(true);

    try {
      // 1. Récupérer les cours achetés
      const { data: purchases } = await supabase
        .from("purchases")
        .select(`
          course_id,
          courses (
            id,
            title,
            description,
            cover_image,
            organization_id,
            organizations (slug)
          )
        `)
        .eq("user_id", userId)
        .eq("status", "completed");

      // 2. Récupérer les cours inscrits manuellement
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select(`
          course_id,
          courses (
            id,
            title,
            description,
            cover_image,
            organization_id,
            organizations (slug)
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true);

      // 3. Fusionner et dédupliquer les cours
      const allCourses = new Map<string, any>();
      purchases?.forEach((p: any) => {
        if (p.courses) allCourses.set(p.courses.id, p.courses);
      });
      enrollments?.forEach((e: any) => {
        if (e.courses) allCourses.set(e.courses.id, e.courses);
      });
      const uniqueCourses = Array.from(allCourses.values());

      if (uniqueCourses.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // 4. Récupérer tous les modules de tous les cours en une seule requête
      const courseIds = uniqueCourses.map((c) => c.id);
      const { data: allModules } = await supabase
        .from("modules")
        .select("id, course_id")
        .in("course_id", courseIds);

      if (!allModules || allModules.length === 0) {
        setCourses(
          uniqueCourses.map((course) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            cover_image: course.cover_image,
            organization_slug: course.organizations?.slug || "",
            progress: 0,
            totalLessons: 0,
            completedLessons: 0,
          }))
        );
        setLoading(false);
        return;
      }

      // 5. Récupérer toutes les leçons de tous les modules en une seule requête
      const moduleIds = allModules.map((m) => m.id);
      const { data: allLessons } = await supabase
        .from("lessons")
        .select("id, module_id")
        .in("module_id", moduleIds);

      // 6. Récupérer la progression de l'utilisateur pour toutes les leçons en une seule requête
      const lessonIds = allLessons?.map((l) => l.id) || [];
      const { data: userProgress } = await supabase
        .from("user_progress")
        .select("lesson_id, is_completed")
        .eq("user_id", userId)
        .eq("is_completed", true)
        .in("lesson_id", lessonIds);

      // 7. Créer des maps pour des lookups rapides
      const modulesByCourse = new Map<string, string[]>();
      allModules.forEach((m) => {
        const modules = modulesByCourse.get(m.course_id) || [];
        modules.push(m.id);
        modulesByCourse.set(m.course_id, modules);
      });

      const lessonsByModule = new Map<string, string[]>();
      allLessons?.forEach((l) => {
        const lessons = lessonsByModule.get(l.module_id) || [];
        lessons.push(l.id);
        lessonsByModule.set(l.module_id, lessons);
      });

      const completedLessonIds = new Set(userProgress?.map((p) => p.lesson_id) || []);

      // 8. Calculer la progression pour chaque cours
      const coursesWithProgress: CourseWithProgress[] = uniqueCourses.map((course) => {
        const courseModules = modulesByCourse.get(course.id) || [];
        const courseLessonIds: string[] = [];
        courseModules.forEach((moduleId) => {
          const moduleLessons = lessonsByModule.get(moduleId) || [];
          courseLessonIds.push(...moduleLessons);
        });

        const totalLessons = courseLessonIds.length;
        const completedLessons = courseLessonIds.filter((id) => completedLessonIds.has(id)).length;
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          cover_image: course.cover_image,
          organization_slug: course.organizations?.slug || "",
          progress,
          totalLessons,
          completedLessons,
        };
      });

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <DashboardHeader
        title="Mes Formations"
        subtitle="Continuez votre apprentissage où vous l'avez laissé"
      />

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-slate-100 shadow-sm">
              <div className="h-48 bg-slate-100 rounded-t-3xl" />
              <CardHeader>
                <div className="h-6 bg-slate-100 rounded-xl w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded-xl w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="shadow-sm border-slate-100">
          <CardHeader className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-slate-600" />
            </div>
            <CardTitle className="text-foreground tracking-tight">Aucune formation</CardTitle>
            <CardDescription className="text-muted-foreground leading-relaxed">
              Vous n'avez pas encore de formations. Explorez notre catalogue pour commencer !
            </CardDescription>
            <Button
              variant="gradient"
              className="mt-6 shadow-lg"
              onClick={() => navigate("/")}
            >
              Découvrir les formations
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer border-slate-100 group"
              onClick={() => navigate(`/school/${course.organization_slug}/learn/${course.id}`)}
            >
              <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-50 rounded-t-3xl overflow-hidden">
                {course.cover_image ? (
                  <img
                    src={course.cover_image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-slate-600" />
                    </div>
                  </div>
                )}
                {course.progress === 100 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-br from-primary to-pink-500 text-white p-2 rounded-full shadow-lg">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1 text-foreground tracking-tight">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-muted-foreground leading-relaxed">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Progression</span>
                    <span className="font-bold text-primary">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {course.completedLessons} / {course.totalLessons} leçons terminées
                  </p>
                </div>
                <Button variant="gradient" className="w-full mt-4 shadow-lg" size="sm">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Continuer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
