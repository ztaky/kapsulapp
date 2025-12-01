import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DraftData {
  course: {
    title: string;
    description: string;
    target_audience?: string;
    duration_estimate?: string;
  };
  modules: Array<{
    title: string;
    description?: string;
    lessons: Array<{
      title: string;
      content: string;
      has_quiz?: boolean;
      quiz?: any;
    }>;
  }>;
}

interface CourseDraft {
  id: string;
  title: string;
  draft_data: DraftData;
  created_at: string;
  updated_at: string;
}

export function useSaveDraft(organizationId: string) {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveDraft = async (
    title: string,
    draftData: DraftData,
    draftId?: string
  ): Promise<{ success: boolean; draftId?: string; error?: string }> => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      if (draftId) {
        // Update existing draft
        const { error } = await (supabase
          .from("course_drafts") as any)
          .update({
            title,
            draft_data: draftData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draftId);

        if (error) throw error;

        toast.success("Brouillon mis à jour !");
        return { success: true, draftId };
      } else {
        // Create new draft
        const { data, error } = await (supabase
          .from("course_drafts") as any)
          .insert({
            organization_id: organizationId,
            title,
            draft_data: draftData,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        toast.success("Brouillon sauvegardé !");
        return { success: true, draftId: data.id };
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Erreur lors de la sauvegarde du brouillon");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setIsSaving(false);
    }
  };

  const loadDrafts = async (): Promise<CourseDraft[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_drafts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data || []) as unknown as CourseDraft[];
    } catch (error) {
      console.error("Error loading drafts:", error);
      toast.error("Erreur lors du chargement des brouillons");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDraft = async (draftId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("course_drafts")
        .delete()
        .eq("id", draftId);

      if (error) throw error;

      toast.success("Brouillon supprimé");
      return true;
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast.error("Erreur lors de la suppression du brouillon");
      return false;
    }
  };

  return {
    saveDraft,
    loadDrafts,
    deleteDraft,
    isSaving,
    isLoading,
  };
}
