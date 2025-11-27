import { LayoutDashboard, GraduationCap, Users, Palette, Bot, Wand2, LogOut, Sparkles } from "lucide-react";
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
    url: "/sales-pages",
    icon: Wand2,
  },
  {
    title: "Landing Pages",
    url: "/landing-pages",
    icon: Sparkles,
  },
  {
    title: "Branding",
    url: "/branding",
    icon: Palette,
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
      className={`${open ? "w-64" : "w-14"} bg-white border-r border-slate-200/60`} 
      collapsible="icon"
    >
      <SidebarTrigger className="m-3 self-end text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg" />

      <SidebarContent className="bg-transparent px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Studio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink
                      to={`${baseUrl}${item.url}`}
                      end={item.url === ""}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-all"
                      activeClassName="bg-orange-50 text-orange-700 font-bold"
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
