import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StudentLimitData {
  currentCount: number;
  maxAllowed: number | null;
  canAdd: boolean;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  isFounderPlan: boolean;
}

export function useStudentLimit(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["student-limit", organizationId],
    queryFn: async (): Promise<StudentLimitData | null> => {
      if (!organizationId) return null;

      // Get organization plan info
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("is_founder_plan, max_students")
        .eq("id", organizationId)
        .single();

      if (orgError) {
        console.error("Error fetching organization:", orgError);
        return null;
      }

      // Get current student count
      const { count, error: countError } = await supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("role", "student");

      if (countError) {
        console.error("Error fetching student count:", countError);
        return null;
      }

      const currentCount = count || 0;
      const maxAllowed = org?.max_students || null;
      const isFounderPlan = org?.is_founder_plan || false;

      // Calculate percentage (0 if unlimited)
      const percentage = maxAllowed ? Math.round((currentCount / maxAllowed) * 100) : 0;
      
      // Near limit if > 80%, at limit if >= 100%
      const isNearLimit = maxAllowed ? percentage >= 80 : false;
      const isAtLimit = maxAllowed ? currentCount >= maxAllowed : false;
      const canAdd = maxAllowed === null || currentCount < maxAllowed;

      return {
        currentCount,
        maxAllowed,
        canAdd,
        percentage,
        isNearLimit,
        isAtLimit,
        isFounderPlan,
      };
    },
    enabled: !!organizationId,
    staleTime: 30000, // Cache for 30 seconds
  });
}
