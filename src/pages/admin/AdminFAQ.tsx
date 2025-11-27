import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles, Pencil, Trash2, Eye, ThumbsUp, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  views_count: number;
  helpful_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const categoryLabels: Record<string, string> = {
  technique: "Technique",
  facturation: "Facturation",
  compte: "Compte",
  formation: "Formation",
  autre: "Autre",
};

const categoryColors: Record<string, string> = {
  technique: "bg-blue-100 text-blue-800",
  facturation: "bg-green-100 text-green-800",
  compte: "bg-purple-100 text-purple-800",
  formation: "bg-amber-100 text-amber-800",
  autre: "bg-slate-100 text-slate-800",
};

export default function AdminFAQ() {
  const [faqEntries, setFaqEntries] = useState<FAQEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingEntry, setEditingEntry] = useState<FAQEntry | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "autre",
    is_published: false,
  });

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = async () => {
    try {
      const { data, error } = await supabase
        .from("faq_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFaqEntries(data || []);
    } catch (error) {
      console.error("Error fetching FAQ:", error);
      toast.error("Erreur lors du chargement de la FAQ");
    } finally {
      setLoading(false);
    }
  };

  const generateFAQ = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée");
        return;
      }

      const response = await supabase.functions.invoke("generate-faq", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(response.data.message);
      fetchFAQ();
    } catch (error: any) {
      console.error("Error generating FAQ:", error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from("faq_entries").insert({
        question: formData.question,
        answer: formData.answer,
        category: formData.category,
        is_published: formData.is_published,
      });

      if (error) throw error;

      toast.success("Entrée FAQ créée");
      setShowCreateDialog(false);
      setFormData({ question: "", answer: "", category: "autre", is_published: false });
      fetchFAQ();
    } catch (error) {
      console.error("Error creating FAQ:", error);
      toast.error("Erreur lors de la création");
    }
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from("faq_entries")
        .update({
          question: formData.question,
          answer: formData.answer,
          category: formData.category,
          is_published: formData.is_published,
        })
        .eq("id", editingEntry.id);

      if (error) throw error;

      toast.success("Entrée FAQ mise à jour");
      setEditingEntry(null);
      fetchFAQ();
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette entrée FAQ ?")) return;

    try {
      const { error } = await supabase.from("faq_entries").delete().eq("id", id);
      if (error) throw error;

      toast.success("Entrée FAQ supprimée");
      fetchFAQ();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const togglePublish = async (entry: FAQEntry) => {
    try {
      const { error } = await supabase
        .from("faq_entries")
        .update({ is_published: !entry.is_published })
        .eq("id", entry.id);

      if (error) throw error;

      toast.success(entry.is_published ? "Entrée dépubliée" : "Entrée publiée");
      fetchFAQ();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const filteredEntries = faqEntries.filter((entry) => {
    const matchesSearch =
      entry.question.toLowerCase().includes(search.toLowerCase()) ||
      entry.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || entry.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: faqEntries.length,
    published: faqEntries.filter((e) => e.is_published).length,
    totalViews: faqEntries.reduce((sum, e) => sum + e.views_count, 0),
    totalHelpful: faqEntries.reduce((sum, e) => sum + e.helpful_count, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            FAQ
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Gérez la base de connaissances
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateFAQ} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Générer avec l'IA
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData({ question: "", answer: "", category: "autre", is_published: false })}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle entrée
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer une entrée FAQ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Question</Label>
                  <Input
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="La question..."
                  />
                </div>
                <div>
                  <Label>Réponse</Label>
                  <Textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="La réponse détaillée..."
                    rows={6}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Catégorie</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(v) => setFormData({ ...formData, is_published: v })}
                    />
                    <Label>Publier</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreate} disabled={!formData.question || !formData.answer}>
                    Créer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total entrées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.published}</p>
            <p className="text-sm text-muted-foreground">Publiées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.totalViews}</p>
            </div>
            <p className="text-sm text-muted-foreground">Vues totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.totalHelpful}</p>
            </div>
            <p className="text-sm text-muted-foreground">Utile</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucune entrée FAQ trouvée
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {entry.category && (
                        <Badge className={categoryColors[entry.category] || categoryColors.autre}>
                          {categoryLabels[entry.category] || entry.category}
                        </Badge>
                      )}
                      <Badge variant={entry.is_published ? "default" : "secondary"}>
                        {entry.is_published ? "Publié" : "Brouillon"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{entry.question}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingEntry(entry);
                        setFormData({
                          question: entry.question,
                          answer: entry.answer,
                          category: entry.category || "autre",
                          is_published: entry.is_published,
                        });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{entry.answer}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {entry.views_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {entry.helpful_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>
                      {format(new Date(entry.created_at), "d MMM yyyy", { locale: fr })}
                    </span>
                    <Switch
                      checked={entry.is_published}
                      onCheckedChange={() => togglePublish(entry)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'entrée FAQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Question</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              />
            </div>
            <div>
              <Label>Réponse</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={6}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(v) => setFormData({ ...formData, is_published: v })}
                />
                <Label>Publier</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingEntry(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
