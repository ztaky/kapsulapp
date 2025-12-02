import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Lock, XCircle, Play, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

export default function CourseSalesPage() {
  const { slug, courseId } = useParams();
  const navigate = useNavigate();
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [cgvAccepted, setCgvAccepted] = useState(false);

  // Handle sticky bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch user session
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      // Fetch course without org join (RLS allows public view of published courses)
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch organization using secure function (returns only safe fields)
      let organization = null;
      if (courseData?.organization_id) {
        const { data: orgData } = await supabase
          .rpc("get_public_organization_by_id", { org_id: courseData.organization_id });
        organization = orgData?.[0] || null;
      }

      return { ...courseData, organizations: organization };
    },
  });

  // Fetch modules and lessons
  const { data: modules } = useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select(`
          *,
          lessons (*)
        `)
        .eq("course_id", courseId)
        .order("position", { ascending: true })
        .order("position", { referencedTable: "lessons", ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Check if user has purchased
  const { data: hasPurchased } = useQuery({
    queryKey: ["purchase-check", session?.user?.id, courseId],
    queryFn: async () => {
      if (!session?.user?.id) return false;

      const { data } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("course_id", courseId)
        .single();

      return !!data;
    },
    enabled: !!session?.user?.id && !!courseId,
  });

  const handleBuyClick = () => {
    if (!cgvAccepted) {
      toast.error("Veuillez accepter les CGV pour continuer");
      return;
    }

    if (!course?.payment_link_url) {
      toast.error("Lien de paiement non configuré");
      return;
    }

    if (!session) {
      localStorage.setItem("redirectAfterAuth", window.location.pathname);
      navigate("/auth");
      return;
    }

    const paymentUrl = new URL(course.payment_link_url);
    paymentUrl.searchParams.set("client_reference_id", session.user.id);
    paymentUrl.searchParams.set("prefilled_email", session.user.email || "");

    window.location.href = paymentUrl.toString();
  };

  const handleAccessCourse = () => {
    navigate(`/school/${slug}/course/${courseId}/learn`);
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Cours introuvable</h1>
      </div>
    );
  }

  const marketing = (course.marketing_content as any) || {};
  const organization = course.organizations;

  return (
    <div className="min-h-screen bg-cream font-jakarta">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {organization?.logo_url && (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <span className="font-bold text-slate-900">{organization?.name}</span>
            </div>
            {hasPurchased ? (
              <Button onClick={handleAccessCourse} variant="default">
                Accéder au cours
              </Button>
            ) : (
              <Button onClick={handleBuyClick} className="bg-gradient-to-r from-orange-600 to-pink-600 hover:opacity-90">
                Acheter - {course.price}€
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-cream py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight font-jakarta">
                {marketing.headline || course.title}
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
                {marketing.subheadline || course.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!hasPurchased ? (
                  <Button
                    size="lg"
                    onClick={handleBuyClick}
                    className="text-lg px-8 py-6 rounded-full bg-gradient-to-r from-orange-600 to-pink-600 hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
                  >
                    Commencer maintenant
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button size="lg" onClick={handleAccessCourse} className="text-lg px-8 py-6 rounded-full">
                    Accéder au cours
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="text-3xl font-bold text-orange-600">{course.price}€</span>
                </div>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              {marketing.video_url ? (
                <div className="relative aspect-video bg-slate-900">
                  <iframe
                    src={marketing.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : course.cover_image ? (
                <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                  <Play className="h-20 w-20 text-orange-600" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      {marketing.pain_points && marketing.pain_points.length > 0 && (
        <section className="bg-slate-900 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-white text-center mb-12 font-jakarta">
              Vous rencontrez ces difficultés ?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketing.pain_points.map((pain: string, index: number) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all"
                >
                  <XCircle className="h-8 w-8 text-red-400 mb-4" />
                  <p className="text-white text-lg">{pain}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      {marketing.benefits && marketing.benefits.length > 0 && (
        <section className="bg-cream py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 text-center mb-12 font-jakarta">
              Ce que vous allez obtenir
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {marketing.benefits.map((benefit: any, index: number) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-8 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all"
                >
                  <div className="text-4xl mb-4">{benefit.icon || "✨"}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Program Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 text-center mb-12 font-jakarta">
            Programme de la formation
          </h2>
          <div className="space-y-8">
            {modules?.map((module: any, moduleIndex: number) => (
              <div key={module.id} className="bg-cream rounded-3xl p-8 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                      {moduleIndex + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{module.title}</h3>
                    <div className="space-y-3">
                      {module.lessons?.map((lesson: any) => (
                        <div key={lesson.id} className="flex items-center gap-3 text-slate-600">
                          {hasPurchased ? (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Lock className="h-5 w-5 text-slate-400 flex-shrink-0" />
                          )}
                          <span>{lesson.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Author Bio Section */}
      {marketing.author_bio && (
        <section className="bg-slate-800 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-white text-center mb-12 font-jakarta">
              Votre formateur
            </h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-12">
              <p className="text-white text-lg leading-relaxed whitespace-pre-line">
                {marketing.author_bio}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {marketing.faq && marketing.faq.length > 0 && (
        <section className="bg-white py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 text-center mb-12 font-jakarta">
              Questions fréquentes
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {marketing.faq.map((item: any, index: number) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-cream rounded-3xl px-6 border-none"
                >
                  <AccordionTrigger className="text-lg font-semibold text-slate-900 hover:no-underline py-6">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 pb-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      {!hasPurchased && (
        <section className="bg-gradient-to-r from-orange-100 to-pink-100 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6 font-jakarta">
              Prêt à commencer ?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Rejoignez la formation dès aujourd'hui et transformez vos compétences
            </p>
            
            {/* CGV Checkbox */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Checkbox 
                id="cgv-accept-final" 
                checked={cgvAccepted} 
                onCheckedChange={(checked) => setCgvAccepted(checked === true)}
                className="border-slate-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
              />
              <label htmlFor="cgv-accept-final" className="text-sm text-slate-600 cursor-pointer text-left">
                J'accepte les{" "}
                <Link to="/cgv" className="text-orange-600 hover:underline" target="_blank">
                  CGV
                </Link>{" "}
                et la{" "}
                <Link to="/confidentialite" className="text-orange-600 hover:underline" target="_blank">
                  Politique de Confidentialité
                </Link>
              </label>
            </div>

            <Button
              size="lg"
              onClick={handleBuyClick}
              disabled={!cgvAccepted}
              className="text-xl px-12 py-8 rounded-full bg-gradient-to-r from-orange-600 to-pink-600 hover:opacity-90 shadow-2xl hover:shadow-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Acheter maintenant - {course.price}€
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </section>
      )}

      {/* Sticky Mobile Bar */}
      {showStickyBar && !hasPurchased && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-2xl lg:hidden">
          {!cgvAccepted && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <Checkbox 
                id="cgv-accept-mobile" 
                checked={cgvAccepted} 
                onCheckedChange={(checked) => setCgvAccepted(checked === true)}
                className="border-slate-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
              />
              <label htmlFor="cgv-accept-mobile" className="text-xs text-slate-600 cursor-pointer">
                J'accepte les <Link to="/cgv" className="text-orange-600 underline" target="_blank">CGV</Link>
              </label>
            </div>
          )}
          <Button
            onClick={handleBuyClick}
            disabled={!cgvAccepted}
            className="w-full text-lg py-6 rounded-full bg-gradient-to-r from-orange-600 to-pink-600 hover:opacity-90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Acheter maintenant - {course.price}€
          </Button>
        </div>
      )}
    </div>
  );
}
