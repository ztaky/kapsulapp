import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: design_config?.fonts?.body || "Inter",
        backgroundColor: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
      }}
    >
      {/* Hero Section */}
      <section
        className="relative py-20 px-4"
        style={{
          background: `linear-gradient(135deg, ${design_config?.colors?.[0] || "#d97706"}20, ${design_config?.colors?.[1] || "#f59e0b"}10)`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1
            className="text-5xl md:text-6xl font-bold"
            style={{
              fontFamily: design_config?.fonts?.heading || "Inter",
              color: design_config?.colors?.[0] || "#d97706",
            }}
          >
            {content?.hero?.title || courses?.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {content?.hero?.subtitle || courses?.description}
          </p>
          <Button
            size="lg"
            className="shadow-lg"
            style={{
              backgroundColor: design_config?.colors?.[0] || "#d97706",
            }}
          >
            S'inscrire maintenant - {courses?.price}€
          </Button>
        </div>
      </section>

      {/* Course Content Preview */}
      {content?.modules && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-3xl font-bold mb-8 text-center"
              style={{
                fontFamily: design_config?.fonts?.heading || "Inter",
              }}
            >
              {content?.modulesTitle || "Programme de la formation"}
            </h2>
            <div className="space-y-4">
              {content.modules.map((module: any, index: number) => (
                <div
                  key={index}
                  className="bg-background p-6 rounded-lg shadow-sm border"
                >
                  <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                  <p className="text-muted-foreground">{module.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trainer Section */}
      {trainer_info && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {trainer_info.photo && (
                <img
                  src={trainer_info.photo}
                  alt={trainer_info.name}
                  className="w-48 h-48 rounded-full object-cover shadow-lg"
                />
              )}
              <div className="flex-1 text-center md:text-left">
                <h2
                  className="text-3xl font-bold mb-4"
                  style={{
                    fontFamily: design_config?.fonts?.heading || "Inter",
                  }}
                >
                  Votre formateur : {trainer_info.name}
                </h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {trainer_info.bio}
                </p>
                {trainer_info.socials && trainer_info.socials.length > 0 && (
                  <div className="flex gap-4 mt-4 justify-center md:justify-start">
                    {trainer_info.socials.map((social: any, index: number) => (
                      <a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {social.platform}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section
        className="py-20 px-4"
        style={{
          background: `linear-gradient(135deg, ${design_config?.colors?.[0] || "#d97706"}10, ${design_config?.colors?.[1] || "#f59e0b"}05)`,
        }}
      >
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2
            className="text-4xl font-bold"
            style={{
              fontFamily: design_config?.fonts?.heading || "Inter",
            }}
          >
            {content?.cta?.title || "Prêt à commencer ?"}
          </h2>
          <p className="text-xl text-muted-foreground">
            {content?.cta?.subtitle || "Rejoignez la formation dès maintenant"}
          </p>
          <Button
            size="lg"
            className="shadow-lg"
            style={{
              backgroundColor: design_config?.colors?.[0] || "#d97706",
            }}
          >
            S'inscrire - {courses?.price}€
          </Button>
        </div>
      </section>
    </div>
  );
}
