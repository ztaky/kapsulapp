import { useParams } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Save, Mail, Send, Eye } from "lucide-react";

export default function StudioBranding() {
  const { slug } = useParams<{ slug: string }>();
  const { organizations } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);
  const queryClient = useQueryClient();
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo_url: "",
    brand_color: "#d97706",
    contact_email: "",
  });

  useEffect(() => {
    if (currentOrg) {
      setFormData({
        name: currentOrg.name,
        slug: currentOrg.slug,
        logo_url: currentOrg.logo_url || "",
        brand_color: currentOrg.brand_color || "#d97706",
        contact_email: (currentOrg as any).contact_email || "",
      });
    }
  }, [currentOrg]);

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight mb-2">
            Branding de l'académie
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Personnalisez l'apparence de votre académie et de vos emails
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
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Email de bienvenue après achat
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
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
