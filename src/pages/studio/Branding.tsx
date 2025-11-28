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
import { Save, Mail, Send, Eye, Webhook, Zap, CheckCircle2, CreditCard, AlertCircle, ExternalLink, Loader2, Unlink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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
    logo_url: "",
    brand_color: "#d97706",
    contact_email: "",
    webhook_url: "",
    webhook_events: ["new_student", "new_purchase"] as string[],
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
        logo_url: currentOrg.logo_url || "",
        brand_color: currentOrg.brand_color || "#d97706",
        contact_email: org.contact_email || "",
        webhook_url: org.webhook_url || "",
        webhook_events: org.webhook_events || ["new_student", "new_purchase"],
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
          logo_url: data.logo_url || null,
          brand_color: data.brand_color,
          contact_email: data.contact_email || null,
          webhook_url: data.webhook_url || null,
          webhook_events: data.webhook_events,
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
            Branding de l'académie
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
                        Kapsul prélève une commission de 10% sur chaque vente.
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
      </div>

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
