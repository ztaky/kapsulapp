import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { organizations, loading: orgsLoading } = useUserOrganizations();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  // Redirect coaches to their studio, students to student dashboard
  useEffect(() => {
    if (!orgsLoading && organizations.length > 0) {
      const coachOrg = organizations.find(org => org.userRole === 'coach');
      if (coachOrg) {
        navigate(`/school/${coachOrg.slug}/studio`);
      } else {
        navigate("/student");
      }
    } else if (!orgsLoading) {
      // No organizations, must be a student
      navigate("/student");
    }
  }, [organizations, orgsLoading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Dashboard;
