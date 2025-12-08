import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Star, Award, Clock, Quote } from "lucide-react";
import { generateDynamicPalette } from "@/lib/color-utils";
import { LandingPageTemplate } from "@/components/landing/templates/LandingPageTemplate";
import { LandingPageConfig } from "@/config/landingPageSchema";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";
import { TrackingScripts } from "@/components/shared/TrackingScripts";

export default function LandingPageView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [landingPage, setLandingPage] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchLandingPage();
      incrementViewCount();
    }
  }, [slug]);

  // Dynamically load Google Fonts based on design_config
  useEffect(() => {
    if (landingPage?.design_config?.fonts) {
      const fonts = landingPage.design_config.fonts;
      const fontsToLoad = new Set<string>();
      
      if (fonts.heading && fonts.heading !== 'system-ui') {
        fontsToLoad.add(fonts.heading);
      }
      if (fonts.body && fonts.body !== 'system-ui') {
        fontsToLoad.add(fonts.body);
      }
      
      fontsToLoad.forEach(fontName => {
        // Check if font already loaded
        const existingLink = document.querySelector(`link[href*="${fontName.replace(/\s+/g, '+')}"]`);
        if (!existingLink) {
          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      });
    }
  }, [landingPage?.design_config?.fonts]);

  const fetchLandingPage = async () => {
    try {
      // Check for preview mode (allows viewing unpublished pages in editor)
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      
      let query = supabase
        .from("landing_pages")
        .select(`
          *,
          courses (
            id,
            title,
            description,
            cover_image,
            price,
            installments_enabled,
            installments_count
          )
        `)
        .eq("slug", slug);
      
      // Only filter by published status if not in preview mode
      if (!isPreview) {
        query = query.eq("status", "published");
      }
      
      const { data, error } = await query.single();

      if (error) throw error;
      setLandingPage(data);

      // Fetch organization for tracking IDs
      if (data?.organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("facebook_pixel_id, gtm_container_id")
          .eq("id", data.organization_id)
          .single();
        
        if (orgData) {
          setOrganization(orgData);
        }
      }
    } catch (error) {
      console.error("Error fetching landing page:", error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    // Don't increment views in preview mode
    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
    if (isPreview) return;
    
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

  // Check if content uses the new LandingPageConfig format
  // Handle both flattened structure (new) and double-nested structure (legacy bug)
  const heroData = landingPage?.content?.hero || landingPage?.content?.content?.hero;
  const hasNewFormat = heroData !== undefined && 
                       typeof heroData?.headline === 'object';

  if (hasNewFormat) {
    // Determine content location: flattened (content.hero) vs double-nested (content.content.hero)
    const isFlattened = landingPage.content.hero !== undefined;
    const contentData = isFlattened 
      ? landingPage.content  // New flattened format
      : landingPage.content.content;  // Old double-nested format
    
    const themeData = isFlattened 
      ? landingPage.content.theme 
      : landingPage.content?.content?.theme;

    const config: LandingPageConfig = {
      theme: themeData || {
        colors: {
          primary: landingPage.design_config?.colors?.[0] || '#e11d48',
          primaryDark: landingPage.design_config?.colors?.[1] || '#9333ea',
          bgDark: '#0a0e27',
          bgLight: '#fef8f3',
          textDark: '#1a1a1a',
          textLight: '#ffffff',
          accentGreen: '#10b981',
          accentRed: '#ef4444',
        },
        fonts: {
          family: landingPage.design_config?.fonts?.heading || 'Inter',
          heading: '700',
          body: '400',
        }
      },
      content: contentData
    };
    
    // Pass trainer photo for backward compatibility
    const trainerPhoto = (landingPage.trainer_info as any)?.photo;
    
    // Get enabled sections from design_config
    const enabledSections = (landingPage.design_config as any)?.enabledSections;
    
    // Get installment settings from course
    const installmentsEnabled = landingPage.courses?.installments_enabled || false;
    const installmentsCount = landingPage.courses?.installments_count || 3;
    
    return (
      <>
        <TrackingScripts 
          gtmContainerId={organization?.gtm_container_id} 
          facebookPixelId={organization?.facebook_pixel_id} 
        />
        <CookieConsentBanner />
        <LandingPageTemplate 
          config={config} 
          trainerPhoto={trainerPhoto} 
          enabledSections={enabledSections} 
          landingSlug={slug}
          installmentsEnabled={installmentsEnabled}
          installmentsCount={installmentsCount}
          courseId={landingPage.course_id}
        />
      </>
    );
  }

  // Legacy format - keep old renderer for backwards compatibility
  const { design_config, content, trainer_info, courses } = landingPage;
  
  // Generate dynamic color palette with theme support
  const baseColors = design_config?.colors || ["#ea580c", "#f59e0b"];
  const theme = design_config?.theme || 'light';
  const palette = generateDynamicPalette(baseColors, theme);
  const ctaStyle = design_config?.ctaStyle || 'gradient';
  const headingFont = design_config?.fonts?.heading || "Inter";
  const bodyFont = design_config?.fonts?.body || "Inter";

  // CTA button style
  const ctaButtonStyle = ctaStyle === 'gradient'
    ? { background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }
    : { backgroundColor: palette.primary };

  return (
    <>
      <TrackingScripts 
        gtmContainerId={organization?.gtm_container_id} 
        facebookPixelId={organization?.facebook_pixel_id} 
      />
      <CookieConsentBanner />
      <div className="min-h-screen" style={{ fontFamily: bodyFont, backgroundColor: palette.background, color: palette.bodyText }}>
      
      {/* SECTION A: HERO - Fond clair épuré avec image optionnelle */}
      <section
        className="relative py-16 sm:py-20 lg:py-28 px-5 sm:px-8 lg:px-12 overflow-hidden"
        style={{ backgroundColor: palette.lightBg }}
      >
        {/* Hero background image if set */}
        {content?.hero?.hero_image && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${content.hero.hero_image})` }}
          />
        )}
        
        {/* Grid pattern overlay très subtil */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${palette.primary}, ${palette.primary} 1px, transparent 1px, transparent 60px),
                              repeating-linear-gradient(90deg, ${palette.primary}, ${palette.primary} 1px, transparent 1px, transparent 60px)`
          }}
        />
        
        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
          {content?.hero?.badge && (
            <Badge 
              className="text-sm px-5 py-2.5 font-semibold shadow-sm"
              style={{ 
                backgroundColor: palette.accentLight,
                color: palette.primary,
                border: `1px solid ${palette.primary}20`
              }}
            >
              {content.hero.badge}
            </Badge>
          )}
          
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight"
            style={{
              fontFamily: headingFont,
              color: palette.primary,
            }}
          >
            {content?.hero?.headline || courses?.title}
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed" style={{ color: palette.subtitleText }}>
            {content?.hero?.subheadline || courses?.description}
          </p>
          
          <div className="flex flex-col items-center gap-3 pt-4 sm:pt-6">
            <Button
              size="lg"
              className="text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all text-white font-bold"
              style={ctaButtonStyle}
            >
              {content?.hero?.cta_text || "S'inscrire maintenant"} - {courses?.price}€
            </Button>
            {content?.hero?.cta_subtext && (
              <p className="text-sm italic" style={{ color: palette.mutedText }}>
                ✓ {content.hero.cta_subtext}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* SECTION B: PROBLÈME - Fond sombre uni, cartes glass */}
      {content?.problem && (
        <section 
          className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12"
          style={{ backgroundColor: palette.darkBg }}
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 sm:mb-16 text-white"
              style={{ fontFamily: headingFont }}
            >
              {content.problem.title}
            </h2>
            
            {content.problem.agitation_text && (
              <p className="text-lg sm:text-xl text-gray-300 text-center mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
                {content.problem.agitation_text}
              </p>
            )}
            
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
              {/* Colonne gauche: Pain points avec cartes glass */}
              <div className="space-y-5">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6" style={{ fontFamily: headingFont }}>
                  Ce que vous vivez aujourd'hui...
                </h3>
                {content.problem.pain_points?.map((pain: string, index: number) => (
                  <div 
                    key={index} 
                    className="p-5 sm:p-6 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <XCircle className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 text-red-400 mt-1" />
                      <p className="text-white text-base sm:text-lg leading-relaxed">{pain}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Colonne droite: Risques avec cartes glass */}
              {content.problem.risks && content.problem.risks.length > 0 && (
                <div className="space-y-5">
                  <h3 className="text-xl sm:text-2xl font-bold mb-6" style={{ fontFamily: headingFont, color: palette.tertiary }}>
                    Le risque si vous ne faites rien...
                  </h3>
                  {content.problem.risks.map((risk: string, index: number) => (
                    <div 
                      key={index} 
                      className="p-5 sm:p-6 rounded-2xl backdrop-blur-sm border border-opacity-20 hover:scale-[1.02] transition-all"
                      style={{ 
                        backgroundColor: `${palette.tertiary}10`,
                        borderColor: palette.tertiary
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 mt-1" style={{ color: palette.tertiary }} />
                        <p className="text-base sm:text-lg leading-relaxed" style={{ color: palette.tertiary }}>
                          {risk}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SECTION C: MÉTHODE - 3 cartes épurées glass effect */}
      {content?.method && (
        <section 
          className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12"
          style={{ backgroundColor: palette.lightBg }}
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-6"
              style={{ fontFamily: headingFont, color: palette.primary }}
            >
              {content.method.title}
            </h2>
            
            {content.method.description && (
              <p className="text-lg sm:text-xl text-center mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed" style={{ color: palette.subtitleText }}>
                {content.method.description}
              </p>
            )}
            
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {content.method.pillars?.map((pillar: any, index: number) => (
                <Card 
                  key={index} 
                  className="relative backdrop-blur-sm bg-white/95 rounded-3xl shadow-lg border-0 p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Numéro en haut */}
                  <div 
                    className="absolute -top-4 left-6 sm:left-8 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-lg"
                    style={{ backgroundColor: palette.secondary }}
                  >
                    {pillar.number || index + 1}
                  </div>
                  
                  <div className="mt-6">
                    {/* Icon/Image for pillar */}
                    {pillar.icon_url ? (
                      <img 
                        src={pillar.icon_url} 
                        alt={pillar.title}
                        className="w-16 h-16 object-contain mb-5 sm:mb-6 rounded-lg"
                      />
                    ) : (
                      <CheckCircle2 className="h-9 w-9 sm:h-10 sm:w-10 mb-5 sm:mb-6" style={{ color: palette.primary }} />
                    )}
                    <h3 
                      className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4" 
                      style={{ fontFamily: headingFont, color: palette.primary }}
                    >
                      {pillar.title}
                    </h3>
                    <p className="leading-relaxed text-base sm:text-lg" style={{ color: palette.subtitleText }}>
                      {pillar.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION D: TRANSFORMATION - 2 cartes colorées épurées */}
      {content?.transformation && (
        <section className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 sm:mb-16"
              style={{ fontFamily: headingFont, color: palette.primary }}
            >
              {content.transformation.title}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* Carte gauche */}
              {content.transformation.left_card && (
                <Card 
                  className="rounded-3xl p-8 sm:p-10 border-0 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  style={{ backgroundColor: palette.primaryLight }}
                >
                  <h3 
                    className="font-bold text-2xl sm:text-3xl mb-5 sm:mb-6" 
                    style={{ fontFamily: headingFont, color: palette.primaryDark }}
                  >
                    {content.transformation.left_card.title}
                  </h3>
                  <p className="leading-relaxed text-base sm:text-lg" style={{ color: palette.subtitleText }}>
                    {content.transformation.left_card.description}
                  </p>
                </Card>
              )}
              
              {/* Carte droite */}
              {content.transformation.right_card && (
                <Card 
                  className="rounded-3xl p-8 sm:p-10 border-0 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  style={{ backgroundColor: palette.secondaryLight }}
                >
                  <h3 
                    className="font-bold text-2xl sm:text-3xl mb-5 sm:mb-6" 
                    style={{ fontFamily: headingFont, color: palette.secondaryDark }}
                  >
                    {content.transformation.right_card.title}
                  </h3>
                  <p className="leading-relaxed text-base sm:text-lg" style={{ color: palette.subtitleText }}>
                    {content.transformation.right_card.description}
                  </p>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SECTION E: PROGRAMME - Timeline épurée SANS border-l */}
      {content?.program?.modules && (
        <section 
          className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12"
          style={{ backgroundColor: palette.lightBg }}
        >
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-12 sm:mb-16 text-center"
              style={{ fontFamily: headingFont, color: palette.primary }}
            >
              {content.program.title || "Un programme court, dense et actionnable"}
            </h2>
            
            <div className="relative">
              {/* Ligne verticale fine */}
              <div 
                className="absolute left-5 sm:left-8 top-0 bottom-0 w-0.5 rounded-full hidden sm:block"
                style={{ backgroundColor: `${palette.primary}30` }}
              />
              
              <div className="space-y-6 sm:space-y-8">
                {content.program.modules.map((module: any, index: number) => (
                  <div key={index} className="relative pl-0 sm:pl-20">
                    {/* Cercle numéroté détaché */}
                    <div 
                      className="absolute left-0 sm:left-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg hidden sm:flex"
                      style={{ backgroundColor: palette.primary }}
                    >
                      {index + 1}
                    </div>
                    
                    {/* Carte SANS border-l-4, effet glass */}
                    <Card 
                      className="p-6 sm:p-8 rounded-3xl shadow-lg backdrop-blur-sm bg-white/95 border-0 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4 sm:hidden mb-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg flex-shrink-0"
                          style={{ backgroundColor: palette.primary }}
                        >
                          {index + 1}
                        </div>
                        <h3 
                          className="font-bold text-xl flex-1" 
                          style={{ fontFamily: headingFont, color: palette.primary }}
                        >
                          {module.title}
                        </h3>
                      </div>
                      
                      <h3 
                        className="font-bold text-xl sm:text-2xl mb-3 hidden sm:block" 
                        style={{ fontFamily: headingFont, color: palette.primary }}
                      >
                        {module.title}
                      </h3>
                      <p className="mb-4 leading-relaxed text-base sm:text-lg" style={{ color: palette.subtitleText }}>
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

      {/* SECTION F: EXPERT - Fond sombre moyen, épuré */}
      {(content?.trainer || trainer_info) && (
        <section 
          className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12"
          style={{ backgroundColor: palette.mediumDarkBg }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 sm:gap-12 items-center">
              {/* Image en premier sur mobile */}
              {trainer_info?.photo && (
                <div className="flex justify-center order-1 md:order-2">
                  <img
                    src={trainer_info.photo}
                    alt={trainer_info.name}
                    className="w-full max-w-md h-auto object-cover rounded-3xl shadow-2xl"
                  />
                </div>
              )}
              
              {/* Texte */}
              <div className="space-y-5 sm:space-y-6 order-2 md:order-1">
                {content?.trainer?.tagline && (
                  <Badge 
                    className="text-sm sm:text-base px-5 sm:px-6 py-2 font-semibold"
                    style={{ 
                      backgroundColor: palette.tertiary,
                      color: 'white'
                    }}
                  >
                    {content.trainer.tagline}
                  </Badge>
                )}
                
                <h2 
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
                  style={{ fontFamily: headingFont }}
                >
                  {content?.trainer?.title || trainer_info?.name}
                </h2>
                
                <p className="text-gray-300 text-lg sm:text-xl leading-relaxed">
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
                    className="border-l-4 pl-5 sm:pl-6 italic text-lg sm:text-xl mt-6 sm:mt-8"
                    style={{ 
                      borderColor: palette.tertiary,
                      color: palette.tertiary
                    }}
                  >
                    "{content.trainer.quote}"
                  </blockquote>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION G: TESTIMONIALS - Cartes glass avec bordure subtile */}
      {content?.testimonials && content.testimonials.length > 0 && (
        <section 
          className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12 bg-white"
        >
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 sm:mb-16"
              style={{ fontFamily: headingFont, color: palette.primary }}
            >
              Ce que disent nos étudiants
            </h2>
            
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {content.testimonials.map((testimonial: any, index: number) => (
                <Card 
                  key={index} 
                  className="rounded-3xl shadow-lg backdrop-blur-sm bg-white/95 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2"
                  style={{ borderColor: `${palette.primary}15` }}
                >
                  <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 px-6 sm:px-8">
                    {/* Icône guillemet décorative */}
                    <Quote className="h-8 w-8 mb-4 opacity-20" style={{ color: palette.primary }} />
                    
                    <div className="flex gap-1 mb-5 sm:mb-6">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className="h-4 w-4 sm:h-5 sm:w-5 fill-current" 
                          style={{ color: palette.tertiary }} 
                        />
                      ))}
                    </div>
                <p className="mb-5 sm:mb-6 italic text-base sm:text-lg leading-relaxed" style={{ color: palette.subtitleText }}>
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      {/* Avatar - image or fallback */}
                      {testimonial.avatar ? (
                        <img 
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: palette.primary }}
                        >
                          {testimonial.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-base sm:text-lg" style={{ color: palette.primary }}>
                          {testimonial.name}
                        </p>
                        <p className="text-xs sm:text-sm" style={{ color: palette.mutedText }}>{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION H: FAQ - Accordéons épurés */}
      {content?.faq && content.faq.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-12" style={{ backgroundColor: palette.lightBg }}>
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 sm:mb-16"
              style={{ fontFamily: headingFont, color: palette.primary }}
            >
              Questions fréquentes
            </h2>
            
            <Accordion type="single" collapsible className="space-y-4">
              {content.faq.map((item: any, index: number) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`} 
                  className="border-0 rounded-3xl px-5 sm:px-6 backdrop-blur-sm bg-white/95 shadow-md hover:shadow-lg transition-all"
                >
                  <AccordionTrigger 
                    className="text-left hover:no-underline py-5 sm:py-6 [&[data-state=open]>svg]:rotate-180"
                    style={{ color: palette.primary }}
                  >
                    <span className="font-bold text-base sm:text-lg pr-4" style={{ fontFamily: headingFont }}>
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 sm:pb-6 text-sm sm:text-base leading-relaxed" style={{ color: palette.subtitleText }}>
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* SECTION I: FINAL CTA - Gradient UNIQUEMENT ici */}
      <section
        className="py-20 sm:py-24 px-5 sm:px-8 lg:px-12"
        style={{
          background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          {content?.final_cta?.urgency_badge && (
            <Badge 
              className="text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 font-bold animate-pulse"
              style={{ 
                backgroundColor: palette.tertiary,
                color: 'white'
              }}
            >
              {content.final_cta.urgency_badge}
            </Badge>
          )}
          
          <h2
            className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white leading-tight"
            style={{ fontFamily: headingFont }}
          >
            {content?.final_cta?.title || "Ne restez pas sur le quai"}
          </h2>
          
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            {content?.final_cta?.subtitle || "Rejoignez la formation dès maintenant"}
          </p>

          <Button
            size="lg"
            className="text-lg sm:text-xl md:text-2xl px-12 sm:px-16 py-6 sm:py-8 rounded-full shadow-2xl hover:scale-105 transition-all font-bold mt-6 sm:mt-8"
            style={{
              backgroundColor: 'white',
              color: palette.primary
            }}
          >
            {content?.final_cta?.cta_text || "Je démarre la formation"} - {courses?.price}€
          </Button>

          {content?.final_cta?.guarantee && (
            <p className="text-white/90 font-medium max-w-md mx-auto pt-5 sm:pt-6 text-base sm:text-lg">
              ✓ {content.final_cta.guarantee}
            </p>
          )}
        </div>
      </section>
    </div>
    </>
  );
}
