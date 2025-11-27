import { useParams } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function StudioBranding() {
  const { slug } = useParams<{ slug: string }>();
  const { organizations } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo_url: "",
    brand_color: "#d97706",
  });

  useEffect(() => {
    if (currentOrg) {
      setFormData({
        name: currentOrg.name,
        slug: currentOrg.slug,
        logo_url: currentOrg.logo_url || "",
        brand_color: currentOrg.brand_color || "#d97706",
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
        })
        .eq("id", currentOrg.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Paramètres sauvegardés" });
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight mb-2">
            Branding de l'académie
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Personnalisez l'apparence de votre académie Kapsul
          </p>
        </div>
      </div>

      <Card className="bg-white border border-slate-100 rounded-3xl shadow-premium">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#1e293b] tracking-tight">
            Identité visuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
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

          <Button 
            onClick={() => updateOrgMutation.mutate(formData)}
            variant="gradient"
            size="lg"
            className="shadow-lg"
          >
            <Save className="mr-2 h-5 w-5" />
            Sauvegarder les modifications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
