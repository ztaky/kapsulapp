import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Save, FileText, Shield, Scale } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";

type LegalPageType = 'mentions_legales' | 'politique_confidentialite' | 'cgv';

interface FooterSectionEditorProps {
  content: any;
  organizationId?: string;
  onChange: (section: string, data: any) => void;
}

const LEGAL_PAGE_CONFIG: Record<LegalPageType, { label: string; icon: React.ComponentType<any>; placeholder: string }> = {
  mentions_legales: {
    label: "Mentions Légales",
    icon: FileText,
    placeholder: "Collez ici vos mentions légales (raison sociale, adresse, numéro SIRET, etc.)"
  },
  politique_confidentialite: {
    label: "Politique de Confidentialité",
    icon: Shield,
    placeholder: "Collez ici votre politique de confidentialité (collecte de données, cookies, RGPD, etc.)"
  },
  cgv: {
    label: "Conditions Générales de Vente",
    icon: Scale,
    placeholder: "Collez ici vos CGV (conditions de paiement, livraison, remboursement, etc.)"
  }
};

export function FooterSectionEditor({ content, organizationId, onChange }: FooterSectionEditorProps) {
  const queryClient = useQueryClient();
  const [legalContents, setLegalContents] = useState<Record<LegalPageType, { title: string; content: string }>>({
    mentions_legales: { title: 'Mentions Légales', content: '' },
    politique_confidentialite: { title: 'Politique de Confidentialité', content: '' },
    cgv: { title: 'Conditions Générales de Vente', content: '' }
  });
  const [hasLegalChanges, setHasLegalChanges] = useState(false);

  // Fetch existing legal pages
  const { data: existingLegalPages, isLoading: legalLoading } = useQuery({
    queryKey: ['legal-pages', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Initialize local state when data loads
  useEffect(() => {
    if (existingLegalPages) {
      const newContents = { ...legalContents };
      existingLegalPages.forEach((page) => {
        const pageType = page.type as LegalPageType;
        newContents[pageType] = {
          title: page.title,
          content: page.content
        };
      });
      setLegalContents(newContents);
    }
  }, [existingLegalPages]);

  // Save legal pages mutation
  const saveLegalMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');

      const upserts = Object.entries(legalContents).map(([type, data]) => ({
        organization_id: organizationId,
        type: type as LegalPageType,
        title: data.title,
        content: data.content,
      }));

      for (const upsert of upserts) {
        const { error } = await supabase
          .from('legal_pages')
          .upsert(upsert, { onConflict: 'organization_id,type' });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Pages légales sauvegardées !');
      setHasLegalChanges(false);
      queryClient.invalidateQueries({ queryKey: ['legal-pages', organizationId] });
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde des pages légales');
    },
  });

  const updateFooterField = (field: string, value: any) => {
    const currentFooterData = content.footer || {};
    onChange('footer', { ...currentFooterData, [field]: value });
  };

  const updateLegalContent = (type: LegalPageType, field: 'title' | 'content', value: string) => {
    setLegalContents(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
    setHasLegalChanges(true);
  };

  if (legalLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Footer Basic Info */}
      <div className="space-y-4">
        <h3 className="font-medium">Informations du pied de page</h3>
        
        <ImageUploader
          label="Logo (optionnel)"
          value={content?.footer?.logo || ""}
          onChange={(url) => updateFooterField('logo', url)}
          organizationId={organizationId}
          placeholder="Logo affiché dans le footer"
        />

        <div className="space-y-2">
          <Label>Copyright</Label>
          <Input
            value={content?.footer?.copyright || ""}
            onChange={(e) => updateFooterField('copyright', e.target.value)}
            placeholder={`© ${new Date().getFullYear()} Votre Académie. Tous droits réservés.`}
          />
        </div>
      </div>

      {/* Legal Pages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Pages légales</h3>
          {hasLegalChanges && (
            <Button 
              size="sm" 
              onClick={() => saveLegalMutation.mutate()}
              disabled={saveLegalMutation.isPending}
            >
              {saveLegalMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder les pages légales
            </Button>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground">
          Copiez-collez le contenu de vos documents légaux ci-dessous. Ces pages seront accessibles via le footer de votre landing page.
        </p>

        {(Object.entries(LEGAL_PAGE_CONFIG) as [LegalPageType, typeof LEGAL_PAGE_CONFIG[LegalPageType]][]).map(([type, config]) => {
          const Icon = config.icon;
          const hasContent = legalContents[type]?.content?.length > 0;
          
          return (
            <Card key={type} className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">{config.label}</Label>
                {hasContent && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Configuré
                  </span>
                )}
              </div>
              
              <Input
                value={legalContents[type]?.title || config.label}
                onChange={(e) => updateLegalContent(type, 'title', e.target.value)}
                placeholder={`Titre de la page`}
              />
              
              <Textarea
                value={legalContents[type]?.content || ""}
                onChange={(e) => updateLegalContent(type, 'content', e.target.value)}
                placeholder={config.placeholder}
                rows={8}
                className="font-mono text-sm"
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
