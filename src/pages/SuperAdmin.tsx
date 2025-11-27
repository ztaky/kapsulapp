import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, DollarSign, GraduationCap, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalRevenue: 0,
    totalStudents: 0,
    totalCourses: 0,
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: "",
    slug: "",
    ownerEmail: "",
  });

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      navigate("/");
      toast.error("Accès non autorisé");
    } else if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin, roleLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch organizations with owner details
    const { data: orgsData, error: orgsError } = await supabase
      .from("organizations")
      .select(`
        *,
        organization_members!inner(
          user_id,
          role,
          created_at,
          profiles(email, full_name)
        ),
        courses(id)
      `)
      .eq("organization_members.role", "coach")
      .order("created_at", { ascending: false });

    if (orgsError) {
      console.error("Error fetching organizations:", orgsError);
    }

    // Process organizations to get the first coach as owner
    const processedOrgs = orgsData?.map((org: any) => ({
      ...org,
      owner_email: org.organization_members[0]?.profiles?.email || "N/A",
      owner_name: org.organization_members[0]?.profiles?.full_name || "N/A",
      courses_count: org.courses?.length || 0,
    })) || [];

    setOrganizations(processedOrgs);

    // Fetch stats
    const { data: purchases } = await supabase
      .from("purchases")
      .select("amount");

    const { count: studentsCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    const { count: coursesCount } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });

    setStats({
      totalOrgs: orgsData?.length || 0,
      totalRevenue: purchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      totalStudents: studentsCount || 0,
      totalCourses: coursesCount || 0,
    });

    setLoading(false);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: newOrg.name,
          slug: newOrg.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Find or create owner profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newOrg.ownerEmail)
        .maybeSingle();

      if (profile) {
        // Add coach to organization
        await supabase.from("organization_members").insert({
          organization_id: org.id,
          user_id: profile.id,
          role: "coach",
        });
      }

      toast.success("Organisation créée avec succès");
      setCreateDialogOpen(false);
      setNewOrg({ name: "", slug: "", ownerEmail: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  if (roleLoading || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Super Administration</h1>
            <p className="text-muted-foreground">Gérez toutes les organisations</p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-[hsl(340,85%,55%)] hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Créer une École
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle organisation</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle école pour un formateur
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrg}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom de l'école</Label>
                    <Input
                      id="name"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                      placeholder="Zahed Academy"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={newOrg.slug}
                      onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                      placeholder="zahed-academy"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner">Email du propriétaire</Label>
                    <Input
                      id="owner"
                      type="email"
                      value={newOrg.ownerEmail}
                      onChange={(e) => setNewOrg({ ...newOrg, ownerEmail: e.target.value })}
                      placeholder="owner@example.com"
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Création..." : "Créer l'organisation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-20 bg-muted" />
                <CardContent className="h-16 bg-muted/50" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                title="Académies"
                value={stats.totalOrgs}
                icon={Building2}
                description="Académies créées sur Kapsul"
              />
              <StatCard
                title="Revenus"
                value={`${stats.totalRevenue.toFixed(2)}€`}
                icon={DollarSign}
                description="Total des ventes"
              />
              <StatCard
                title="Étudiants"
                value={stats.totalStudents}
                icon={GraduationCap}
                description="Apprenants inscrits"
              />
              <StatCard
                title="Formations"
                value={stats.totalCourses}
                icon={TrendingUp}
                description="Cours publiés"
              />
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Académies Kapsul
                </CardTitle>
                <CardDescription>
                  Toutes les académies créées sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-gray-500">
                        <th className="pb-3 font-medium">Académie</th>
                        <th className="pb-3 font-medium">Propriétaire</th>
                        <th className="pb-3 font-medium">Créée le</th>
                        <th className="pb-3 font-medium">Formations</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizations.map((org: any) => (
                        <tr key={org.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-4">
                            <div>
                              <p className="font-semibold">{org.name}</p>
                              <p className="text-sm text-gray-500">/{org.slug}</p>
                            </div>
                          </td>
                          <td className="py-4">
                            <div>
                              <p className="text-sm font-medium">{org.owner_name}</p>
                              <p className="text-xs text-gray-500">{org.owner_email}</p>
                            </div>
                          </td>
                          <td className="py-4 text-sm">
                            {new Date(org.created_at).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {org.courses_count} cours
                            </span>
                          </td>
                          <td className="py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/school/${org.slug}/studio`)}
                            >
                              Voir
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default SuperAdmin;
