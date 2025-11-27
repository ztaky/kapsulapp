import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Crown, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface SuperAdmin {
  id: string;
  user_id: string;
  created_at: string;
  profile: {
    email: string;
    full_name: string | null;
  };
}

const AdminSuperAdmins = () => {
  const [loading, setLoading] = useState(true);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    fetchSuperAdmins();
  }, []);

  const fetchSuperAdmins = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        id,
        user_id,
        created_at,
        profiles!inner(email, full_name)
      `)
      .eq("role", "super_admin");

    if (error) {
      console.error("Error fetching super admins:", error);
      toast.error("Erreur lors du chargement des super admins");
    }

    const processed = data?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      created_at: item.created_at,
      profile: {
        email: item.profiles.email,
        full_name: item.profiles.full_name,
      },
    })) || [];

    setSuperAdmins(processed);
    setLoading(false);
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoting(true);

    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", promoteEmail)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error("Utilisateur non trouvé avec cet email");
      }

      // Check if already super admin
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (existing) {
        throw new Error("Cet utilisateur est déjà super admin");
      }

      // Add super admin role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profile.id,
          role: "super_admin",
        });

      if (insertError) throw insertError;

      toast.success("Utilisateur promu super admin");
      setPromoteDialogOpen(false);
      setPromoteEmail("");
      fetchSuperAdmins();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPromoting(false);
    }
  };

  const handleRevoke = async (roleId: string, email: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir révoquer les droits de ${email} ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast.success("Droits super admin révoqués");
      fetchSuperAdmins();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredAdmins = superAdmins.filter(admin =>
    admin.profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (admin.profile.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Super Admins</h1>
          <p className="text-slate-400">Gérez les administrateurs de la plateforme</p>
        </div>

        <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Promouvoir
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Promouvoir un super admin</DialogTitle>
              <DialogDescription className="text-slate-400">
                Entrez l'email de l'utilisateur à promouvoir
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePromote}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-slate-300">Email de l'utilisateur</Label>
                  <Input
                    id="email"
                    type="email"
                    value={promoteEmail}
                    onChange={(e) => setPromoteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={promoting} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  {promoting ? "Promotion..." : "Promouvoir"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Rechercher un super admin..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 bg-slate-800 mb-2" />
                <Skeleton className="h-4 w-32 bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-500" />
              {filteredAdmins.length} super admin{filteredAdmins.length !== 1 && "s"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-slate-500">
                    <th className="pb-3 font-medium">Utilisateur</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Promu le</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {admin.profile.full_name?.charAt(0).toUpperCase() || admin.profile.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="font-semibold text-white">{admin.profile.full_name || "Sans nom"}</p>
                        </div>
                      </td>
                      <td className="py-4 text-slate-400">{admin.profile.email}</td>
                      <td className="py-4 text-sm text-slate-400">
                        {new Date(admin.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(admin.id, admin.profile.email)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Révoquer
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredAdmins.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        Aucun super admin trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSuperAdmins;
