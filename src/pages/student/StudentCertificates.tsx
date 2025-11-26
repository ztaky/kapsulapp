import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Certificate {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  completedAt: string;
}

const StudentCertificates = () => {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: purchases } = await supabase
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
        .eq("user_id", user.id);

      if (purchases) {
        const completedCourses = await Promise.all(
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

            const { data: completedLessons } = await supabase
              .from("user_progress")
              .select("completed_at")
              .eq("user_id", user.id)
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
              )
              .order("completed_at", { ascending: false });

            if (completedLessons && completedLessons.length === totalLessons && totalLessons > 0) {
              return {
                ...course,
                completedAt: completedLessons[0].completed_at,
              };
            }
            return null;
          })
        );

        setCertificates(completedCourses.filter(Boolean) as Certificate[]);
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Mes Certificats
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Vos certificats de formation complétée
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card className="shadow-premium border-slate-100">
          <CardHeader className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-slate-900 tracking-tight">Aucun certificat</CardTitle>
            <CardDescription className="text-slate-600 leading-relaxed">
              Complétez vos formations pour obtenir vos certificats
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="shadow-premium hover:shadow-elevated transition-all border-slate-100 overflow-hidden">
              <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-50">
                {certificate.cover_image ? (
                  <img
                    src={certificate.cover_image}
                    alt={certificate.title}
                    className="w-full h-full object-cover opacity-50"
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center shadow-lg">
                    <Award className="h-8 w-8 text-amber-600" />
                  </div>
                </div>
                <Badge className="absolute top-4 right-4 bg-white text-amber-700 shadow-md">
                  Complété
                </Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="text-slate-900 tracking-tight">{certificate.title}</CardTitle>
                <CardDescription className="text-slate-600">
                  Complété le {format(new Date(certificate.completedAt), "d MMMM yyyy", { locale: fr })}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Button variant="outline" className="w-full border-amber-200 hover:bg-amber-50 hover:text-amber-700">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le certificat
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCertificates;
