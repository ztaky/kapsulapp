import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LegalPageSetting {
  title: string;
  content: string;
}

export interface TrackingSetting {
  gtm_container_id: string;
  facebook_pixel_id: string;
}

export interface PlatformSettings {
  legal_mentions?: LegalPageSetting;
  privacy_policy?: LegalPageSetting;
  terms_of_service?: LegalPageSetting;
  cookie_policy?: LegalPageSetting;
  tracking?: TrackingSetting;
}

export function usePlatformSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*");

      if (error) throw error;

      // Convert array to object keyed by 'key'
      const settingsMap: PlatformSettings = {};
      data?.forEach((item: any) => {
        settingsMap[item.key as keyof PlatformSettings] = item.value;
      });

      return settingsMap;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("platform_settings")
        .update({ 
          value, 
          updated_at: new Date().toISOString(),
          updated_by: user.user?.id 
        })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("Paramètre sauvegardé");
    },
    onError: (error) => {
      console.error("Error updating setting:", error);
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  return {
    settings,
    isLoading,
    updateSetting,
  };
}

export function usePlatformSetting<T = LegalPageSetting>(key: string) {
  return useQuery({
    queryKey: ["platform-setting", key],
    queryFn: async (): Promise<T | null> => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", key)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return (data?.value as T) || null;
    },
  });
}
