import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFounderStatus() {
  const [isFounder, setIsFounder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFounderStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.user_metadata?.is_founder) {
          setIsFounder(true);
        }
      } catch (error) {
        console.error("Error checking founder status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFounderStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user?.user_metadata?.is_founder) {
        setIsFounder(true);
      } else {
        setIsFounder(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isFounder, isLoading };
}
