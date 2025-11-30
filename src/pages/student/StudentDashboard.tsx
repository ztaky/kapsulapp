import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DashboardHeader } from "@/components/shared/DashboardHeader";

interface Course {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  organization_slug: string;
}

interface CourseWithProgress extends Course {
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        fetchUserCourses(session.user.id);
      }
    });
  }, []);

  const fetchUserCourses = async (userId: string) => {
    setLoading(true);

    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select(`
        course_id,
        courses (
          id,
          title,
          description,
          cover_image,
          organization_id,
          organizations (
            slug
          )
        )
      `)
      .eq("user_id", userId);

    if (purchasesError) {
      console.error(purchasesError);
      setLoading(false);
      return;
    }

    const coursesWithProgress = await Promise.all(
      purchases.map(async (purchase: any) => {
        const course = purchase.courses;

        const { count: totalLessons } = await supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .in(
            "module_id",
            await supabase
              .from("modules")
              .select("id")
              .eq("course_id", course.id)
              .then((res) => res.data?.map((m) => m.id) || [])
          );

        const { count: completedLessons } = await supabase
          .from("user_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_completed", true)
          .in(
            "lesson_id",
            await supabase
              .from("lessons")
              .select("id")
              .in(
                "module_id",
                await supabase
                  .from("modules")
                  .select("id")
                  .eq("course_id", course.id)
                  .then((res) => res.data?.map((m) => m.id) || [])
              )
              .then((res) => res.data?.map((l) => l.id) || [])
          );

        const progress = totalLessons ? Math.round(((completedLessons || 0) / totalLessons) * 100) : 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          cover_image: course.cover_image,
          organization_slug: course.organizations?.slug || '',
          progress,
          totalLessons: totalLessons || 0,
          completedLessons: completedLessons || 0,
        };
      })
    );

    setCourses(coursesWithProgress);
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
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
