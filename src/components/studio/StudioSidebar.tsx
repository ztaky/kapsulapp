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
    <Sidebar className={open ? "w-64" : "w-14"} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Studio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${baseUrl}${item.url}`}
                      end={item.url === ""}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
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
