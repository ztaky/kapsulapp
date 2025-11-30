import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  skipped: boolean;
}

const ONBOARDING_STEPS = [
  {
    key: "profile_setup",
    title: "Personnaliser votre académie",
    description: "Ajoutez votre logo et choisissez votre couleur de marque",
  },
  {
    key: "first_course",
    title: "Créer votre première formation",
    description: "Structurez votre contenu en modules et leçons",
  },
  {
    key: "stripe_connect",
    title: "Configurer les paiements",
    description: "Connectez Stripe pour recevoir vos paiements",
  },
  {
    key: "landing_page",
    title: "Créer une page de vente",
    description: "Générez une landing page avec l'IA",
  },
];

export function useOnboarding(organizationId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organization onboarding status and auto-detect completed steps
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["onboarding", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      // Get organization details
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("onboarding_completed, logo_url, brand_color, stripe_account_id")
        .eq("id", organizationId)
        .single();

      if (orgError) throw orgError;

      // Get onboarding progress
      const { data: progress, error: progressError } = await supabase
        .from("onboarding_progress")
        .select("step_key, completed_at, skipped")
        .eq("organization_id", organizationId);

      if (progressError) throw progressError;

      // Auto-detect completed steps
      const [coursesRes, landingPagesRes] = await Promise.all([
        supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId),
        supabase
          .from("landing_pages")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId),
      ]);

      const autoDetected = {
        profile_setup: !!(org.logo_url || (org.brand_color && org.brand_color !== "#d97706")),
        first_course: (coursesRes.count || 0) > 0,
        stripe_connect: !!org.stripe_account_id,
        landing_page: (landingPagesRes.count || 0) > 0,
      };

      // Create progress map
      const progressMap = new Map(
        progress?.map((p) => [p.step_key, { completed: !!p.completed_at, skipped: p.skipped }])
      );

      // Build steps with status
      const steps: OnboardingStep[] = ONBOARDING_STEPS.map((step) => {
        const saved = progressMap.get(step.key);
        const autoCompleted = autoDetected[step.key as keyof typeof autoDetected];
        
        return {
          ...step,
          completed: saved?.completed || autoCompleted,
          skipped: saved?.skipped || false,
        };
      });

      const completedCount = steps.filter((s) => s.completed || s.skipped).length;
      const progress_percentage = Math.round((completedCount / steps.length) * 100);

      return {
        onboardingCompleted: org.onboarding_completed,
        steps,
        completedCount,
        totalSteps: steps.length,
        progress: progress_percentage,
        organization: org,
      };
    },
    enabled: !!organizationId,
  });

  // Mark step as completed
  const markComplete = useMutation({
    mutationFn: async (stepKey: string) => {
      if (!organizationId) throw new Error("No organization");

      const { error } = await supabase
        .from("onboarding_progress")
        .upsert(
          {
            organization_id: organizationId,
            step_key: stepKey,
            completed_at: new Date().toISOString(),
            skipped: false,
          },
          { onConflict: "organization_id,step_key" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", organizationId] });
      toast({
        title: "Étape complétée !",
        description: "Bravo, continuez comme ça 🎉",
      });
    },
  });

  // Skip step
  const skipStep = useMutation({
    mutationFn: async (stepKey: string) => {
      if (!organizationId) throw new Error("No organization");

      const { error } = await supabase
        .from("onboarding_progress")
        .upsert(
          {
            organization_id: organizationId,
            step_key: stepKey,
            completed_at: null,
            skipped: true,
          },
          { onConflict: "organization_id,step_key" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", organizationId] });
    },
  });

  // Complete onboarding
  const completeOnboarding = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("No organization");

      const { error } = await supabase
        .from("organizations")
        .update({ onboarding_completed: true })
        .eq("id", organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", organizationId] });
      toast({
        title: "Configuration terminée !",
        description: "Votre académie est prête à accueillir des étudiants 🚀",
      });
    },
  });

  return {
    steps: data?.steps || [],
    completedCount: data?.completedCount || 0,
    totalSteps: data?.totalSteps || ONBOARDING_STEPS.length,
    progress: data?.progress || 0,
    onboardingCompleted: data?.onboardingCompleted || false,
    isLoading,
    markComplete: markComplete.mutate,
    skipStep: skipStep.mutate,
    completeOnboarding: completeOnboarding.mutate,
    refetch,
  };
}
