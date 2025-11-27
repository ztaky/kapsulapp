import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function StudentLayout() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });
  }, []);

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
        </main>
        <SupportChatWidget />
      </div>
    </SidebarProvider>
  );
}
