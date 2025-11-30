import { 
  LayoutDashboard, 
  Building2, 
  Crown, 
  GraduationCap, 
  Users, 
  DollarSign, 
  BookOpen, 
  Settings, 
  LogOut,
  ScrollText,
  MessageCircleQuestion,
  HelpCircle
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Vue d'ensemble",
    url: "",
    icon: LayoutDashboard,
  },
  {
    title: "Académies",
    url: "/academies",
    icon: Building2,
  },
  {
    title: "Super Admins",
    url: "/super-admins",
    icon: Crown,
  },
  {
    title: "Coachs",
    url: "/coaches",
    icon: GraduationCap,
  },
  {
    title: "Étudiants",
    url: "/students",
    icon: Users,
  },
  {
    title: "Revenus",
    url: "/revenue",
    icon: DollarSign,
  },
  {
    title: "Formations",
    url: "/courses",
    icon: BookOpen,
  },
  {
    title: "Logs d'activité",
    url: "/logs",
    icon: ScrollText,
  },
  {
    title: "Tickets Support",
    url: "/support",
    icon: MessageCircleQuestion,
  },
  {
    title: "FAQ",
    url: "/faq",
    icon: HelpCircle,
  },
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const baseUrl = "/admin";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  return (
    <Sidebar 
      className={`${open ? "w-64" : "w-14"} bg-white border-r border-slate-200/60`} 
      collapsible="icon"
    >
      <SidebarTrigger className="m-3 self-end text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg" />

      <SidebarContent className="bg-transparent px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink
                      to={`${baseUrl}${item.url}`}
                      end={item.url === ""}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-all"
                      activeClassName="bg-primary/10 text-primary font-semibold"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {open && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-100">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className={`w-full justify-start gap-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all ${!open ? 'px-2' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {open && <span className="text-sm font-medium">Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
