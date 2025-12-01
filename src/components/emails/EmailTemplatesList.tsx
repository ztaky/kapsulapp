import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Mail, Eye } from "lucide-react";
import { toast } from "sonner";
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import { EmailPreviewDialog } from "./EmailPreviewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EmailTemplatesListProps {
  organizationId?: string;
  isAdmin?: boolean;
}

const EMAIL_TYPE_LABELS: Record<string, string> = {
  welcome_purchase: "Bienvenue après achat",
  invoice: "Facture",
  course_reminder: "Rappel de cours",
  new_content: "Nouveau contenu",
  onboarding_day_1: "Onboarding J+1",
  onboarding_day_3: "Onboarding J+3",
  onboarding_day_7: "Onboarding J+7",
  coach_welcome: "Bienvenue Coach",
  founder_welcome: "Bienvenue Fondateur",
  support_ticket_created: "Ticket créé",
  support_ticket_reply: "Réponse ticket",
  support_ticket_status: "Statut ticket",
  platform_update: "Mise à jour plateforme",
  custom: "Personnalisé",
};

export function EmailTemplatesList({ organizationId, isAdmin }: EmailTemplatesListProps) {
  const queryClient = useQueryClient();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<any>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates", organizationId, isAdmin],
    queryFn: async () => {
      let query = supabase.from("email_templates").select("*");
      
      if (isAdmin) {
        // Admin sees global templates (org_id is null)
        query = query.is("organization_id", null);
      } else if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template mis à jour");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template supprimé");
      setDeleteTemplate(null);
    },
  });

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {isAdmin ? "Templates Globaux" : "Mes Templates"}
          </h2>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? "Templates par défaut utilisés par toutes les académies"
              : "Personnalisez les emails envoyés à vos étudiants"}
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau template
        </Button>
      </div>

      {templates?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Aucun template</h3>
            <p className="text-sm text-slate-500 mb-4">
              Créez votre premier template d'email
            </p>
            <Button onClick={handleCreate} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Créer un template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="secondary" className="text-xs">
                        {EMAIL_TYPE_LABELS[template.email_type] || template.email_type}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: template.id, is_active: checked })
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 truncate mb-4">{template.subject}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                    className="gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Aperçu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTemplate(template)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EmailTemplateEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        template={editingTemplate}
        organizationId={organizationId}
        isAdmin={isAdmin}
      />

      <EmailPreviewDialog
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />

      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce template ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le template "{deleteTemplate?.name}" sera
              définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTemplate?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
