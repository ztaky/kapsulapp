import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, DollarSign, Star, Check, AlertTriangle, ExternalLink } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  features: string[];
  ai_credits_limit: number | null;
  email_limit: number | null;
  max_students: number | null;
  max_courses: number | null;
  is_active: boolean;
  is_highlighted: boolean;
  position: number;
  badge_text: string | null;
}

const defaultFormData = {
  name: "",
  slug: "",
  description: "",
  price_monthly: 0,
  price_yearly: "",
  stripe_price_id_monthly: "",
  stripe_price_id_yearly: "",
  features: [] as string[],
  ai_credits_limit: "",
  email_limit: "",
  max_students: "",
  max_courses: "",
  is_active: true,
  is_highlighted: false,
  badge_text: "",
};

export default function AdminPricing() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [featuresInput, setFeaturesInput] = useState("");

  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;
      return data as PricingPlan[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price_monthly: Number(data.price_monthly),
        price_yearly: data.price_yearly ? Number(data.price_yearly) : null,
        stripe_price_id_monthly: data.stripe_price_id_monthly || null,
        stripe_price_id_yearly: data.stripe_price_id_yearly || null,
        features: data.features,
        ai_credits_limit: data.ai_credits_limit ? Number(data.ai_credits_limit) : null,
        email_limit: data.email_limit ? Number(data.email_limit) : null,
        max_students: data.max_students ? Number(data.max_students) : null,
        max_courses: data.max_courses ? Number(data.max_courses) : null,
        is_active: data.is_active,
        is_highlighted: data.is_highlighted,
        badge_text: data.badge_text || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("pricing_plans")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const maxPosition = plans?.reduce((max, p) => Math.max(max, p.position), 0) || 0;
        const { error } = await supabase
          .from("pricing_plans")
          .insert({ ...payload, position: maxPosition + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
      toast.success(editingPlan ? "Plan modifié" : "Plan créé");
      closeDialog();
    },
    onError: (error) => {
      toast.error("Erreur: " + (error as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
      toast.success("Plan supprimé");
    },
    onError: (error) => {
      toast.error("Erreur: " + (error as Error).message);
    },
  });

  const openDialog = (plan?: PricingPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || "",
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly?.toString() || "",
        stripe_price_id_monthly: plan.stripe_price_id_monthly || "",
        stripe_price_id_yearly: plan.stripe_price_id_yearly || "",
        features: plan.features || [],
        ai_credits_limit: plan.ai_credits_limit?.toString() || "",
        email_limit: plan.email_limit?.toString() || "",
        max_students: plan.max_students?.toString() || "",
        max_courses: plan.max_courses?.toString() || "",
        is_active: plan.is_active,
        is_highlighted: plan.is_highlighted,
        badge_text: plan.badge_text || "",
      });
      setFeaturesInput((plan.features || []).join("\n"));
    } else {
      setEditingPlan(null);
      setFormData(defaultFormData);
      setFeaturesInput("");
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
    setFormData(defaultFormData);
    setFeaturesInput("");
  };

  const handleFeaturesChange = (value: string) => {
    setFeaturesInput(value);
    setFormData({
      ...formData,
      features: value.split("\n").filter((f) => f.trim()),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingPlan?.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pricing</h1>
            <p className="text-muted-foreground">Gérez les plans tarifaires de Kapsul</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? "Modifier le plan" : "Nouveau plan"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du plan *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_monthly">Prix mensuel (€) *</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.01"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_yearly">Prix annuel (€)</Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    step="0.01"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                    placeholder="Laisser vide si paiement unique"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe_price_id_monthly">Stripe Price ID (mensuel)</Label>
                  <Input
                    id="stripe_price_id_monthly"
                    value={formData.stripe_price_id_monthly}
                    onChange={(e) => setFormData({ ...formData, stripe_price_id_monthly: e.target.value })}
                    placeholder="price_xxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe_price_id_yearly">Stripe Price ID (annuel)</Label>
                  <Input
                    id="stripe_price_id_yearly"
                    value={formData.stripe_price_id_yearly}
                    onChange={(e) => setFormData({ ...formData, stripe_price_id_yearly: e.target.value })}
                    placeholder="price_xxx"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Les Stripe Price IDs doivent correspondre à des prix créés dans votre Dashboard Stripe.
                    Modifier les prix ici ne modifie pas les prix dans Stripe.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Limites</Label>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Crédits IA/mois</Label>
                    <Input
                      type="number"
                      value={formData.ai_credits_limit}
                      onChange={(e) => setFormData({ ...formData, ai_credits_limit: e.target.value })}
                      placeholder="Illimité"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Emails/mois</Label>
                    <Input
                      type="number"
                      value={formData.email_limit}
                      onChange={(e) => setFormData({ ...formData, email_limit: e.target.value })}
                      placeholder="Illimité"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Max étudiants</Label>
                    <Input
                      type="number"
                      value={formData.max_students}
                      onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                      placeholder="Illimité"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Max formations</Label>
                    <Input
                      type="number"
                      value={formData.max_courses}
                      onChange={(e) => setFormData({ ...formData, max_courses: e.target.value })}
                      placeholder="Illimité"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (une par ligne)</Label>
                <Textarea
                  id="features"
                  value={featuresInput}
                  onChange={(e) => handleFeaturesChange(e.target.value)}
                  rows={4}
                  placeholder="Ex:&#10;5000 crédits IA / mois&#10;3000 emails / mois&#10;Support prioritaire"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge_text">Badge (optionnel)</Label>
                <Input
                  id="badge_text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  placeholder="Ex: Populaire, Offre limitée"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Actif</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_highlighted"
                    checked={formData.is_highlighted}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_highlighted: checked })}
                  />
                  <Label htmlFor="is_highlighted">Mis en avant</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.is_highlighted ? "ring-2 ring-primary" : ""} ${!plan.is_active ? "opacity-50" : ""}`}
            >
              {plan.badge_text && (
                <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
                  {plan.badge_text}
                </Badge>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {plan.is_highlighted && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(plan)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Supprimer ce plan ?")) {
                          deleteMutation.mutate(plan.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">{plan.price_monthly}€</span>
                  {plan.price_yearly ? (
                    <span className="text-muted-foreground text-sm">/mois ou {plan.price_yearly}€/an</span>
                  ) : (
                    <span className="text-muted-foreground text-sm"> paiement unique</span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">IA</Badge>
                    <span>{plan.ai_credits_limit ? `${plan.ai_credits_limit.toLocaleString()}/mois` : "Illimité"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Email</Badge>
                    <span>{plan.email_limit ? `${plan.email_limit.toLocaleString()}/mois` : "Illimité"}</span>
                  </div>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-1.5 text-sm">
                    {plan.features.slice(0, 5).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-muted-foreground text-xs">
                        +{plan.features.length - 5} autres...
                      </li>
                    )}
                  </ul>
                )}

                {!plan.is_active && (
                  <Badge variant="secondary">Inactif</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
