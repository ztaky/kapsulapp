import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CourseSalesPage() {
  const { slug, courseId } = useParams<{ slug: string; courseId: string }>();
  const navigate = useNavigate();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: course, isLoading } = useQuery({
    queryKey: ["course-sales", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          organizations(name, slug, brand_color, logo_url)
        `)
        .eq("id", courseId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: modules } = useQuery({
    queryKey: ["course-modules-preview", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select(`
          *,
          lessons(id, title, type)
        `)
        .eq("course_id", courseId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: hasPurchased } = useQuery({
    queryKey: ["has-purchased", courseId, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;

      const { data } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("course_id", courseId)
        .eq("status", "completed")
        .maybeSingle();

      return !!data;
    },
    enabled: !!session?.user?.id && !!courseId,
  });

  const handleBuyClick = () => {
    if (!course?.payment_link_url) {
      toast({
        title: "Paiement non configuré",
        description: "Ce cours n'a pas encore de lien de paiement configuré",
        variant: "destructive",
      });
      return;
    }

    // Si l'utilisateur n'est pas connecté, rediriger vers /auth
    if (!session?.user) {
      localStorage.setItem("redirect_after_auth", window.location.pathname);
      navigate("/auth");
      return;
    }

    // Construire l'URL avec client_reference_id
    const paymentUrl = new URL(course.payment_link_url);
    paymentUrl.searchParams.set("client_reference_id", session.user.id);
    paymentUrl.searchParams.set("prefilled_email", session.user.email || "");

    // Rediriger vers Stripe
    window.location.href = paymentUrl.toString();
  };

  const handleAccessCourse = () => {
    navigate(`/school/${slug}/learn/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-slate-600">Cours introuvable</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/30 to-orange-50/20">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {course.organizations?.logo_url && (
              <img
                src={course.organizations.logo_url}
                alt={course.organizations.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            )}
            <h2 className="text-xl font-bold text-slate-900">
              {course.organizations?.name}
            </h2>
          </div>
          {hasPurchased ? (
            <Button onClick={handleAccessCourse} variant="gradient">
              Accéder au cours
            </Button>
          ) : (
            <Button onClick={handleBuyClick} variant="gradient" size="lg">
              Acheter maintenant - {course.price}€
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {hasPurchased && (
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Vous avez accès à ce cours
              </div>
            )}
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-orange-900 bg-clip-text text-transparent tracking-tight leading-tight">
              {course.title}
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              {course.description}
            </p>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-slate-900">{course.price}€</div>
              {!hasPurchased && (
                <Button onClick={handleBuyClick} variant="gradient" size="lg" className="shadow-xl">
                  Acheter ce cours
                </Button>
              )}
              {hasPurchased && (
                <Button onClick={handleAccessCourse} variant="gradient" size="lg">
                  Commencer maintenant
                </Button>
              )}
            </div>
          </div>

          {course.cover_image && (
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={course.cover_image}
                alt={course.title}
                className="w-full h-[400px] object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* Programme */}
      {modules && modules.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Programme du cours</h2>
              <p className="text-lg text-slate-600">
                {modules.length} module{modules.length > 1 ? "s" : ""} •{" "}
                {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} leçon
                {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) > 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-4">
              {modules.map((module, idx) => (
                <Card key={module.id} className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-3">
                          {module.title}
                        </h3>
                        {module.lessons && module.lessons.length > 0 && (
                          <ul className="space-y-2">
                            {module.lessons.map((lesson: any) => (
                              <li
                                key={lesson.id}
                                className="flex items-center gap-2 text-slate-600"
                              >
                                {hasPurchased ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Lock className="h-4 w-4 text-slate-400" />
                                )}
                                <span>{lesson.title}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Final */}
      {!hasPurchased && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">
                Prêt à commencer votre apprentissage ?
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Rejoignez dès maintenant et accédez immédiatement à tout le contenu du cours
              </p>
              <Button onClick={handleBuyClick} variant="gradient" size="lg" className="shadow-xl">
                Acheter maintenant - {course.price}€
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
