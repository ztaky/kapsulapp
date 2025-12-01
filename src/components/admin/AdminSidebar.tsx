import { 
  LayoutDashboard, 
  Building2, 
  Crown, 
  Sparkles,
  GraduationCap, 
  Users,
  UserCheck,
  DollarSign, 
  BookOpen, 
  Settings, 
  LogOut,
  ScrollText,
  MessageCircleQuestion,
  HelpCircle,
  Mail,
  Map,
  CreditCard,
  BarChart3,
  Wallet,
  UserRoundSearch
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
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Paiements",
    url: "/payments",
    icon: Wallet,
  },
  {
    title: "Académies",
    url: "/academies",
    icon: Building2,
  },
  {
    title: "Founders",
    url: "/founders",
    icon: Sparkles,
  },
  {
    title: "Super Admins",
    url: "/super-admins",
    icon: Crown,
  },
  {
    title: "Utilisateurs",
    url: "/users",
    icon: Users,
  },
  {
    title: "Coachs",
    url: "/coaches",
    icon: GraduationCap,
  },
  {
    title: "Étudiants",
    url: "/students",
    icon: UserCheck,
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
    title: "Leads Sales",
    url: "/leads",
    icon: UserRoundSearch,
  },
  {
    title: "Emails",
    url: "/emails",
    icon: Mail,
  },
  {
    title: "Roadmap",
    url: "/roadmap",
    icon: Map,
  },
  {
    title: "Pricing",
    url: "/pricing",
    icon: CreditCard,
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
      className={`${open ? "w-64" : "w-14"} bg-white border-r border-slate-100`} 
      collapsible="icon"
    >
      <SidebarTrigger className="m-4 self-end text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg" />

      <SidebarContent className="bg-transparent px-3 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
            Administration
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
