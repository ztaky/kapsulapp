import { useParams, useSearchParams } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Save, Mail, Send, Eye, Webhook, Zap, CheckCircle2, CreditCard, AlertCircle, ExternalLink, Loader2, Unlink, BarChart3 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DomainRedirectionGuide } from "@/components/studio/DomainRedirectionGuide";

interface StripeConnectStatus {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  email?: string;
}

export default function StudioBranding() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { organizations, refetch: refetchOrgs } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);
  const queryClient = useQueryClient();
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [isDisconnectingStripe, setIsDisconnectingStripe] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoadingStripeStatus, setIsLoadingStripeStatus] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    specialty: "",
    description: "",
    logo_url: "",
    brand_color: "#d97706",
    contact_email: "",
    webhook_url: "",
    webhook_events: ["new_student", "new_purchase"] as string[],
    paypal_email: "",
    paypal_merchant_id: "",
    facebook_pixel_id: "",
    gtm_container_id: "",
    custom_domain: "",
  });

  // Check Stripe Connect status
  const checkStripeStatus = async () => {
    if (!currentOrg?.id) return;
    
    setIsLoadingStripeStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-status", {
        body: { organizationId: currentOrg.id },
      });

      if (error) throw error;
      setStripeStatus(data);
    } catch (error) {
      console.error("Error checking Stripe status:", error);
    } finally {
      setIsLoadingStripeStatus(false);
    }
  };

  useEffect(() => {
    if (currentOrg) {
      const org = currentOrg as any;
      setFormData({
        name: currentOrg.name,
        slug: currentOrg.slug,
        specialty: org.specialty || "",
        description: org.description || "",
        logo_url: currentOrg.logo_url || "",
        brand_color: currentOrg.brand_color || "#d97706",
        contact_email: org.contact_email || "",
        webhook_url: org.webhook_url || "",
        webhook_events: org.webhook_events || ["new_student", "new_purchase"],
        paypal_email: org.paypal_email || "",
        paypal_merchant_id: org.paypal_merchant_id || "",
        facebook_pixel_id: org.facebook_pixel_id || "",
        gtm_container_id: org.gtm_container_id || "",
        custom_domain: org.custom_domain || "",
      });
      
      // Check Stripe status when org loads
      checkStripeStatus();
    }
  }, [currentOrg?.id]);

  // Handle Stripe Connect callback
  useEffect(() => {
    const stripeConnected = searchParams.get("stripe_connected");
    const stripeRefresh = searchParams.get("stripe_refresh");

    if (stripeConnected === "true") {
      toast({ title: "Stripe connecté !", description: "Votre compte Stripe a été connecté avec succès." });
      checkStripeStatus();
      refetchOrgs();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (stripeRefresh === "true") {
      toast({ 
        title: "Session expirée", 
        description: "Veuillez reconnecter votre compte Stripe.",
        variant: "destructive" 
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const connectStripe = async () => {
    if (!currentOrg?.id) return;

    setIsConnectingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-link", {
        body: { organizationId: currentOrg.id },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le lien de connexion Stripe",
        variant: "destructive",
      });
    } finally {
      setIsConnectingStripe(false);
    }
  };

  const disconnectStripe = async () => {
    if (!currentOrg?.id) return;

    if (!confirm("Êtes-vous sûr de vouloir déconnecter votre compte Stripe ? Les paiements ne fonctionneront plus.")) {
      return;
    }

    setIsDisconnectingStripe(true);
    try {
      const { error } = await supabase.functions.invoke("stripe-connect-disconnect", {
        body: { organizationId: currentOrg.id },
      });

      if (error) throw error;

      setStripeStatus({ connected: false, accountId: null, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false });
      toast({ title: "Stripe déconnecté", description: "Votre compte Stripe a été déconnecté." });
      refetchOrgs();
    } catch (error) {
      console.error("Error disconnecting Stripe:", error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter Stripe",
        variant: "destructive",
      });
    } finally {
      setIsDisconnectingStripe(false);
    }
  };

  const updateOrgMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!currentOrg?.id) throw new Error("Organization not found");

      const { error } = await supabase
        .from("organizations")
        .update({
          name: data.name,
          specialty: data.specialty || null,
          description: data.description || null,
          logo_url: data.logo_url || null,
          brand_color: data.brand_color,
          contact_email: data.contact_email || null,
          webhook_url: data.webhook_url || null,
          webhook_events: data.webhook_events,
          paypal_merchant_id: data.paypal_merchant_id || null,
          facebook_pixel_id: data.facebook_pixel_id || null,
          gtm_container_id: data.gtm_container_id || null,
          custom_domain: data.custom_domain || null,
        } as any)
        .eq("id", currentOrg.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Paramètres sauvegardés" });
    },
  });

  const sendTestEmail = async () => {
    if (!currentOrg?.id) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast({ 
        title: "Erreur", 
        description: "Vous devez être connecté pour envoyer un email test",
        variant: "destructive" 
      });
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await supabase.functions.invoke("send-transactional-email", {
        body: {
          type: "welcome_purchase",
          organizationId: currentOrg.id,
          recipientEmail: user.email,
          recipientName: user.user_metadata?.full_name || "Coach",
          courseName: "Formation Test",
          courseUrl: `${window.location.origin}/school/${currentOrg.slug}/learning`,
        },
      });

      if (response.error) throw response.error;

      toast({ 
        title: "Email test envoyé !", 
        description: `Un email de bienvenue a été envoyé à ${user.email}` 
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible d'envoyer l'email test",
        variant: "destructive" 
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const testWebhook = async () => {
    if (!formData.webhook_url) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une URL de webhook",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWebhook(true);
    try {
      const response = await fetch(formData.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          event: "test",
          timestamp: new Date().toISOString(),
          data: {
            message: "Test webhook from Kapsul",
            academy_name: formData.name,
            academy_slug: formData.slug,
          },
        }),
      });

      toast({
        title: "Webhook envoyé !",
        description: "Vérifiez l'historique de votre Zap/Scénario pour confirmer la réception.",
      });
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le webhook test. Vérifiez l'URL.",
        variant: "destructive",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const toggleWebhookEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      webhook_events: prev.webhook_events.includes(event)
        ? prev.webhook_events.filter((e) => e !== event)
        : [...prev.webhook_events, event],
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight mb-2">
            Paramètres de l'académie
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Personnalisez l'apparence de votre académie et configurez vos intégrations
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Visual Identity Card */}
        <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#1e293b] tracking-tight">
              Identité visuelle
            </CardTitle>
            <CardDescription>
              Ces éléments seront utilisés sur vos pages et dans vos emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-900 font-medium text-sm">
                Nom de l'académie
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-slate-900 font-medium text-sm">
                Slug (URL)
              </Label>
              <Input 
                id="slug" 
                value={formData.slug} 
                disabled 
                className="rounded-xl border-slate-200 bg-slate-50"
              />
              <p className="text-xs text-slate-500 leading-relaxed">
                Le slug ne peut pas être modifié
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty" className="text-slate-900 font-medium text-sm">
                Spécialité / Niche
              </Label>
              <Input
                id="specialty"
                placeholder="Ex: Bien-être, Marketing digital, Développement personnel..."
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="rounded-xl border-slate-200"
              />
              <p className="text-xs text-slate-500 leading-relaxed">
                Aide l'IA à personnaliser ses suggestions selon votre domaine d'expertise
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-900 font-medium text-sm">
                Description de l'académie
              </Label>
              <textarea
                id="description"
                placeholder="Décrivez votre académie, votre mission et votre public cible..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[100px] rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url" className="text-slate-900 font-medium text-sm">
                Logo (URL)
              </Label>
              <Input
                id="logo_url"
                type="url"
                placeholder="https://..."
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="rounded-xl border-slate-200"
              />
              {formData.logo_url && (
                <div className="mt-2 p-4 bg-slate-50 rounded-xl">
                  <img 
                    src={formData.logo_url} 
                    alt="Logo preview" 
                    className="max-h-16 object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_color" className="text-slate-900 font-medium text-sm">
                Couleur de marque
              </Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="brand_color"
                  type="color"
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  className="w-20 h-12 rounded-xl border-slate-200 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  placeholder="#d97706"
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings Card */}
        <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-[#1e293b] tracking-tight">
                  Emails transactionnels
                </CardTitle>
                <CardDescription>
                  Configurez les emails envoyés à vos étudiants
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="text-slate-900 font-medium text-sm">
                Email de contact (Reply-To)
              </Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contact@votre-academie.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="rounded-xl border-slate-200"
              />
              <p className="text-xs text-slate-500 leading-relaxed">
                Les réponses de vos étudiants seront envoyées à cette adresse
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-xl border border-slate-100">
              <h4 className="font-semibold text-slate-900 text-sm mb-3">
                Emails automatiques envoyés :
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Email de bienvenue après achat
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Confirmation de paiement / Facture
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Aperçu des emails
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Envoyez-vous un email test pour voir le rendu final avec votre branding
              </p>
              <Button
                variant="outline"
                onClick={sendTestEmail}
                disabled={isSendingTest || !currentOrg?.id}
                className="rounded-xl"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSendingTest ? "Envoi en cours..." : "Envoyer un email test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Connect Card */}
        <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100">
                <CreditCard className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-bold text-[#1e293b] tracking-tight">
                    Stripe Connect
                  </CardTitle>
                  {stripeStatus?.connected && (
                    <Badge 
                      variant={stripeStatus.chargesEnabled ? "default" : "secondary"}
                      className={stripeStatus.chargesEnabled ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                    >
                      {stripeStatus.chargesEnabled ? "Actif" : "Configuration requise"}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Connectez votre compte Stripe pour recevoir les paiements directement
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingStripeStatus ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : stripeStatus?.connected ? (
              <div className="space-y-6">
                {/* Status Info */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      {stripeStatus.chargesEnabled ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-sm font-medium text-slate-900">Paiements</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {stripeStatus.chargesEnabled ? "Activés" : "Non activés"}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      {stripeStatus.payoutsEnabled ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-sm font-medium text-slate-900">Virements</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {stripeStatus.payoutsEnabled ? "Activés" : "Non activés"}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      {stripeStatus.detailsSubmitted ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-sm font-medium text-slate-900">Profil</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {stripeStatus.detailsSubmitted ? "Complet" : "Incomplet"}
                    </p>
                  </div>
                </div>

                {/* Account Info */}
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm mb-1">
                        Compte connecté
                      </h4>
                      <p className="text-xs text-slate-600">
                        ID: {stripeStatus.accountId}
                      </p>
                      {stripeStatus.email && (
                        <p className="text-xs text-slate-600">
                          Email: {stripeStatus.email}
                        </p>
                      )}
                    </div>
                    <a 
                      href="https://dashboard.stripe.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      Dashboard Stripe
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Warning if not fully configured */}
                {!stripeStatus.chargesEnabled && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 text-sm mb-1">
                          Configuration incomplète
                        </h4>
                        <p className="text-xs text-amber-700 mb-3">
                          Votre compte Stripe n'est pas entièrement configuré. Cliquez sur "Compléter la configuration" pour finaliser.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={connectStripe}
                          disabled={isConnectingStripe}
                          className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          {isConnectingStripe ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            "Compléter la configuration"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={disconnectStripe}
                    disabled={isDisconnectingStripe}
                    className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {isDisconnectingStripe ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Déconnexion...
                      </>
                    ) : (
                      <>
                        <Unlink className="mr-2 h-4 w-4" />
                        Déconnecter Stripe
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 text-base mb-2">
                        Recevez vos paiements directement
                      </h4>
                      <p className="text-sm text-slate-600 mb-4">
                        En connectant votre compte Stripe, vos clients peuvent payer directement et l'argent arrive sur votre compte bancaire. 
                        Sur le plan gratuit, Kapsul prélève une commission de 8% sur chaque vente.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Paiements par carte bancaire
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Virements automatiques sur votre compte
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Dashboard Stripe pour gérer vos revenus
                        </li>
                      </ul>
                    </div>
                    <div className="shrink-0">
                      <Button
                        onClick={connectStripe}
                        disabled={isConnectingStripe}
                        variant="gradient"
                        size="lg"
                        className="shadow-lg rounded-xl"
                      >
                        {isConnectingStripe ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Connexion...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-5 w-5" />
                            Connecter Stripe
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">
                    Comment ça marche ?
                  </h4>
                  <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
                    <li>Cliquez sur "Connecter Stripe" ci-dessus</li>
                    <li>Créez ou connectez votre compte Stripe</li>
                    <li>Complétez les informations de votre entreprise</li>
                    <li>Vos formations seront automatiquement payables par carte</li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PayPal Card */}
        <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-sky-100">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.77.77 0 0 1 .757-.645h6.922c2.33 0 4.13.49 5.35 1.457 1.23.97 1.74 2.39 1.52 4.23-.36 2.92-1.67 5.03-3.89 6.27-1.12.62-2.47.94-4.01.94H9.05a.77.77 0 0 0-.757.645l-.94 4.68a.64.64 0 0 1-.63.54h-.647zm13.448-14.18c-.24 1.93-1.36 3.33-3.12 4.06-.85.36-1.83.54-2.91.54H12.3l-.96 4.78h-1.9l2.05-10.22h4.1c1.06 0 1.9.18 2.51.54.61.36.98.9 1.11 1.63.06.23.09.46.09.68z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-bold text-[#1e293b] tracking-tight">
                    PayPal
                  </CardTitle>
                  {formData.paypal_email && (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      Configuré
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Acceptez les paiements PayPal en plus de Stripe
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paypal_email" className="text-slate-900 font-medium text-sm">
                    Email PayPal Business
                  </Label>
                  <Input
                    id="paypal_email"
                    type="email"
                    placeholder="paiements@votre-entreprise.com"
                    value={formData.paypal_email}
                    onChange={(e) => setFormData({ ...formData, paypal_email: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    L'adresse email associée à votre compte PayPal Business
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paypal_merchant_id" className="text-slate-900 font-medium text-sm">
                    Merchant ID PayPal (optionnel)
                  </Label>
                  <Input
                    id="paypal_merchant_id"
                    placeholder="ABC123XYZ456"
                    value={formData.paypal_merchant_id}
                    onChange={(e) => setFormData({ ...formData, paypal_merchant_id: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Trouvable dans Paramètres PayPal → Informations du compte
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-slate-900 text-sm mb-3">
                    Pourquoi ajouter PayPal ?
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      Plus d'options de paiement pour vos clients
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      Populaire pour les paiements internationaux
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      Protection acheteur intégrée
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">
                    Comment obtenir ces informations ?
                  </h4>
                  <ol className="space-y-1 text-sm text-slate-600 list-decimal list-inside">
                    <li>Connectez-vous à paypal.com</li>
                    <li>Allez dans Paramètres → Compte</li>
                    <li>Copiez votre email et/ou Merchant ID</li>
                  </ol>
                  <a 
                    href="https://www.paypal.com/businessprofile/settings" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-3"
                  >
                    Ouvrir les paramètres PayPal
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Settings Card */}
        <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100">
                <Webhook className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-[#1e293b] tracking-tight">
                  Webhooks sortants
                </CardTitle>
                <CardDescription>
                  Connectez votre académie à Zapier, Make, ou n'importe quel service webhook
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook_url" className="text-slate-900 font-medium text-sm">
                    URL du Webhook
                  </Label>
                  <Input
                    id="webhook_url"
                    type="url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Collez l'URL de votre webhook Zapier, Make, ou autre service d'automatisation
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-900 font-medium text-sm">
                    Événements à envoyer
                  </Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <Checkbox
                        checked={formData.webhook_events.includes("new_student")}
                        onCheckedChange={() => toggleWebhookEvent("new_student")}
                      />
                      <div>
                        <span className="font-medium text-sm text-slate-900">Nouvel étudiant</span>
                        <p className="text-xs text-slate-500">Déclenché quand un étudiant rejoint l'académie</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <Checkbox
                        checked={formData.webhook_events.includes("new_purchase")}
                        onCheckedChange={() => toggleWebhookEvent("new_purchase")}
                      />
                      <div>
                        <span className="font-medium text-sm text-slate-900">Nouvel achat</span>
                        <p className="text-xs text-slate-500">Déclenché quand un achat est complété</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-slate-900 text-sm">
                      Comment ça marche ?
                    </h4>
                  </div>
                  <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
                    <li>Créez un Zap/Scénario avec un déclencheur "Webhook"</li>
                    <li>Copiez l'URL du webhook fournie</li>
                    <li>Collez-la dans le champ ci-contre</li>
                    <li>Sauvegardez et testez avec le bouton ci-dessous</li>
                  </ol>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">
                    Données envoyées :
                  </h4>
                  <pre className="text-xs text-slate-600 bg-white p-3 rounded-lg overflow-x-auto">
{`{
  "event": "new_purchase",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "student_email": "...",
    "student_name": "...",
    "course_name": "...",
    "amount": 97.00,
    "academy_name": "..."
  }
}`}
                  </pre>
                </div>

                <Button
                  variant="outline"
                  onClick={testWebhook}
                  disabled={isTestingWebhook || !formData.webhook_url}
                  className="rounded-xl w-full"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {isTestingWebhook ? "Envoi en cours..." : "Envoyer un webhook test"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Tracking Card */}
        <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-bold text-[#1e293b] tracking-tight">
                    Analytics & Tracking
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">Avancé</Badge>
                </div>
                <CardDescription>
                  Suivez les performances de vos landing pages avec Google Tag Manager et Facebook Pixel
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gtm_container_id" className="text-slate-900 font-medium text-sm">
                    Google Tag Manager - Container ID
                  </Label>
                  <Input
                    id="gtm_container_id"
                    placeholder="GTM-XXXXXXX"
                    value={formData.gtm_container_id}
                    onChange={(e) => setFormData({ ...formData, gtm_container_id: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Trouvable dans Google Tag Manager → Admin → Container ID
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook_pixel_id" className="text-slate-900 font-medium text-sm">
                    Facebook Pixel ID
                  </Label>
                  <Input
                    id="facebook_pixel_id"
                    placeholder="123456789012345"
                    value={formData.facebook_pixel_id}
                    onChange={(e) => setFormData({ ...formData, facebook_pixel_id: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Trouvable dans Meta Business Suite → Événements → Pixels
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <h4 className="font-semibold text-slate-900 text-sm mb-3">
                    Pourquoi configurer le tracking ?
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Mesurez les conversions de vos publicités
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Créez des audiences de retargeting
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Optimisez vos campagnes marketing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Analysez le comportement des visiteurs
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">
                    Note importante
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Les scripts de tracking ne seront chargés que si le visiteur accepte les cookies. 
                    Un bandeau de consentement s'affichera automatiquement sur vos landing pages.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">
                    Liens utiles
                  </h4>
                  <div className="space-y-1">
                    <a 
                      href="https://tagmanager.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Google Tag Manager
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <a 
                      href="https://business.facebook.com/events_manager" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Meta Events Manager
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Redirection Guide */}
      {currentOrg && (
        <DomainRedirectionGuide slug={currentOrg.slug} />
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => updateOrgMutation.mutate(formData)}
          variant="gradient"
          size="lg"
          className="shadow-lg"
          disabled={updateOrgMutation.isPending}
        >
          <Save className="mr-2 h-5 w-5" />
          {updateOrgMutation.isPending ? "Sauvegarde..." : "Sauvegarder les modifications"}
        </Button>
      </div>
    </div>
  );
}
