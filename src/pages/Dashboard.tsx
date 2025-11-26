import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrganizations } from "@/hooks/useUserRole";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Course {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
}

interface CourseWithProgress extends Course {
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { organizations, loading: orgsLoading } = useUserOrganizations();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        fetchUserCourses(session.user.id);
      }
    });
  }, [navigate]);

  // Redirect coaches to their studio
  useEffect(() => {
    if (!orgsLoading && organizations.length > 0) {
      const coachOrg = organizations.find(org => org.userRole === 'coach');
      if (coachOrg) {
        navigate(`/school/${coachOrg.slug}/studio`);
      }
    }
  }, [organizations, orgsLoading, navigate]);

  const fetchUserCourses = async (userId: string) => {
    setLoading(true);

    // Fetch purchased courses
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select(`
        course_id,
        courses (
          id,
          title,
          description,
          cover_image
        )
      `)
      .eq("user_id", userId);

    if (purchasesError) {
      console.error(purchasesError);
      setLoading(false);
      return;
    }

    // Calculate progress for each course
    const coursesWithProgress = await Promise.all(
      purchases.map(async (purchase: any) => {
        const course = purchase.courses;

        // Get total lessons count
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

        // Get completed lessons count
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
          ...course,
          progress,
          totalLessons: totalLessons || 0,
          completedLessons: completedLessons || 0,
        };
      })
    );

    setCourses(coursesWithProgress);
    setLoading(false);
  };

  if (orgsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header - Premium Style */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium mb-8">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight mb-2">
              Mes Formations
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Continuez votre apprentissage où vous l'avez laissé
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-3xl" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded-xl w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded-xl w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="shadow-premium border-slate-100">
            <CardHeader className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-slate-900 tracking-tight">Aucune formation</CardTitle>
              <CardDescription className="text-slate-600 leading-relaxed">
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
              <Card key={course.id} className="shadow-premium hover:shadow-elevated transition-all hover:-translate-y-1 cursor-pointer border-slate-100 group" onClick={() => navigate(`/course/${course.id}`)}>
                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-50 rounded-t-3xl overflow-hidden">
                  {course.cover_image ? (
                    <img
                      src={course.cover_image}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  )}
                  {course.progress === 100 && (
                    <div className="absolute top-4 right-4 bg-gradient-to-br from-green-500 to-green-600 text-white p-2 rounded-full shadow-lg">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1 text-slate-900 tracking-tight">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-slate-600 leading-relaxed">{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">Progression</span>
                      <span className="font-bold text-orange-600">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <p className="text-xs text-slate-500 leading-relaxed">
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
      </main>
    </div>
  );
};

export default Dashboard;
