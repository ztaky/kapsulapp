import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CheckCircle2, AlertCircle, Star, Award } from "lucide-react";

export default function LandingPageView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [landingPage, setLandingPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchLandingPage();
      incrementViewCount();
    }
  }, [slug]);

  const fetchLandingPage = async () => {
    try {
      const { data, error } = await supabase
        .from("landing_pages")
        .select(`
          *,
          courses (
            id,
            title,
            description,
            cover_image,
            price
          )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      setLandingPage(data);
    } catch (error) {
      console.error("Error fetching landing page:", error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc("increment_landing_page_views", { page_slug: slug });
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Page non trouvée</h1>
          <p className="text-muted-foreground">
            Cette landing page n'existe pas ou n'est pas encore publiée.
          </p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const { design_config, content, trainer_info, courses } = landingPage;
  
  // Extract colors for easier use
  const primaryColor = design_config?.colors?.[0] || "#ea580c";
  const secondaryColor = design_config?.colors?.[1] || "#db2777";
  const tertiaryColor = design_config?.colors?.[2] || "#f59e0b";
  const headingFont = design_config?.fonts?.heading || "Inter";
  const bodyFont = design_config?.fonts?.body || "Inter";

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: bodyFont }}
    >
      {/* Hero Section */}
      <section
        className="relative py-20 px-4 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)`,
        }}
      >
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <h1
            className="text-5xl md:text-7xl font-bold leading-tight"
            style={{
              fontFamily: headingFont,
              color: primaryColor,
            }}
          >
            {content?.hero?.headline || courses?.title}
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto">
            {content?.hero?.subheadline || courses?.description}
          </p>
          <div className="flex flex-col items-center gap-3 pt-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-xl hover:scale-105 transition-transform"
              style={{
                backgroundColor: primaryColor,
                color: "white",
              }}
            >
              {content?.hero?.cta_text || "S'inscrire maintenant"} - {courses?.price}€
            </Button>
            {content?.hero?.cta_subtext && (
              <p className="text-sm text-muted-foreground italic">
                {content.hero.cta_subtext}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      {content?.problem && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              style={{ fontFamily: headingFont }}
            >
              {content.problem.title}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {content.problem.pain_points?.map((pain: string, index: number) => (
                <Card key={index} className="border-2" style={{ borderColor: `${secondaryColor}30` }}>
                  <CardContent className="pt-6">
                    <AlertCircle className="h-8 w-8 mb-4" style={{ color: secondaryColor }} />
                    <p className="text-foreground/90">{pain}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Solution Section */}
      {content?.solution && (
        <section
          className="py-16 px-4"
          style={{ background: `linear-gradient(to bottom, ${primaryColor}08, transparent)` }}
        >
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-6"
              style={{ fontFamily: headingFont, color: primaryColor }}
            >
              {content.solution.title}
            </h2>
            <p className="text-center text-lg text-foreground/80 mb-12 max-w-3xl mx-auto">
              {content.solution.description}
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              {content.solution.benefits?.map((benefit: any, index: number) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <CheckCircle2 className="h-10 w-10 mb-4" style={{ color: primaryColor }} />
                    <h3 className="font-bold text-xl mb-3" style={{ fontFamily: headingFont }}>
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Program Section */}
      {content?.program?.modules && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-bold mb-12 text-center"
              style={{ fontFamily: headingFont }}
            >
              {content.program.title || "Programme de la formation"}
            </h2>
            <div className="space-y-4">
              {content.program.modules.map((module: any, index: number) => (
                <Card
                  key={index}
                  className="border-l-4 hover:shadow-lg transition-shadow"
                  style={{ borderLeftColor: primaryColor }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Badge
                        className="text-lg px-4 py-2"
                        style={{
                          backgroundColor: primaryColor,
                          color: "white",
                        }}
                      >
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-2" style={{ fontFamily: headingFont }}>
                          {module.title}
                        </h3>
                        <p className="text-muted-foreground mb-2">{module.description}</p>
                        {module.lessons_count && (
                          <p className="text-sm font-medium" style={{ color: secondaryColor }}>
                            {module.lessons_count} leçons
                          </p>
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

      {/* Trainer Section */}
      {(content?.trainer || trainer_info) && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              style={{ fontFamily: headingFont }}
            >
              {content?.trainer?.title || "Votre formateur"}
            </h2>
            <Card className="overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {trainer_info?.photo && (
                    <img
                      src={trainer_info.photo}
                      alt={trainer_info.name}
                      className="w-48 h-48 rounded-full object-cover shadow-xl"
                      style={{ border: `4px solid ${primaryColor}` }}
                    />
                  )}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: headingFont }}>
                      {trainer_info?.name}
                    </h3>
                    <p className="text-foreground/80 mb-4 leading-relaxed">
                      {content?.trainer?.bio_highlight || trainer_info?.bio}
                    </p>
                    
                    {content?.trainer?.credentials && (
                      <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                        {content.trainer.credentials.map((cred: string, index: number) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            <Award className="h-3 w-3" style={{ color: tertiaryColor }} />
                            {cred}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {content?.trainer?.quote && (
                      <blockquote
                        className="border-l-4 pl-4 italic text-lg mt-4"
                        style={{ borderColor: secondaryColor }}
                      >
                        "{content.trainer.quote}"
                      </blockquote>
                    )}

                    {trainer_info?.socials && trainer_info.socials.length > 0 && (
                      <div className="flex gap-4 mt-4 justify-center md:justify-start">
                        {trainer_info.socials.map((social: any, index: number) => (
                          <a
                            key={index}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            style={{ color: primaryColor }}
                          >
                            {social.platform}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {content?.testimonials && content.testimonials.length > 0 && (
        <section
          className="py-16 px-4"
          style={{ background: `linear-gradient(to bottom, transparent, ${secondaryColor}05)` }}
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              style={{ fontFamily: headingFont }}
            >
              Ce que disent nos étudiants
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {content.testimonials.map((testimonial: any, index: number) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current" style={{ color: tertiaryColor }} />
                      ))}
                    </div>
                    <p className="text-foreground/90 mb-4 italic">"{testimonial.text}"</p>
                    <div>
                      <p className="font-bold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {content?.faq && content.faq.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              style={{ fontFamily: headingFont }}
            >
              Questions fréquentes
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {content.faq.map((item: any, index: number) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section
        className="py-20 px-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}15)`,
        }}
      >
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2
            className="text-4xl md:text-5xl font-bold"
            style={{
              fontFamily: headingFont,
              color: primaryColor,
            }}
          >
            {content?.final_cta?.title || "Prêt à commencer ?"}
          </h2>
          <p className="text-xl text-foreground/80">
            {content?.final_cta?.subtitle || "Rejoignez la formation dès maintenant"}
          </p>
          
          {content?.final_cta?.urgency && (
            <Badge
              className="text-base px-6 py-2"
              style={{
                backgroundColor: secondaryColor,
                color: "white",
              }}
            >
              {content.final_cta.urgency}
            </Badge>
          )}

          <Button
            size="lg"
            className="text-xl px-12 py-8 shadow-2xl hover:scale-105 transition-transform"
            style={{
              backgroundColor: primaryColor,
              color: "white",
            }}
          >
            {content?.final_cta?.cta_text || "S'inscrire maintenant"} - {courses?.price}€
          </Button>

          {content?.final_cta?.guarantee && (
            <p className="text-sm text-muted-foreground italic max-w-md mx-auto pt-4">
              ✓ {content.final_cta.guarantee}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
