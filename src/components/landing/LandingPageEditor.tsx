import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Image as ImageIcon, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LandingPageEditorProps {
  landingPageId: string;
  content: any;
  onContentUpdate: (newContent: any) => void;
}

export function LandingPageEditor({ landingPageId, content, onContentUpdate }: LandingPageEditorProps) {
  const [isEditingSection, setIsEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const openEditor = (sectionKey: string, sectionData: any) => {
    setIsEditingSection(sectionKey);
    setEditData(sectionData);
  };

  const closeEditor = () => {
    setIsEditingSection(null);
    setEditData({});
  };

  const saveSection = async () => {
    setSaving(true);
    try {
      // Update the content object with the edited section
      const updatedContent = {
        ...content,
        [isEditingSection!]: editData,
      };

      // Save to database
      const { error } = await supabase
        .from("landing_pages")
        .update({ content: updatedContent })
        .eq("id", landingPageId);

      if (error) throw error;

      onContentUpdate(updatedContent);
      toast.success("Section mise à jour");
      closeEditor();
    } catch (error: any) {
      console.error("Error saving section:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const renderEditForm = () => {
    if (!isEditingSection || !editData) return null;

    switch (isEditingSection) {
      case "hero":
        return (
          <div className="space-y-4">
            <div>
              <Label>Badge</Label>
              <Input
                value={editData.badge || ""}
                onChange={(e) => setEditData({ ...editData, badge: e.target.value })}
                placeholder="Badge au-dessus du titre"
              />
            </div>
            <div>
              <Label>Titre principal</Label>
              <Textarea
                value={editData.headline || ""}
                onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                placeholder="Titre percutant"
                rows={3}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Textarea
                value={editData.subheadline || ""}
                onChange={(e) => setEditData({ ...editData, subheadline: e.target.value })}
                placeholder="Sous-titre explicatif"
                rows={2}
              />
            </div>
            <div>
              <Label>Texte du bouton CTA</Label>
              <Input
                value={editData.cta_text || ""}
                onChange={(e) => setEditData({ ...editData, cta_text: e.target.value })}
                placeholder="S'inscrire maintenant"
              />
            </div>
            <div>
              <Label>Texte sous le bouton</Label>
              <Input
                value={editData.cta_subtext || ""}
                onChange={(e) => setEditData({ ...editData, cta_subtext: e.target.value })}
                placeholder="Garantie 30 jours"
              />
            </div>
          </div>
        );

      case "problem":
        return (
          <div className="space-y-4">
            <div>
              <Label>Titre de la section</Label>
              <Input
                value={editData.title || ""}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="Titre qui résonne"
              />
            </div>
            <div>
              <Label>Texte d'agitation</Label>
              <Textarea
                value={editData.agitation_text || ""}
                onChange={(e) => setEditData({ ...editData, agitation_text: e.target.value })}
                placeholder="Paragraphe qui appuie sur la douleur"
                rows={3}
              />
            </div>
            <div>
              <Label>Points de douleur (un par ligne)</Label>
              <Textarea
                value={editData.pain_points?.join("\n") || ""}
                onChange={(e) => setEditData({ ...editData, pain_points: e.target.value.split("\n").filter(p => p.trim()) })}
                placeholder="Point 1\nPoint 2\nPoint 3"
                rows={5}
              />
            </div>
            <div>
              <Label>Risques (un par ligne)</Label>
              <Textarea
                value={editData.risks?.join("\n") || ""}
                onChange={(e) => setEditData({ ...editData, risks: e.target.value.split("\n").filter(r => r.trim()) })}
                placeholder="Risque 1\nRisque 2"
                rows={3}
              />
            </div>
          </div>
        );

      case "final_cta":
        return (
          <div className="space-y-4">
            <div>
              <Label>Badge d'urgence</Label>
              <Input
                value={editData.urgency_badge || ""}
                onChange={(e) => setEditData({ ...editData, urgency_badge: e.target.value })}
                placeholder="Places limitées"
              />
            </div>
            <div>
              <Label>Titre</Label>
              <Input
                value={editData.title || ""}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="Ne restez pas sur le quai"
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Textarea
                value={editData.subtitle || ""}
                onChange={(e) => setEditData({ ...editData, subtitle: e.target.value })}
                placeholder="Rappel de la transformation"
                rows={2}
              />
            </div>
            <div>
              <Label>Texte du CTA</Label>
              <Input
                value={editData.cta_text || ""}
                onChange={(e) => setEditData({ ...editData, cta_text: e.target.value })}
                placeholder="Je démarre maintenant"
              />
            </div>
            <div>
              <Label>Garantie</Label>
              <Input
                value={editData.guarantee || ""}
                onChange={(e) => setEditData({ ...editData, guarantee: e.target.value })}
                placeholder="Satisfait ou remboursé 30 jours"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Éditeur pour cette section en cours de développement
          </div>
        );
    }
  };

  return (
    <>
      {/* Floating edit buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        <Button
          onClick={() => openEditor("hero", content.hero)}
          className="rounded-full w-14 h-14 shadow-lg"
          title="Éditer Hero"
        >
          <Pencil className="h-5 w-5" />
        </Button>
        {content.problem && (
          <Button
            onClick={() => openEditor("problem", content.problem)}
            variant="secondary"
            className="rounded-full w-14 h-14 shadow-lg"
            title="Éditer Problème"
          >
            <Pencil className="h-5 w-5" />
          </Button>
        )}
        {content.final_cta && (
          <Button
            onClick={() => openEditor("final_cta", content.final_cta)}
            variant="outline"
            className="rounded-full w-14 h-14 shadow-lg"
            title="Éditer CTA Final"
          >
            <Pencil className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!isEditingSection} onOpenChange={closeEditor}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Éditer la section {isEditingSection?.toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Modifiez le contenu de cette section. Les changements seront enregistrés dans votre landing page.
            </DialogDescription>
          </DialogHeader>

          {renderEditForm()}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={closeEditor}>
              Annuler
            </Button>
            <Button onClick={saveSection} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
