import { Navigate, Outlet, useParams } from "react-router-dom";
import { useOrganizationRole, useUserOrganizations } from "@/hooks/useUserRole";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function StudioLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { organizations, loading: orgsLoading } = useUserOrganizations();
  
  const currentOrg = organizations.find((org) => org.slug === slug);
  const { isCoach, loading: roleLoading } = useOrganizationRole(currentOrg?.id);

  // Wait for organizations to load first
  if (orgsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no matching organization found, redirect
  if (!currentOrg) {
    return <Navigate to="/dashboard" replace />;
  }

  // Wait for role check to complete
  if (roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not a coach, redirect
  if (!isCoach) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <StudioSidebar organization={currentOrg} />
        
        <main className="flex-1 bg-no-grid">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
            <div className="flex h-16 items-center justify-between px-6">
              <div>
                <p className="text-sm font-medium text-slate-600">Instructor Studio</p>
                <h1 className="text-lg font-bold text-slate-900">{currentOrg.name}</h1>
              </div>
              
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <a href={`/school/${currentOrg.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Voir l'école
                </a>
              </Button>
            </div>
          </header>

          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
