import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Star, Award, Clock } from "lucide-react";
import { generateDynamicPalette } from "@/lib/color-utils";

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
  
  // Generate dynamic color palette
  const baseColors = design_config?.colors || ["#ea580c", "#db2777", "#f59e0b"];
  const palette = generateDynamicPalette(baseColors);
  const ctaStyle = design_config?.ctaStyle || 'gradient';
  const headingFont = design_config?.fonts?.heading || "Inter";
  const bodyFont = design_config?.fonts?.body || "Inter";

  // CTA button style
  const ctaButtonStyle = ctaStyle === 'gradient'
    ? { background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }
    : { backgroundColor: palette.primary };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: bodyFont }}>
      
      {/* SECTION A: HERO - Fond clair avec pattern */}
      <section
        className="relative py-24 px-4 overflow-hidden"
        style={{ backgroundColor: palette.lightBg }}
      >
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${palette.primary}, ${palette.primary} 1px, transparent 1px, transparent 60px),
                              repeating-linear-gradient(90deg, ${palette.primary}, ${palette.primary} 1px, transparent 1px, transparent 60px)`
          }}
        />
        
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          {content?.hero?.badge && (
            <Badge 
              className="text-sm px-4 py-2 font-semibold"
              style={{ 
                backgroundColor: palette.accentLight,
                color: palette.primary,
                border: `1px solid ${palette.primary}30`
              }}
            >
              {content.hero.badge}
            </Badge>
          )}
          
          <h1
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight"
            style={{
              fontFamily: headingFont,
              color: palette.primary,
            }}
          >
            {content?.hero?.headline || courses?.title}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            {content?.hero?.subheadline || courses?.description}
          </p>
          
          <div className="flex flex-col items-center gap-3 pt-6">
            <Button
              size="lg"
              className="text-xl px-12 py-7 rounded-full shadow-2xl hover:scale-105 transition-all text-white font-bold"
              style={ctaButtonStyle}
            >
              {content?.hero?.cta_text || "S'inscrire maintenant"} - {courses?.price}€
            </Button>
            {content?.hero?.cta_subtext && (
              <p className="text-sm text-gray-600 italic">
                ✓ {content.hero.cta_subtext}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* SECTION B: PROBLÈME - Fond sombre, contraste fort */}
      {content?.problem && (
        <section 
          className="py-20 px-4 w-full"
          style={{ backgroundColor: palette.darkBg }}
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold text-center mb-16 text-white"
              style={{ fontFamily: headingFont }}
            >
              {content.problem.title}
            </h2>
            
            {content.problem.agitation_text && (
              <p className="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto leading-relaxed">
                {content.problem.agitation_text}
              </p>
            )}
            
            <div className="grid md:grid-cols-2 gap-12">
              {/* Colonne gauche: Pain points avec croix rouges */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: headingFont }}>
                  Ce que vous vivez aujourd'hui...
                </h3>
                {content.problem.pain_points?.map((pain: string, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <XCircle className="h-6 w-6 flex-shrink-0 text-red-500 mt-1" />
                    <p className="text-white text-lg leading-relaxed">{pain}</p>
                  </div>
                ))}
              </div>
              
              {/* Colonne droite: Risques avec alertes */}
              {content.problem.risks && content.problem.risks.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold mb-6" style={{ fontFamily: headingFont, color: palette.tertiary }}>
                    Le risque si vous ne faites rien...
                  </h3>
                  {content.problem.risks.map((risk: string, index: number) => (
                    <div key={index} className="flex items-start gap-4">
                      <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: palette.tertiary }} />
                      <p className="text-lg leading-relaxed" style={{ color: palette.tertiary }}>
                        {risk}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SECTION C: MÉTHODE - 3 cartes premium */}
      {content?.method && (
        <section 
          className="py-20 px-4"
          style={{ backgroundColor: palette.lightBg }}
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold text-center mb-6"
              style={{ fontFamily: headingFont, color: palette.primary }}
            >
              {content.method.title}
            </h2>
            
            {content.method.description && (
              <p className="text-xl text-gray-700 text-center mb-16 max-w-3xl mx-auto leading-relaxed">
                {content.method.description}
              </p>
            )}
            
            <div className="grid md:grid-cols-3 gap-8">
              {content.method.pillars?.map((pillar: any, index: number) => (
                <Card 
                  key={index} 
                  className="relative bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow border-0"
                >
                  {/* Numéro violet en haut */}
                  <div 
                    className="absolute -top-4 left-8 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-lg"
                    style={{ backgroundColor: palette.secondary }}
                  >
                    {pillar.number || index + 1}
                  </div>
                  
                  <div className="mt-6">
                    <CheckCircle2 className="h-10 w-10 mb-6" style={{ color: palette.primary }} />
                    <h3 
                      className="font-bold text-2xl mb-4" 
                      style={{ fontFamily: headingFont, color: palette.primary }}
                    >
                      {pillar.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {pillar.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION D: TRANSFORMATION - 2 cartes colorées */}
      {content?.transformation && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              style={{ fontFamily: headingFont, color: palette.primary }}
            >
              {content.transformation.title}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Carte gauche - Orange clair */}
              {content.transformation.left_card && (
                <Card 
                  className="rounded-3xl p-10 border-0 shadow-xl hover:shadow-2xl transition-shadow"
                  style={{ backgroundColor: palette.primaryLight }}
                >
                  <h3 
                    className="font-bold text-3xl mb-6" 
                    style={{ fontFamily: headingFont, color: palette.primaryDark }}
                  >
                    {content.transformation.left_card.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {content.transformation.left_card.description}
                  </p>
                </Card>
              )}
              
              {/* Carte droite - Rose clair */}
              {content.transformation.right_card && (
                <Card 
                  className="rounded-3xl p-10 border-0 shadow-xl hover:shadow-2xl transition-shadow"
                  style={{ backgroundColor: palette.secondaryLight }}
                >
                  <h3 
                    className="font-bold text-3xl mb-6" 
                    style={{ fontFamily: headingFont, color: palette.secondaryDark }}
                  >
                    {content.transformation.right_card.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {content.transformation.right_card.description}
                  </p>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SECTION E: PROGRAMME - Timeline */}
      {content?.program?.modules && (
        <section 
          className="py-20 px-4"
          style={{ backgroundColor: palette.lightBg }}
        >
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold mb-16 text-center"
              style={{ fontFamily: headingFont, color: palette.primary }}
            >
              {content.program.title || "Un programme court, dense et actionnable"}
            </h2>
            
            <div className="relative">
              {/* Ligne verticale */}
              <div 
                className="absolute left-8 top-0 bottom-0 w-1 rounded-full"
                style={{ backgroundColor: `${palette.primary}40` }}
              />
              
              <div className="space-y-8">
                {content.program.modules.map((module: any, index: number) => (
                  <div key={index} className="relative pl-20">
                    {/* Cercle numéroté */}
                    <div 
                      className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg"
                      style={{ backgroundColor: palette.primary }}
                    >
                      {index + 1}
                    </div>
                    
                    <Card 
                      className="p-8 border-0 border-l-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow bg-white"
                      style={{ borderLeftColor: palette.primary }}
                    >
                      <h3 
                        className="font-bold text-2xl mb-3" 
                        style={{ fontFamily: headingFont, color: palette.primary }}
                      >
                        {module.title}
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed text-lg">
                        {module.description}
                      </p>
                      {module.lessons_count && (
                        <Badge 
                          className="gap-2"
                          style={{ 
                            backgroundColor: palette.accentLight,
                            color: palette.primary
                          }}
                        >
                          <Clock className="h-3 w-3" />
                          {module.lessons_count} leçons
                        </Badge>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION F: EXPERT - Fond sombre moyen */}
      {(content?.trainer || trainer_info) && (
        <section 
          className="py-20 px-4"
          style={{ backgroundColor: palette.mediumDarkBg }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Gauche: Texte */}
              <div className="space-y-6">
                {content?.trainer?.tagline && (
                  <Badge 
                    className="text-base px-6 py-2 font-semibold"
                    style={{ 
                      backgroundColor: palette.tertiary,
                      color: 'white'
                    }}
                  >
                    {content.trainer.tagline}
                  </Badge>
                )}
                
                <h2 
                  className="text-4xl md:text-5xl font-bold text-white"
                  style={{ fontFamily: headingFont }}
                >
                  {content?.trainer?.title || trainer_info?.name}
                </h2>
                
                <p className="text-gray-300 text-xl leading-relaxed">
                  {content?.trainer?.bio_highlight || trainer_info?.bio}
                </p>
                
                {content?.trainer?.credentials && (
                  <div className="flex flex-wrap gap-3 pt-4">
                    {content.trainer.credentials.map((cred: string, index: number) => (
                      <Badge 
                        key={index} 
                        className="gap-2 text-sm px-4 py-2"
                        style={{ 
                          backgroundColor: `${palette.tertiary}20`,
                          color: palette.tertiary,
                          border: `1px solid ${palette.tertiary}`
                        }}
                      >
                        <Award className="h-4 w-4" />
                        {cred}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {content?.trainer?.quote && (
                  <blockquote 
                    className="border-l-4 pl-6 italic text-xl mt-8"
                    style={{ 
                      borderColor: palette.tertiary,
                      color: palette.tertiary
                    }}
                  >
                    "{content.trainer.quote}"
                  </blockquote>
                )}
              </div>
              
              {/* Droite: Photo */}
              {trainer_info?.photo && (
                <div className="flex justify-center">
                  <img
                    src={trainer_info.photo}
                    alt={trainer_info.name}
                    className="w-96 h-96 object-cover rounded-3xl shadow-2xl"
                    style={{ border: `6px solid ${palette.primary}` }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SECTION G: TESTIMONIALS */}
      {content?.testimonials && content.testimonials.length > 0 && (
        <section 
          className="py-20 px-4"
          style={{ 
            background: `linear-gradient(180deg, ${palette.lightBg}, white)` 
          }}
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              style={{ fontFamily: headingFont, color: palette.primary }}
            >
              Ce que disent nos étudiants
            </h2>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {content.testimonials.map((testimonial: any, index: number) => (
                <Card key={index} className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-0 bg-white">
                  <CardContent className="pt-8 pb-8 px-8">
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className="h-5 w-5 fill-current" 
                          style={{ color: palette.tertiary }} 
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div>
                      <p className="font-bold text-lg" style={{ color: palette.primary }}>
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION H: FAQ */}
      {content?.faq && content.faq.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              style={{ fontFamily: headingFont, color: palette.primary }}
            >
              Questions fréquentes
            </h2>
            
            <Accordion type="single" collapsible className="space-y-4">
              {content.faq.map((item: any, index: number) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`} 
                  className="border-2 rounded-2xl px-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                  style={{ borderColor: `${palette.primary}20` }}
                >
                  <AccordionTrigger 
                    className="text-left hover:no-underline py-6"
                    style={{ color: palette.primary }}
                  >
                    <span className="font-bold text-lg" style={{ fontFamily: headingFont }}>
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-6 text-base leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* SECTION I: FINAL CTA - Gradient fort */}
      <section
        className="py-24 px-4"
        style={{
          background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {content?.final_cta?.urgency_badge && (
            <Badge 
              className="text-base px-6 py-3 font-bold animate-pulse"
              style={{ 
                backgroundColor: palette.tertiary,
                color: 'white'
              }}
            >
              {content.final_cta.urgency_badge}
            </Badge>
          )}
          
          <h2
            className="text-4xl md:text-6xl font-extrabold text-white leading-tight"
            style={{ fontFamily: headingFont }}
          >
            {content?.final_cta?.title || "Ne restez pas sur le quai"}
          </h2>
          
          <p className="text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            {content?.final_cta?.subtitle || "Rejoignez la formation dès maintenant"}
          </p>

          <Button
            size="lg"
            className="text-2xl px-16 py-8 rounded-full shadow-2xl hover:scale-105 transition-all font-bold mt-8"
            style={{
              backgroundColor: 'white',
              color: palette.primary
            }}
          >
            {content?.final_cta?.cta_text || "Je démarre la formation"} - {courses?.price}€
          </Button>

          {content?.final_cta?.guarantee && (
            <p className="text-white/80 italic max-w-md mx-auto pt-6 text-lg">
              ✓ {content.final_cta.guarantee}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
