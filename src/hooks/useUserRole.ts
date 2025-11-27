import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "user";
export type OrgRole = "coach" | "student";

export const useUserRole = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    const checkRole = async (userId: string | undefined) => {
      if (!userId) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "super_admin")
        .maybeSingle();

      setIsSuperAdmin(!!data);
      setLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkRole(session?.user?.id);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      checkRole(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isSuperAdmin, loading };
};

export const useOrganizationRole = (organizationId?: string) => {
  const [role, setRole] = useState<OrgRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep loading true if organizationId is undefined (not yet available)
    if (organizationId === undefined) {
      return;
    }
    
    // Only set loading false if organizationId is explicitly null or empty string
    if (!organizationId) {
      setRole(null);
      setLoading(false);
      return;
    }
    
    checkOrgRole();
  }, [organizationId]);

  const checkOrgRole = async () => {
    if (!organizationId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setRole(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    setRole(data?.role || null);
    setLoading(false);
  };

  const isCoach = role === "coach";
  const isStudent = role === "student";

  return { role, isCoach, isStudent, loading };
};

export const useUserOrganizations = () => {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setOrganizations([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("organization_members")
      .select(`
        role,
        organizations (
          id,
          name,
          slug,
          logo_url,
          brand_color
        )
      `)
      .eq("user_id", session.user.id);

    setOrganizations(data?.map((m: any) => ({
      ...m.organizations,
      userRole: m.role
    })) || []);
    setLoading(false);
  };

  const currentOrg = organizations.length > 0 ? organizations[0] : null;

  return { organizations, currentOrg, loading, refetch: fetchOrganizations };
};
