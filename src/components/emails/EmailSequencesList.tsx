import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Workflow, Clock } from "lucide-react";
import { toast } from "sonner";
import { EmailSequenceEditor } from "./EmailSequenceEditor";
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

interface EmailSequencesListProps {
  organizationId?: string;
  isAdmin?: boolean;
}

const TRIGGER_LABELS: Record<string, string> = {
  purchase_completed: "Après un achat",
  student_signup: "Après inscription",
  course_completed: "Formation terminée",
  manual: "Déclenchement manuel",
};

export function EmailSequencesList({ organizationId, isAdmin }: EmailSequencesListProps) {
  const queryClient = useQueryClient();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<any>(null);
  const [deleteSequence, setDeleteSequence] = useState<any>(null);

  const { data: sequences, isLoading } = useQuery({
    queryKey: ["email-sequences", organizationId, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("email_sequences")
        .select(`
          *,
          email_sequence_steps(count),
          courses(title)
        `);
      
      if (isAdmin) {
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
        .from("email_sequences")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      toast.success("Séquence mise à jour");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_sequences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      toast.success("Séquence supprimée");
      setDeleteSequence(null);
    },
  });

  const handleEdit = (sequence: any) => {
    setEditingSequence(sequence);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingSequence(null);
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
            {isAdmin ? "Séquences Globales" : "Mes Séquences"}
          </h2>
          <p className="text-sm text-slate-500">
            Automatisez l'envoi d'emails selon des déclencheurs
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle séquence
        </Button>
      </div>

      {sequences?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Aucune séquence</h3>
            <p className="text-sm text-slate-500 mb-4">
              Créez votre première séquence d'emails automatisés
            </p>
            <Button onClick={handleCreate} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Créer une séquence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sequences?.map((sequence) => (
            <Card key={sequence.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{sequence.name}</CardTitle>
                    <CardDescription>{sequence.description}</CardDescription>
                  </div>
                  <Switch
                    checked={sequence.is_active}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: sequence.id, is_active: checked })
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">
                    {TRIGGER_LABELS[sequence.trigger_event] || sequence.trigger_event}
                  </Badge>
                  {sequence.courses?.title && (
                    <Badge variant="outline">{sequence.courses.title}</Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {sequence.email_sequence_steps?.[0]?.count || 0} étape(s)
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(sequence)}
                    className="gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteSequence(sequence)}
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

      <EmailSequenceEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        sequence={editingSequence}
        organizationId={organizationId}
        isAdmin={isAdmin}
      />

      <AlertDialog open={!!deleteSequence} onOpenChange={() => setDeleteSequence(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette séquence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La séquence "{deleteSequence?.name}" et toutes ses
              étapes seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteSequence?.id)}
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
