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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Branding</h2>
        <p className="text-muted-foreground">Personnalisez l'apparence de votre école</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identité visuelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'école</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" value={formData.slug} disabled />
              <p className="text-xs text-muted-foreground">
                Le slug ne peut pas être modifié
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo (URL)</Label>
            <Input
              id="logo_url"
              type="url"
              placeholder="https://..."
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand_color">Couleur de marque</Label>
            <div className="flex gap-4 items-center">
              <Input
                id="brand_color"
                type="color"
                value={formData.brand_color}
                onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.brand_color}
                onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                placeholder="#d97706"
              />
            </div>
          </div>

          <Button onClick={() => updateOrgMutation.mutate(formData)}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
