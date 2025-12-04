import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Certificate {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  completedAt: string;
  organizationName: string;
}

const StudentCertificates = () => {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    setUserName(profile?.full_name || user.email || "Apprenant");

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
          organizations (name)
        )
      `)
      .eq("user_id", user.id)
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
          organizations (name)
        )
      `)
      .eq("user_id", user.id)
      .eq("is_active", true);

    // 3. Fusionner et dédupliquer
    const allCourses = new Map<string, any>();
    purchases?.forEach((p: any) => {
      if (p.courses) allCourses.set(p.courses.id, p.courses);
    });
    enrollments?.forEach((e: any) => {
      if (e.courses) allCourses.set(e.courses.id, e.courses);
    });
    const uniqueCourses = Array.from(allCourses.values());

    if (uniqueCourses.length === 0) {
      setCertificates([]);
      setLoading(false);
      return;
    }

    // 4. Récupérer tous les modules en une seule requête
    const courseIds = uniqueCourses.map((c) => c.id);
    const { data: allModules } = await supabase
      .from("modules")
      .select("id, course_id")
      .in("course_id", courseIds);

    if (!allModules || allModules.length === 0) {
      setCertificates([]);
      setLoading(false);
      return;
    }

    // 5. Récupérer toutes les leçons en une seule requête
    const moduleIds = allModules.map((m) => m.id);
    const { data: allLessons } = await supabase
      .from("lessons")
      .select("id, module_id")
      .in("module_id", moduleIds);

    if (!allLessons || allLessons.length === 0) {
      setCertificates([]);
      setLoading(false);
      return;
    }

    // 6. Récupérer la progression de l'utilisateur en une seule requête
    const lessonIds = allLessons.map((l) => l.id);
    const { data: userProgress } = await supabase
      .from("user_progress")
      .select("lesson_id, is_completed, completed_at")
      .eq("user_id", user.id)
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
    allLessons.forEach((l) => {
      const lessons = lessonsByModule.get(l.module_id) || [];
      lessons.push(l.id);
      lessonsByModule.set(l.module_id, lessons);
    });

    const progressByLesson = new Map<string, string>();
    userProgress?.forEach((p) => {
      if (p.completed_at) {
        progressByLesson.set(p.lesson_id, p.completed_at);
      }
    });

    // 8. Identifier les cours complétés
    const completedCertificates: Certificate[] = [];

    uniqueCourses.forEach((course) => {
      const courseModules = modulesByCourse.get(course.id) || [];
      const courseLessonIds: string[] = [];
      courseModules.forEach((moduleId) => {
        const moduleLessons = lessonsByModule.get(moduleId) || [];
        courseLessonIds.push(...moduleLessons);
      });

      if (courseLessonIds.length === 0) return;

      const completedLessonIds = courseLessonIds.filter((id) => progressByLesson.has(id));

      if (completedLessonIds.length === courseLessonIds.length) {
        // Find the latest completion date
        const completionDates = completedLessonIds
          .map((id) => progressByLesson.get(id))
          .filter(Boolean) as string[];
        const latestCompletion = completionDates.sort().pop() || new Date().toISOString();

        completedCertificates.push({
          id: course.id,
          title: course.title,
          description: course.description,
          cover_image: course.cover_image,
          completedAt: latestCompletion,
          organizationName: course.organizations?.name || "Formation",
        });
      }
    });

    setCertificates(completedCertificates);
    setLoading(false);
  };

  const downloadCertificate = (certificate: Certificate) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background gradient effect (using rectangles)
    doc.setFillColor(255, 251, 235); // amber-50
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Border
    doc.setDrawColor(217, 119, 6); // amber-600
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Inner border
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("CERTIFICAT DE RÉUSSITE", pageWidth / 2, 50, { align: "center" });

    // Decorative line
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 50, 58, pageWidth / 2 + 50, 58);

    // "This certifies that" text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Ce certificat atteste que", pageWidth / 2, 75, { align: "center" });

    // Student name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(30, 41, 59);
    doc.text(userName, pageWidth / 2, 92, { align: "center" });

    // "has successfully completed" text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text("a complété avec succès la formation", pageWidth / 2, 108, { align: "center" });

    // Course title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(217, 119, 6); // amber-600
    const splitTitle = doc.splitTextToSize(certificate.title, pageWidth - 60);
    doc.text(splitTitle, pageWidth / 2, 125, { align: "center" });

    // Organization
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Délivrée par ${certificate.organizationName}`, pageWidth / 2, 145, { align: "center" });

    // Date
    const completionDate = format(new Date(certificate.completedAt), "d MMMM yyyy", { locale: fr });
    doc.setFontSize(12);
    doc.text(`Le ${completionDate}`, pageWidth / 2, 160, { align: "center" });

    // Award icon placeholder (simple circle with star)
    doc.setFillColor(217, 119, 6);
    doc.circle(pageWidth / 2, 180, 8, "F");
    doc.setFillColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("★", pageWidth / 2, 183, { align: "center" });

    // Save the PDF
    const fileName = `certificat-${certificate.title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    doc.save(fileName);
    toast.success("Certificat téléchargé avec succès !");
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
                <Button
                  variant="outline"
                  className="w-full border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                  onClick={() => downloadCertificate(certificate)}
                >
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
