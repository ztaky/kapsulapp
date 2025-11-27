import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrganizations, useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { organizations, loading: orgsLoading } = useUserOrganizations();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  // Redirect based on role: super_admin → /super-admin, coach → studio, student → student
  useEffect(() => {
    if (roleLoading || orgsLoading) return;

    if (isSuperAdmin) {
      navigate("/super-admin");
      return;
    }

    if (organizations.length > 0) {
      const coachOrg = organizations.find(org => org.userRole === 'coach');
      if (coachOrg) {
        navigate(`/school/${coachOrg.slug}/studio`);
      } else {
        navigate("/student");
      }
    } else {
      navigate("/student");
    }
  }, [isSuperAdmin, roleLoading, organizations, orgsLoading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Dashboard;
