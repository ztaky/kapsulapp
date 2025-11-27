import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ExternalLink, Pencil, Trash2, Eye, Copy, Globe, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LandingPageWizard } from "@/components/landing/LandingPageWizard";
import { useUserOrganizations } from "@/hooks/useUserRole";

export default function LandingPages() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentOrg } = useUserOrganizations();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { data: landingPages, isLoading, refetch } = useQuery({
    queryKey: ["landing-pages", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase
        .from("landing_pages")
        .select(`
          *,
          courses (
            id,
            title,
            cover_image
          )
        `)
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrg?.id,
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("landing_pages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Page de vente supprimée");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const original = landingPages?.find(lp => lp.id === id);
      if (!original) return;

      const { error } = await supabase
        .from("landing_pages")
        .insert({
          organization_id: original.organization_id,
          course_id: original.course_id,
          name: `${original.name} (copie)`,
          slug: `${original.slug}-copy-${Date.now()}`,
          status: 'draft',
          design_config: original.design_config,
          content: original.content,
          trainer_info: original.trainer_info,
          target_audience: original.target_audience,
        });

      if (error) throw error;
      toast.success("Page de vente dupliquée");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la duplication");
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      
      const { error } = await supabase
        .from("landing_pages")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(
        newStatus === "published" 
          ? "Page de vente publiée" 
          : "Page de vente dépubliée"
      );
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-8 shadow-premium">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
              Pages de vente
            </h1>
            <p className="text-muted-foreground text-lg">
              Créez des pages de vente professionnelles générées par IA
            </p>
          </div>
          <Button
            onClick={() => setIsWizardOpen(true)}
            size="lg"
            className="shadow-premium"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nouvelle page de vente
          </Button>
        </div>
      </div>

      {/* Landing Pages Grid */}
      {landingPages && landingPages.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {landingPages.map((lp) => (
            <Card
              key={lp.id}
              className="shadow-premium hover:shadow-elevated transition-all group overflow-hidden"
            >
              {/* Preview Image */}
              <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                {lp.courses?.cover_image ? (
                  <img
                    src={lp.courses.cover_image}
                    alt={lp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Eye className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={lp.status === "published" ? "default" : "secondary"}
                  >
                    {lp.status === "published" ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{lp.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {lp.courses?.title}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vues:</span>{" "}
                    <span className="font-semibold">{lp.views_count}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conversions:</span>{" "}
                    <span className="font-semibold">{lp.conversions_count}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/school/${slug}/studio/landing-pages/${lp.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Éditer
                  </Button>
                  <Button
                    variant={lp.status === "published" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleTogglePublish(lp.id, lp.status)}
                  >
                    {lp.status === "published" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/lp/${lp.slug}`, "_blank")}
                    disabled={lp.status !== "published"}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(lp.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(lp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center shadow-premium">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Plus className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Aucune page de vente</h3>
            <p className="text-muted-foreground">
              Créez votre première page de vente générée par IA avec un copywriting professionnel
            </p>
            <Button onClick={() => setIsWizardOpen(true)} size="lg">
              Créer ma première page de vente
            </Button>
          </div>
        </Card>
      )}

      {/* Wizard Modal */}
      <LandingPageWizard
        open={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          setIsWizardOpen(false);
          refetch();
        }}
      />
    </div>
  );
}