import { LayoutDashboard, GraduationCap, Users, Palette, Bot, LogOut, Sparkles, MessageCircleQuestion, Scale } from "lucide-react";
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

interface StudioSidebarProps {
  organization: {
    slug: string;
    name: string;
    logo_url?: string;
  };
}

const navItems = [
  {
    title: "Vue d'ensemble",
    url: "",
    icon: LayoutDashboard,
  },
  {
    title: "Mes Formations",
    url: "/courses",
    icon: GraduationCap,
  },
  {
    title: "Communauté",
    url: "/students",
    icon: Users,
  },
  {
    title: "Assistant IA",
    url: "/assistant",
    icon: Bot,
  },
  {
    title: "Pages de vente",
    url: "/landing-pages",
    icon: Sparkles,
  },
  {
    title: "Pages légales",
    url: "/legal",
    icon: Scale,
  },
  {
    title: "Paramètres",
    url: "/branding",
    icon: Palette,
  },
  {
    title: "Support",
    url: "/support",
    icon: MessageCircleQuestion,
  },
];

export function StudioSidebar({ organization }: StudioSidebarProps) {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const baseUrl = `/school/${organization.slug}/studio`;

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
      <SidebarHeader className="flex flex-row items-center justify-between p-4 border-b border-slate-100">
        {open && <NotificationBell variant="light" />}
        <SidebarTrigger className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg" />
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
            Studio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink
                      to={`${baseUrl}${item.url}`}
                      end={item.url === ""}
                      className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-all"
                      activeClassName="bg-primary/5 text-primary font-semibold"
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

      <SidebarFooter className="p-4 border-t border-slate-100">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className={`w-full justify-start gap-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all ${!open ? 'px-2' : ''}`}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          {open && <span className="text-[13px] font-medium">Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
