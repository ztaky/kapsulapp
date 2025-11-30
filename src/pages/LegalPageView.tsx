import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const LEGAL_PAGE_TITLES: Record<string, string> = {
  mentions_legales: "Mentions Légales",
  politique_confidentialite: "Politique de Confidentialité",
  cgv: "Conditions Générales de Vente",
};

export default function LegalPageView() {
  const { landingSlug, type } = useParams();

  // Fetch landing page to get organization_id and theme
  const { data: landingPage, isLoading: landingLoading } = useQuery({
    queryKey: ['landing-page-for-legal', landingSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('organization_id, design_config, content')
        .eq('slug', landingSlug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!landingSlug,
  });

  // Fetch legal page content
  const { data: legalPage, isLoading: legalLoading } = useQuery({
    queryKey: ['legal-page', landingPage?.organization_id, type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('organization_id', landingPage!.organization_id)
        .eq('type', type as 'mentions_legales' | 'politique_confidentialite' | 'cgv')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!landingPage?.organization_id && !!type,
  });

  const isLoading = landingLoading || legalLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!legalPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page non trouvée</h1>
          <p className="text-muted-foreground mb-6">
            Cette page légale n'a pas encore été configurée.
          </p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  // Extract theme colors from landing page config
  const designConfig = landingPage?.design_config as Record<string, any> || {};
  const palette = designConfig.palette || {};
  const primaryColor = palette.primary || '#d97706';
  const bgColor = palette.bgLight || '#fef8f3';
  const textColor = palette.textDark || '#1a1a1a';

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: bgColor }}
    >
      {/* Header */}
      <header 
        className="py-4 px-6 border-b"
        style={{ borderColor: `${textColor}1a` }}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            style={{ color: textColor }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 
            className="text-3xl md:text-4xl font-bold mb-8"
            style={{ color: textColor }}
          >
            {legalPage.title || LEGAL_PAGE_TITLES[type as string] || 'Page légale'}
          </h1>
          
          <div 
            className="prose prose-lg max-w-none"
            style={{ color: textColor }}
          >
            {/* Render content with preserved whitespace and line breaks */}
            {legalPage.content.split('\n').map((paragraph: string, index: number) => (
              <p key={index} className="mb-4 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="py-6 px-6 border-t mt-auto"
        style={{ borderColor: `${textColor}1a` }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p 
            className="text-sm"
            style={{ color: textColor, opacity: 0.6 }}
          >
            © {new Date().getFullYear()} Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  );
}
