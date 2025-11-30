import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrganizations, useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { organizations, loading: orgsLoading, refetch } = useUserOrganizations();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [settingUpAcademy, setSettingUpAcademy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  // Handle academy setup after Google OAuth
  useEffect(() => {
    const setupAcademy = searchParams.get("setup_academy");
    const pendingAcademyName = localStorage.getItem("pending_academy_name");
    
    if (setupAcademy === "true" && pendingAcademyName && !settingUpAcademy) {
      setSettingUpAcademy(true);
      
      const createAcademy = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Utilisateur non connecté");
          
          // Generate unique slug
          const baseSlug = pendingAcademyName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          let slug = baseSlug;
          let counter = 1;

          while (true) {
            const { data } = await supabase
              .from("organizations")
              .select("slug")
              .eq("slug", slug)
              .single();

            if (!data) break;
            slug = `${baseSlug}-${counter}`;
            counter++;
          }

          // Create organization
          const { error: orgError } = await supabase.functions.invoke(
            "create-coach-academy",
            {
              body: {
                academyName: pendingAcademyName,
                slug,
                userId: user.id,
              },
            }
          );

          if (orgError) throw orgError;

          localStorage.removeItem("pending_academy_name");
          toast.success("🎉 Votre académie a été créée avec succès !");
          navigate(`/school/${slug}/studio`);
        } catch (error: any) {
          console.error("Error creating academy:", error);
          toast.error("Erreur lors de la création de l'académie");
          localStorage.removeItem("pending_academy_name");
          setSettingUpAcademy(false);
          // Refetch organizations to redirect properly
          await refetch();
        }
      };

      createAcademy();
    }
  }, [searchParams, settingUpAcademy, navigate, refetch]);

  // Redirect based on role: super_admin → /super-admin, coach → studio, student → student
  useEffect(() => {
    if (roleLoading || orgsLoading || settingUpAcademy) return;

    // Don't redirect if we're setting up academy
    const setupAcademy = searchParams.get("setup_academy");
    const pendingAcademyName = localStorage.getItem("pending_academy_name");
    if (setupAcademy === "true" && pendingAcademyName) return;

    if (isSuperAdmin) {
      navigate("/admin");
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
  }, [isSuperAdmin, roleLoading, organizations, orgsLoading, navigate, settingUpAcademy, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {settingUpAcademy && (
        <p className="text-muted-foreground">Création de votre académie...</p>
      )}
    </div>
  );
};

export default Dashboard;
