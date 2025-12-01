import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatformSettings, LegalPageSetting, TrackingSetting } from "@/hooks/usePlatformSettings";
import { Settings, FileText, BarChart3, Shield, Save, Loader2, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminSettings = () => {
  const { settings, isLoading, updateSetting } = usePlatformSettings();
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // Local state for form editing
  const [legalMentions, setLegalMentions] = useState<LegalPageSetting | null>(null);
  const [privacyPolicy, setPrivacyPolicy] = useState<LegalPageSetting | null>(null);
  const [termsOfService, setTermsOfService] = useState<LegalPageSetting | null>(null);
  const [cookiePolicy, setCookiePolicy] = useState<LegalPageSetting | null>(null);
  const [tracking, setTracking] = useState<TrackingSetting | null>(null);

  // Initialize local state when settings load
  useState(() => {
    if (settings) {
      setLegalMentions(settings.legal_mentions || { title: "", content: "" });
      setPrivacyPolicy(settings.privacy_policy || { title: "", content: "" });
      setTermsOfService(settings.terms_of_service || { title: "", content: "" });
      setCookiePolicy(settings.cookie_policy || { title: "", content: "" });
      setTracking(settings.tracking || { gtm_container_id: "", facebook_pixel_id: "" });
    }
  });

  // Update local state when settings change
  if (settings && !legalMentions) {
    setLegalMentions(settings.legal_mentions || { title: "", content: "" });
    setPrivacyPolicy(settings.privacy_policy || { title: "", content: "" });
    setTermsOfService(settings.terms_of_service || { title: "", content: "" });
    setCookiePolicy(settings.cookie_policy || { title: "", content: "" });
    setTracking(settings.tracking || { gtm_container_id: "", facebook_pixel_id: "" });
  }

  const handleSave = async (key: string, value: any) => {
    setIsSaving(key);
    await updateSetting.mutateAsync({ key, value });
    setIsSaving(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Paramètres</h1>
          <p className="text-muted-foreground">Configuration de la plateforme</p>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Paramètres</h1>
        <p className="text-muted-foreground">Configuration de la plateforme Kapsul</p>
      </div>

      <Tabs defaultValue="legal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="legal">
            <FileText className="h-4 w-4 mr-2" />
            Pages légales
          </TabsTrigger>
          <TabsTrigger value="tracking">
            <BarChart3 className="h-4 w-4 mr-2" />
            Tracking
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        {/* Legal Pages Tab */}
        <TabsContent value="legal" className="space-y-6">
          {/* Mentions Légales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mentions Légales</CardTitle>
                  <CardDescription>
                    Informations légales obligatoires
                  </CardDescription>
                </div>
                <a href="/mentions-legales" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={legalMentions?.title || ""}
                  onChange={(e) => setLegalMentions(prev => ({ ...prev!, title: e.target.value }))}
                  placeholder="Mentions Légales"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu (Markdown)</Label>
                <Textarea
                  value={legalMentions?.content || ""}
                  onChange={(e) => setLegalMentions(prev => ({ ...prev!, content: e.target.value }))}
                  placeholder="# Mentions Légales..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={() => handleSave("legal_mentions", legalMentions)}
                disabled={isSaving === "legal_mentions"}
              >
                {isSaving === "legal_mentions" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </CardContent>
          </Card>

          {/* Politique de Confidentialité */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Politique de Confidentialité</CardTitle>
                  <CardDescription>
                    RGPD et protection des données
                  </CardDescription>
                </div>
                <a href="/confidentialite" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={privacyPolicy?.title || ""}
                  onChange={(e) => setPrivacyPolicy(prev => ({ ...prev!, title: e.target.value }))}
                  placeholder="Politique de Confidentialité"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu (Markdown)</Label>
                <Textarea
                  value={privacyPolicy?.content || ""}
                  onChange={(e) => setPrivacyPolicy(prev => ({ ...prev!, content: e.target.value }))}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={() => handleSave("privacy_policy", privacyPolicy)}
                disabled={isSaving === "privacy_policy"}
              >
                {isSaving === "privacy_policy" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </CardContent>
          </Card>

          {/* CGV */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conditions Générales de Vente</CardTitle>
                  <CardDescription>
                    Conditions commerciales
                  </CardDescription>
                </div>
                <a href="/cgv" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={termsOfService?.title || ""}
                  onChange={(e) => setTermsOfService(prev => ({ ...prev!, title: e.target.value }))}
                  placeholder="Conditions Générales de Vente"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu (Markdown)</Label>
                <Textarea
                  value={termsOfService?.content || ""}
                  onChange={(e) => setTermsOfService(prev => ({ ...prev!, content: e.target.value }))}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={() => handleSave("terms_of_service", termsOfService)}
                disabled={isSaving === "terms_of_service"}
              >
                {isSaving === "terms_of_service" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </CardContent>
          </Card>

          {/* Politique des Cookies */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Politique des Cookies</CardTitle>
                  <CardDescription>
                    Informations sur les cookies utilisés
                  </CardDescription>
                </div>
                <a href="/cookies" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={cookiePolicy?.title || ""}
                  onChange={(e) => setCookiePolicy(prev => ({ ...prev!, title: e.target.value }))}
                  placeholder="Politique des Cookies"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu (Markdown)</Label>
                <Textarea
                  value={cookiePolicy?.content || ""}
                  onChange={(e) => setCookiePolicy(prev => ({ ...prev!, content: e.target.value }))}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={() => handleSave("cookie_policy", cookiePolicy)}
                disabled={isSaving === "cookie_policy"}
              >
                {isSaving === "cookie_policy" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scripts de Tracking</CardTitle>
              <CardDescription>
                Configurez Google Tag Manager et Facebook Pixel pour le site Kapsul.
                Ces scripts ne seront chargés qu'après consentement des utilisateurs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Google Tag Manager Container ID</Label>
                <Input
                  value={tracking?.gtm_container_id || ""}
                  onChange={(e) => setTracking(prev => ({ ...prev!, gtm_container_id: e.target.value }))}
                  placeholder="GTM-XXXXXXX"
                />
                <p className="text-xs text-muted-foreground">
                  Format: GTM-XXXXXXX. Trouvez-le dans Google Tag Manager → Admin → Container ID
                </p>
              </div>

              <div className="space-y-2">
                <Label>Facebook Pixel ID</Label>
                <Input
                  value={tracking?.facebook_pixel_id || ""}
                  onChange={(e) => setTracking(prev => ({ ...prev!, facebook_pixel_id: e.target.value }))}
                  placeholder="123456789012345"
                />
                <p className="text-xs text-muted-foreground">
                  ID numérique à 15 chiffres. Trouvez-le dans Meta Business Suite → Pixels
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Note :</strong> Les scripts de tracking ne sont chargés que si l'utilisateur accepte les cookies correspondants (Analytics pour GTM, Marketing pour Facebook Pixel).
                </p>
              </div>

              <Button
                onClick={() => handleSave("tracking", tracking)}
                disabled={isSaving === "tracking"}
              >
                {isSaving === "tracking" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Sécurité</CardTitle>
              <CardDescription>
                Configuration avancée de la sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Bientôt disponible : configuration des sessions, 2FA obligatoire, logs de sécurité...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
