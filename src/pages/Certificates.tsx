import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Download, Share2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CompletedCourse {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  completedAt: string;
  organizations?: {
    name: string;
  };
}

export default function Certificates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        fetchCompletedCourses(session.user.id);
      }
    });
  }, [navigate]);

  const fetchCompletedCourses = async (userId: string) => {
    // Get all user's purchases
    const { data: purchases } = await supabase
      .from("purchases")
      .select("course_id")
      .eq("user_id", userId);

    if (!purchases || purchases.length === 0) {
      setLoading(false);
      return;
    }

    const courseIds = purchases.map(p => p.course_id);

    // For each course, check if all lessons are completed
    const coursesData = await Promise.all(
      courseIds.map(async (courseId) => {
        const { data: course } = await supabase
          .from("courses")
          .select(`
            id,
            title,
            description,
            cover_image,
            organizations (name)
          `)
          .eq("id", courseId)
          .single();

        if (!course) return null;

        // Get all modules for this course
        const { data: modules } = await supabase
          .from("modules")
          .select("id")
          .eq("course_id", courseId);

        if (!modules || modules.length === 0) return null;

        // Get all lessons
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id")
          .in("module_id", modules.map(m => m.id));

        if (!lessons || lessons.length === 0) return null;

        // Check completion status
        const { data: progress } = await supabase
          .from("user_progress")
          .select("completed_at")
          .eq("user_id", userId)
          .eq("is_completed", true)
          .in("lesson_id", lessons.map(l => l.id));

        if (!progress || progress.length !== lessons.length) return null;

        // Find the last completion date
        const completedAt = progress
          .map(p => new Date(p.completed_at || ""))
          .sort((a, b) => b.getTime() - a.getTime())[0];

        return {
          ...course,
          completedAt: completedAt.toISOString()
        };
      })
    );

    const completed = coursesData.filter(Boolean) as CompletedCourse[];
    setCompletedCourses(completed);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Mes Certificats</h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Vos certificats de réussite
          </p>
        </div>

        {completedCourses.length === 0 ? (
          <Card className="shadow-premium border-slate-100">
            <CardHeader className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-slate-900 tracking-tight">Aucun certificat</CardTitle>
              <CardDescription className="text-slate-600 leading-relaxed">
                Terminez vos formations pour obtenir des certificats
              </CardDescription>
              <Button
                variant="gradient"
                className="mt-6 shadow-lg"
                onClick={() => navigate("/dashboard")}
              >
                Voir mes formations
              </Button>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {completedCourses.map((course) => (
              <Card key={course.id} className="shadow-premium border-slate-100 hover:shadow-elevated transition-all">
                <div className="relative h-48 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 rounded-t-3xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Award className="h-16 w-16 text-amber-600 mx-auto" />
                      <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                        Certificat de réussite
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-slate-900 tracking-tight">{course.title}</CardTitle>
                  <CardDescription className="text-slate-600">
                    {course.organizations?.name}
                  </CardDescription>
                  <p className="text-sm text-slate-500 pt-2">
                    Complété le {format(new Date(course.completedAt), "d MMMM yyyy", { locale: fr })}
                  </p>
                </CardHeader>

                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="gradient" className="flex-1 shadow-lg">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl border-slate-200">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}