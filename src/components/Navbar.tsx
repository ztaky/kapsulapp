import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, BookOpen, LayoutDashboard, Settings, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useUserRole, useUserOrganizations } from "@/hooks/useUserRole";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const Navbar = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any>(null);
  const { isSuperAdmin } = useUserRole();
  const { organizations } = useUserOrganizations();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const hasSchoolAccess = organizations.some(org => 
    org.userRole === "owner" || org.userRole === "admin"
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-orange-600" />
            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent tracking-tight">
              LMS Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-orange-50">
                  <Avatar className="border-2 border-orange-200">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                      {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-2xl border-slate-200 shadow-premium" align="end">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{profile?.full_name || "Utilisateur"}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="mx-1 rounded-lg hover:bg-orange-50 cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Mes Formations</span>
                </DropdownMenuItem>
                {hasSchoolAccess && (
                  <DropdownMenuItem onClick={() => {
                    const firstOrg = organizations.find(o => o.userRole === "owner" || o.userRole === "admin");
                    if (firstOrg) navigate(`/school/${firstOrg.slug}/admin`);
                  }} className="mx-1 rounded-lg hover:bg-orange-50 cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Mon École</span>
                  </DropdownMenuItem>
                )}
                {isSuperAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/super-admin")} className="mx-1 rounded-lg hover:bg-orange-50 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Super Admin</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={handleSignOut} className="mx-1 mb-1 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="text-sm font-semibold">Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={() => navigate("/auth")}
              variant="gradient"
              className="shadow-lg"
            >
              Se connecter
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
