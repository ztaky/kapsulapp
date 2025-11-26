import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle, CheckCircle2 } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mes Formations</h1>
          <p className="text-muted-foreground">Continuez votre apprentissage où vous l'avez laissé</p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="shadow-card">
            <CardHeader className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <CardTitle>Aucune formation</CardTitle>
              <CardDescription>
                Vous n'avez pas encore de formations. Explorez notre catalogue pour commencer !
              </CardDescription>
              <Button 
                className="mt-6 bg-gradient-to-r from-primary to-[hsl(340,85%,55%)] hover:opacity-90"
                onClick={() => navigate("/")}
              >
                Découvrir les formations
              </Button>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => navigate(`/course/${course.id}`)}>
                <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
                  {course.cover_image ? (
                    <img
                      src={course.cover_image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  {course.progress === 100 && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-semibold text-primary">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {course.completedLessons} / {course.totalLessons} leçons terminées
                    </p>
                  </div>
                  <Button className="w-full mt-4 bg-primary hover:bg-primary/90" size="sm">
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
