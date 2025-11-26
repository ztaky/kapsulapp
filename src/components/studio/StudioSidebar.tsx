import { LayoutDashboard, GraduationCap, Users, Palette, Bot, Wand2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
    title: "Branding",
    url: "/branding",
    icon: Palette,
  },
];

export function StudioSidebar({ organization }: StudioSidebarProps) {
  const { open } = useSidebar();
  const baseUrl = `/school/${organization.slug}/studio`;

  return (
    <Sidebar className={`${open ? "w-64" : "w-14"} bg-no-grid border-slate-200`} collapsible="icon">
      <SidebarTrigger className="m-2 self-end text-slate-600 hover:text-slate-900" />

      <SidebarContent className="bg-no-grid">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-semibold">Studio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${baseUrl}${item.url}`}
                      end={item.url === ""}
                      className="text-slate-600 hover:bg-orange-50/50 hover:text-primary rounded-xl transition-all"
                      activeClassName="bg-gradient-to-r from-orange-100/80 to-pink-100/50 text-primary font-semibold border-l-4 border-l-primary"
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
