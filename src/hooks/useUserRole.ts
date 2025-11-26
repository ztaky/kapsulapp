import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "user";
export type OrgRole = "coach" | "student";

export const useUserRole = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    setIsSuperAdmin(!!data);
    setLoading(false);
  };

  return { isSuperAdmin, loading };
};

export const useOrganizationRole = (organizationId?: string) => {
  const [role, setRole] = useState<OrgRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
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

  return { organizations, loading, refetch: fetchOrganizations };
};
