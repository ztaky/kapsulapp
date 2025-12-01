import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EmailQuotaData {
  emailsSent: number;
  emailsLimit: number | null;
  bonusEmails: number;
  totalAvailable: number | null;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  remaining: number | null;
}

export function useEmailQuota(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["email-quota", organizationId],
    queryFn: async (): Promise<EmailQuotaData | null> => {
      if (!organizationId) return null;

      // Get current month in YYYY-MM format
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Call the database function to get email usage
      const { data, error } = await supabase.rpc('get_email_usage', {
        _organization_id: organizationId,
        _month_year: monthYear
      });

      if (error) {
        console.error("Error fetching email quota:", error);
        return null;
      }

      const result = data?.[0];
      const emailsSent = result?.emails_sent || 0;
      const emailsLimit = result?.emails_limit || null;
      const bonusEmails = result?.bonus_emails || 0;

      // Total available = monthly limit + bonus (if there's a limit)
      const totalAvailable = emailsLimit ? emailsLimit + bonusEmails : null;
      
      // Calculate percentage based on total available (monthly + bonus)
      const percentage = totalAvailable ? Math.round((emailsSent / totalAvailable) * 100) : 0;
      
      // Near limit if > 80%, at limit if >= 100%
      const isNearLimit = totalAvailable ? percentage >= 80 : false;
      const isAtLimit = totalAvailable ? emailsSent >= totalAvailable : false;
      const remaining = totalAvailable ? Math.max(0, totalAvailable - emailsSent) : null;

      return {
        emailsSent,
        emailsLimit,
        bonusEmails,
        totalAvailable,
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
