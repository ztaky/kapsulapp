import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudioContext } from "@/hooks/useStudioContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  FileText, 
  Shield, 
  Scale, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy
} from "lucide-react";

type LegalPageType = 'mentions_legales' | 'politique_confidentialite' | 'cgv';

interface LegalPageData {
  title: string;
  content: string;
}

const LEGAL_PAGE_CONFIG: Record<LegalPageType, { 
  label: string; 
  icon: React.ComponentType<any>; 
  description: string;
  placeholder: string;
  requiredFields: string[];
}> = {
  mentions_legales: {
    label: "Mentions Légales",
    icon: FileText,
    description: "Informations obligatoires sur votre entreprise (raison sociale, adresse, SIRET, etc.)",
    placeholder: `Exemple de structure :

ÉDITEUR DU SITE
Nom de l'entreprise : [Votre entreprise]
Forme juridique : [SARL, SAS, Auto-entrepreneur, etc.]
Capital social : [Montant] €
Siège social : [Adresse complète]
SIRET : [Numéro SIRET]
RCS : [Ville d'immatriculation]
Numéro TVA intracommunautaire : [Numéro]

DIRECTEUR DE LA PUBLICATION
[Nom et prénom]

HÉBERGEUR
[Nom de l'hébergeur]
[Adresse de l'hébergeur]

PROPRIÉTÉ INTELLECTUELLE
L'ensemble du contenu de ce site (textes, images, vidéos) est protégé par le droit d'auteur.`,
    requiredFields: ["Raison sociale", "Adresse", "SIRET", "Hébergeur"]
  },
  politique_confidentialite: {
    label: "Politique de Confidentialité",
    icon: Shield,
    description: "Informations sur la collecte et le traitement des données personnelles (RGPD)",
    placeholder: `Exemple de structure :

COLLECTE DES DONNÉES PERSONNELLES
Nous collectons les données suivantes :
- Nom et prénom
- Adresse email
- [Autres données]

UTILISATION DES DONNÉES
Vos données sont utilisées pour :
- La création et gestion de votre compte
- L'accès à vos formations
- L'envoi de communications relatives à votre formation

COOKIES
Ce site utilise des cookies pour améliorer votre expérience.

VOS DROITS
Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.

CONTACT
Pour exercer vos droits : [email de contact]`,
    requiredFields: ["Types de données collectées", "Finalité", "Droits des utilisateurs", "Contact"]
  },
  cgv: {
    label: "Conditions Générales de Vente",
    icon: Scale,
    description: "Conditions d'achat, de paiement et de remboursement de vos formations",
    placeholder: `Exemple de structure :

OBJET
Les présentes conditions générales de vente régissent les ventes de formations en ligne.

PRIX
Les prix sont indiqués en euros TTC. [Précisez si TVA applicable ou non]

MODALITÉS DE PAIEMENT
Le paiement s'effectue par carte bancaire via notre plateforme sécurisée.

ACCÈS À LA FORMATION
L'accès à la formation est accordé dès réception du paiement pour une durée de [durée].

DROIT DE RÉTRACTATION
Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contenus numériques.
[OU]
Vous disposez d'un délai de [X] jours pour demander un remboursement.

GARANTIE
[Votre politique de garantie/satisfaction]

LITIGES
En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.`,
    requiredFields: ["Prix et TVA", "Modalités de paiement", "Droit de rétractation", "Garantie"]
  }
};

