import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const LEGAL_PAGE_TITLES: Record<string, string> = {
  mentions_legales: "Mentions Légales",
  politique_confidentialite: "Politique de Confidentialité",
  cgv: "Conditions Générales de Vente",
  cookies: "Politique de Cookies",
};

export default function SchoolLegalPage() {
  const { slug, type } = useParams();

  // Fetch organization by slug
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['public-organization-legal', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_public_organization', { org_slug: slug })
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch legal page content
  const { data: legalPage, isLoading: legalLoading } = useQuery({
    queryKey: ['school-legal-page', organization?.id, type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('organization_id', organization!.id)
        .eq('type', type as 'mentions_legales' | 'politique_confidentialite' | 'cgv' | 'cookies')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && !!type,
  });

  const isLoading = orgLoading || legalLoading;
  const brandColor = organization?.brand_color || '#d97706';

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
          <h1 className="text-2xl font-bold mb-4 text-foreground">Page non trouvée</h1>
          <p className="text-muted-foreground mb-6">
            Cette page légale n'a pas encore été configurée.
          </p>
          <Button asChild>
            <Link to={`/school/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'académie
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-4 px-6 border-b">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/school/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'académie
            </Link>
          </Button>
          {organization && (
            <span className="text-sm text-muted-foreground">
              {organization.name}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
            {legalPage.title || LEGAL_PAGE_TITLES[type as string] || 'Page légale'}
          </h1>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {legalPage.content.split('\n').map((paragraph: string, index: number) => (
              <p key={index} className="mb-4 whitespace-pre-wrap text-foreground/80">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t mt-auto">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {organization?.name || 'Tous droits réservés'}
          </p>
        </div>
      </footer>
    </div>
  );
}
