import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const AdminAcademies = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: "",
    slug: "",
    ownerEmail: "",
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);

    const { data: orgsData, error } = await supabase
      .from("organizations")
      .select(`
        *,
        organization_members!inner(
          user_id,
          role,
          profiles(email, full_name)
        ),
        courses(id)
      `)
      .eq("organization_members.role", "coach")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Erreur lors du chargement des académies");
    }

    const processedOrgs = orgsData?.map((org: any) => ({
      ...org,
      owner_email: org.organization_members[0]?.profiles?.email || "N/A",
      owner_name: org.organization_members[0]?.profiles?.full_name || "N/A",
      courses_count: org.courses?.length || 0,
    })) || [];

    setOrganizations(processedOrgs);
    setLoading(false);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: newOrg.name,
          slug: newOrg.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        })
        .select()
        .single();

      if (orgError) throw orgError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newOrg.ownerEmail)
        .maybeSingle();

      if (profile) {
        await supabase.from("organization_members").insert({
          organization_id: org.id,
          user_id: profile.id,
          role: "coach",
        });
      }

      toast.success("Académie créée avec succès");
      setCreateDialogOpen(false);
      setNewOrg({ name: "", slug: "", ownerEmail: "" });
      fetchOrganizations();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Académies</h1>
          <p className="text-slate-400">Gérez toutes les académies de la plateforme</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-600 to-pink-600 hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Créer une académie
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Créer une nouvelle académie</DialogTitle>
              <DialogDescription className="text-slate-400">
                Créez une nouvelle école pour un formateur
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrg}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Nom de l'académie</Label>
                  <Input
                    id="name"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    placeholder="Zahed Academy"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug" className="text-slate-300">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={newOrg.slug}
                    onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                    placeholder="zahed-academy"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="owner" className="text-slate-300">Email du propriétaire</Label>
                  <Input
                    id="owner"
                    type="email"
                    value={newOrg.ownerEmail}
                    onChange={(e) => setNewOrg({ ...newOrg, ownerEmail: e.target.value })}
                    placeholder="owner@example.com"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-orange-600 to-pink-600">
                  {loading ? "Création..." : "Créer l'académie"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Rechercher une académie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
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
              <Building2 className="h-5 w-5" />
              {filteredOrgs.length} académie{filteredOrgs.length !== 1 && "s"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-slate-500">
                    <th className="pb-3 font-medium">Académie</th>
                    <th className="pb-3 font-medium">Propriétaire</th>
                    <th className="pb-3 font-medium">Créée le</th>
                    <th className="pb-3 font-medium">Formations</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrgs.map((org) => (
                    <tr key={org.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="py-4">
                        <div>
                          <p className="font-semibold text-white">{org.name}</p>
                          <p className="text-sm text-slate-500">/{org.slug}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-300">{org.owner_name}</p>
                          <p className="text-xs text-slate-500">{org.owner_email}</p>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-slate-400">
                        {new Date(org.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                          {org.courses_count} cours
                        </span>
                      </td>
                      <td className="py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/school/${org.slug}/studio`)}
                          className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrgs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Aucune académie trouvée
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

export default AdminAcademies;
