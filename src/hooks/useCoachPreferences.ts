import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CoachPreferences {
  id?: string;
  organization_id: string;
  preferred_colors: string[];
  preferred_fonts: {
    heading?: string;
    body?: string;
  };
  preferred_cta_style: 'solid' | 'gradient';
  preferred_layout_style: string;
  learned_from_edits: any[];
}

export function useCoachPreferences(organizationId: string | null) {
  const [preferences, setPreferences] = useState<CoachPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchPreferences();
    }
  }, [organizationId]);

  const fetchPreferences = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from("coach_design_preferences")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          ...data,
          preferred_cta_style: (data.preferred_cta_style as 'solid' | 'gradient') || 'gradient',
          preferred_fonts: (data.preferred_fonts as any) || {},
          learned_from_edits: (data.learned_from_edits as any) || [],
        } as CoachPreferences);
      } else {
        setPreferences(null);
      }
    } catch (error) {
      console.error("Error fetching coach preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<CoachPreferences>) => {
    if (!organizationId) return;

    try {
      const { data: existing } = await supabase
        .from("coach_design_preferences")
        .select("id")
        .eq("organization_id", organizationId)
        .single();

      let result;
      if (existing) {
        // Update existing
        result = await supabase
          .from("coach_design_preferences")
          .update(updates)
          .eq("organization_id", organizationId)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabase
          .from("coach_design_preferences")
          .insert({
            organization_id: organizationId,
            ...updates,
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      if (result.data) {
        setPreferences({
          ...result.data,
          preferred_cta_style: (result.data.preferred_cta_style as 'solid' | 'gradient') || 'gradient',
          preferred_fonts: (result.data.preferred_fonts as any) || {},
          learned_from_edits: (result.data.learned_from_edits as any) || [],
        } as CoachPreferences);
      }
      toast.success("Préférences enregistrées");
    } catch (error: any) {
      console.error("Error updating preferences:", error);
      toast.error("Erreur lors de la sauvegarde des préférences");
    }
  };

  const learnFromDesignChoices = async (colors: string[], fonts: any, ctaStyle: 'solid' | 'gradient') => {
    if (!organizationId) return;

    await updatePreferences({
      preferred_colors: colors,
      preferred_fonts: fonts,
      preferred_cta_style: ctaStyle,
    });
  };

  return {
    preferences,
    loading,
    updatePreferences,
    learnFromDesignChoices,
    refetch: fetchPreferences,
  };
}
