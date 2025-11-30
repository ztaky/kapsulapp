import { BookOpen, User, Receipt, Award, Bot, LogOut, MessageCircleQuestion } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Mes Formations",
    url: "/student",
    icon: BookOpen,
  },
  {
    title: "Mon Profil",
    url: "/student/profile",
    icon: User,
  },
  {
    title: "Mes Factures",
    url: "/student/invoices",
    icon: Receipt,
  },
  {
    title: "Mes Certificats",
    url: "/student/certificates",
    icon: Award,
  },
  {
    title: "Assistant IA",
    url: "/student/assistant",
    icon: Bot,
  },
  {
    title: "Support",
    url: "/student/support",
    icon: MessageCircleQuestion,
  },
];

export function StudentSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  return (
    <Sidebar 
      className={`${open ? "w-64" : "w-14"} bg-white border-r border-slate-100`} 
      collapsible="icon"
    >
      <SidebarHeader className="flex flex-row items-center justify-between p-3 border-b border-slate-100">
        {open && <NotificationBell variant="light" />}
        <SidebarTrigger className="text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg" />
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Espace Étudiant
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink
                      to={item.url}
                      end={item.url === "/student"}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-all"
                      activeClassName="bg-orange-50 text-orange-700 font-bold"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50/80 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-slate-500" />
                      </div>
                      {open && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-200">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className={`w-full justify-start gap-3 rounded-xl border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all ${!open ? 'px-2' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {open && <span className="text-sm font-medium">Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
