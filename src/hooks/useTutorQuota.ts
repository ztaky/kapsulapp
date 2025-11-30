import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TutorQuotaData {
  usage: number;
  limit: number;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

export function useTutorQuota(userId: string | undefined, organizationId: string | undefined) {
  return useQuery<TutorQuotaData>({
    queryKey: ["tutor-quota", userId, organizationId],
    queryFn: async () => {
      if (!userId || !organizationId) {
        return { usage: 0, limit: 50, percentage: 0, isNearLimit: false, isAtLimit: false };
      }

      const currentMonth = new Date().toISOString().slice(0, 7);

      // Get organization quota setting
      const { data: org } = await supabase
        .from("organizations")
        .select("tutor_quota_per_student")
        .eq("id", organizationId)
        .single();

      const limit = org?.tutor_quota_per_student ?? 50;

      // Get current usage via the function
      const { data: usage, error } = await supabase.rpc("get_tutor_usage", {
        _user_id: userId,
        _organization_id: organizationId,
        _month_year: currentMonth,
      });

      if (error) {
        console.error("Error fetching tutor usage:", error);
        return { usage: 0, limit, percentage: 0, isNearLimit: false, isAtLimit: false };
      }

      const currentUsage = usage ?? 0;
      const percentage = Math.round((currentUsage / limit) * 100);

      return {
        usage: currentUsage,
        limit,
        percentage: Math.min(percentage, 100),
        isNearLimit: percentage >= 80 && percentage < 100,
        isAtLimit: currentUsage >= limit,
      };
    },
    enabled: !!userId && !!organizationId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
