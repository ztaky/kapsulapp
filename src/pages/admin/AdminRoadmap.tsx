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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Map, Clock, Rocket, CheckCircle2, GripVertical, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: "planned" | "in_progress" | "completed";
  category: string | null;
  votes_count: number;
  release_date: string | null;
  position: number;
  is_visible: boolean;
  created_at: string;
}

const statusConfig = {
  planned: { label: "À venir", icon: Clock, color: "bg-muted" },
  in_progress: { label: "En cours", icon: Rocket, color: "bg-amber-100 text-amber-700" },
  completed: { label: "Terminé", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
};

const defaultFormData = {
  title: "",
  description: "",
  status: "planned" as "planned" | "in_progress" | "completed",
  category: "",
  release_date: "",
  is_visible: true,
};

export default function AdminRoadmap() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-roadmap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_items")
        .select("*")
        .order("status")
        .order("position", { ascending: true });

      if (error) throw error;
      return data as RoadmapItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        title: data.title,
        description: data.description || null,
        status: data.status,
        category: data.category || null,
        release_date: data.release_date || null,
        is_visible: data.is_visible,
      };

      if (data.id) {
        const { error } = await supabase
          .from("roadmap_items")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const maxPosition = items?.reduce((max, i) => Math.max(max, i.position), 0) || 0;
        const { error } = await supabase
          .from("roadmap_items")
          .insert({ ...payload, position: maxPosition + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roadmap"] });
      toast.success(editingItem ? "Élément modifié" : "Élément créé");
      closeDialog();
    },
    onError: (error) => {
      toast.error("Erreur: " + (error as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("roadmap_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roadmap"] });
      toast.success("Élément supprimé");
    },
    onError: (error) => {
      toast.error("Erreur: " + (error as Error).message);
    },
  });

  const openDialog = (item?: RoadmapItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || "",
        status: item.status,
        category: item.category || "",
        release_date: item.release_date || "",
        is_visible: item.is_visible,
      });
    } else {
      setEditingItem(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingItem?.id });
  };

  const groupedItems = {
    planned: items?.filter((i) => i.status === "planned") || [],
    in_progress: items?.filter((i) => i.status === "in_progress") || [],
    completed: items?.filter((i) => i.status === "completed") || [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Map className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roadmap</h1>
            <p className="text-muted-foreground">Gérez la roadmap publique de Kapsul</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/roadmap" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir la page publique
            </a>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Modifier l'élément" : "Nouvel élément"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: "planned" | "in_progress" | "completed") =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">À venir</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Formations, Email..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="release_date">Date de sortie prévue</Label>
                  <Input
                    id="release_date"
                    type="date"
                    value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_visible">Visible publiquement</Label>
                  <Switch
                    id="is_visible"
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                  />
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {(["planned", "in_progress", "completed"] as const).map((status) => {
            const config = statusConfig[status];
            const StatusIcon = config.icon;
            const columnItems = groupedItems[status];

            return (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <StatusIcon className="w-5 h-5" />
                    {config.label}
                    <Badge variant="secondary" className="ml-auto">
                      {columnItems.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {columnItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun élément
                    </p>
                  ) : (
                    columnItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border ${!item.is_visible ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-sm">{item.title}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openDialog(item)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm("Supprimer cet élément ?")) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.category && (
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          )}
                          {!item.is_visible && (
                            <Badge variant="secondary" className="text-xs">
                              Masqué
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
