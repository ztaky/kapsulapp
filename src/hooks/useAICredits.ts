import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AICreditsData {
  creditsUsed: number;
  creditsLimit: number | null;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  remaining: number | null;
}

export function useAICredits(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["ai-credits", organizationId],
    queryFn: async (): Promise<AICreditsData | null> => {
      if (!organizationId) return null;

      // Get current month in YYYY-MM format
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Call the database function to get AI credits usage
      const { data, error } = await supabase.rpc('get_ai_credits_usage', {
        _organization_id: organizationId,
        _month_year: monthYear
      });

      if (error) {
        console.error("Error fetching AI credits:", error);
        return null;
      }

      const result = data?.[0];
      const creditsUsed = result?.credits_used || 0;
      const creditsLimit = result?.credits_limit || null;

      // Calculate percentage (0 if unlimited)
      const percentage = creditsLimit ? Math.round((creditsUsed / creditsLimit) * 100) : 0;
      
      // Near limit if > 80%, at limit if >= 100%
      const isNearLimit = creditsLimit ? percentage >= 80 : false;
      const isAtLimit = creditsLimit ? creditsUsed >= creditsLimit : false;
      const remaining = creditsLimit ? Math.max(0, creditsLimit - creditsUsed) : null;

      return {
        creditsUsed,
        creditsLimit,
        percentage,
        isNearLimit,
        isAtLimit,
        remaining,
      };
    },
    enabled: !!organizationId,
    staleTime: 60000, // Cache for 60 seconds
  });
}
