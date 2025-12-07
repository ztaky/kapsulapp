import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CoachPublicFooter } from "@/components/shared/CoachPublicFooter";
import { useQuery } from "@tanstack/react-query";

interface StudentOrganization {
  id: string;
  name: string;
  slug: string;
}

export default function StudentLayout() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
      setLoading(false);
    });
  }, []);

  // Fetch organizations from student's enrolled courses
  const { data: organizations = [] } = useQuery({
    queryKey: ["student-organizations", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get organizations from course enrollments
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select(`
          course:courses(
            organization:organizations(id, name, slug)
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true);

      if (!enrollments) return [];

      // Extract unique organizations
      const orgMap = new Map<string, StudentOrganization>();
      enrollments.forEach((enrollment: any) => {
        const org = enrollment.course?.organization;
        if (org && !orgMap.has(org.id)) {
          orgMap.set(org.id, { id: org.id, name: org.name, slug: org.slug });
        }
      });

      return Array.from(orgMap.values());
    },
    enabled: !!userId,
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <StudentSidebar />
        
        <main className="flex-1 flex flex-col bg-transparent overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/95 backdrop-blur-sm shadow-sm shrink-0">
            <div className="flex h-16 items-center justify-between px-8">
              <div>
                <p className="text-xs font-medium text-slate-500 tracking-wide uppercase">Espace Étudiant</p>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">Mon Espace d'Apprentissage</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <Outlet />
          </div>

          <footer className="shrink-0 border-t border-border/40 bg-background/50 py-3 px-8">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {organizations.length > 0 ? (
                organizations.map((org) => (
                  <CoachPublicFooter 
                    key={org.id} 
                    variant="compact" 
                    organizationSlug={org.slug}
                    organizationName={organizations.length > 1 ? org.name : undefined}
                  />
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  Inscrivez-vous à une formation pour voir les informations légales
                </span>
              )}
            </div>
          </footer>
        </main>
        <SupportChatWidget />
      </div>
    </SidebarProvider>
  );
}