export default function LegalPages() {
  const { organizationId, isLoading: orgLoading } = useStudioContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<LegalPageType>('mentions_legales');
  const [localData, setLocalData] = useState<Record<LegalPageType, LegalPageData>>({
    mentions_legales: { title: 'Mentions Légales', content: '' },
    politique_confidentialite: { title: 'Politique de Confidentialité', content: '' },
    cgv: { title: 'Conditions Générales de Vente', content: '' }
  });
  const [hasChanges, setHasChanges] = useState<Record<LegalPageType, boolean>>({
    mentions_legales: false,
    politique_confidentialite: false,
    cgv: false
  });

  // Fetch existing legal pages
  const { data: existingPages, isLoading } = useQuery({
    queryKey: ['legal-pages-studio', organizationId],
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

  // Initialize local data when fetched
  useEffect(() => {
    if (existingPages) {
      const newData = { ...localData };
      existingPages.forEach((page) => {
        const pageType = page.type as LegalPageType;
        newData[pageType] = {
          title: page.title,
          content: page.content
        };
      });
      setLocalData(newData);
    }
  }, [existingPages]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (type: LegalPageType) => {
      if (!organizationId) throw new Error('Organization required');

      const { error } = await supabase
        .from('legal_pages')
        .upsert({
          organization_id: organizationId,
          type,
          title: localData[type].title,
          content: localData[type].content,
        }, { onConflict: 'organization_id,type' });

      if (error) throw error;
    },
    onSuccess: (_, type) => {
      toast.success(`${LEGAL_PAGE_CONFIG[type].label} sauvegardées !`);
      setHasChanges(prev => ({ ...prev, [type]: false }));
      queryClient.invalidateQueries({ queryKey: ['legal-pages-studio', organizationId] });
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const updateField = (type: LegalPageType, field: 'title' | 'content', value: string) => {
    setLocalData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
    setHasChanges(prev => ({ ...prev, [type]: true }));
  };

  const getPageStatus = (type: LegalPageType): 'empty' | 'incomplete' | 'complete' => {
    const content = localData[type].content;
    if (!content || content.trim().length === 0) return 'empty';
    if (content.length < 200) return 'incomplete';
    return 'complete';
  };

  const copyPreviewLink = (type: LegalPageType) => {
    // Find any landing page for this organization to get a slug
    // For now, we'll just inform the user
    toast.info('Les liens sont générés automatiquement sur chaque landing page');
  };

  if (orgLoading || isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Pages Légales</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos documents légaux. Ils seront automatiquement liés à toutes vos landing pages.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(LEGAL_PAGE_CONFIG) as [LegalPageType, typeof LEGAL_PAGE_CONFIG[LegalPageType]][]).map(([type, config]) => {
          const status = getPageStatus(type);
          const Icon = config.icon;
          
          return (
            <Card 
              key={type}
              className={`cursor-pointer transition-all hover:shadow-md ${activeTab === type ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveTab(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      status === 'complete' ? 'bg-green-100' : 
                      status === 'incomplete' ? 'bg-amber-100' : 'bg-slate-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        status === 'complete' ? 'text-green-600' : 
                        status === 'incomplete' ? 'text-amber-600' : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {status === 'complete' ? 'Configuré' : 
                         status === 'incomplete' ? 'À compléter' : 'Non configuré'}
                      </p>
                    </div>
                  </div>
                  {status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : status === 'incomplete' ? (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Editor */}
      <Card>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LegalPageType)}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mentions_legales" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Mentions</span>
              </TabsTrigger>
              <TabsTrigger value="politique_confidentialite" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Confidentialité</span>
              </TabsTrigger>
              <TabsTrigger value="cgv" className="gap-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">CGV</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          {(Object.entries(LEGAL_PAGE_CONFIG) as [LegalPageType, typeof LEGAL_PAGE_CONFIG[LegalPageType]][]).map(([type, config]) => (
            <TabsContent key={type} value={type} className="m-0">
              <CardContent className="pt-6 space-y-6">
                {/* Description */}
                <div className="p-4 rounded-lg bg-slate-50 border">
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Éléments recommandés :</span>
                    {config.requiredFields.map((field, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label>Titre de la page</Label>
                  <Input
                    value={localData[type].title}
                    onChange={(e) => updateField(type, 'title', e.target.value)}
                    placeholder={config.label}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Contenu</Label>
                    <span className="text-xs text-muted-foreground">
                      {localData[type].content.length} caractères
                    </span>
                  </div>
                  <Textarea
                    value={localData[type].content}
                    onChange={(e) => updateField(type, 'content', e.target.value)}
                    placeholder={config.placeholder}
                    rows={16}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {hasChanges[type] ? (
                      <span className="text-amber-600">• Modifications non sauvegardées</span>
                    ) : (
                      <span className="text-green-600">✓ À jour</span>
                    )}
                  </p>
                  <Button 
                    onClick={() => saveMutation.mutate(type)}
                    disabled={saveMutation.isPending || !hasChanges[type]}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <ExternalLink className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Liens automatiques</p>
              <p className="text-sm text-blue-700 mt-1">
                Ces pages légales sont automatiquement accessibles depuis le pied de page de toutes vos landing pages. 
                Les visiteurs pourront y accéder via les liens "Mentions légales", "Politique de confidentialité" et "CGV".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
