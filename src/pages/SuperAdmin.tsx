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

    // Fetch organizations
    const { data: orgsData } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    setOrganizations(orgsData || []);

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
                title="Organisations"
                value={stats.totalOrgs}
                icon={Building2}
                description="Total d'écoles"
              />
              <StatCard
                title="Revenus Globaux"
                value={`€${stats.totalRevenue.toFixed(2)}`}
                icon={DollarSign}
                description="Toutes écoles confondues"
              />
              <StatCard
                title="Étudiants"
                value={stats.totalStudents}
                icon={GraduationCap}
                description="Total inscrits"
              />
              <StatCard
                title="Formations"
                value={stats.totalCourses}
                icon={TrendingUp}
                description="Total de cours"
              />
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Liste des Organisations</CardTitle>
                <CardDescription>Gérez toutes les écoles de la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="h-10 w-10 rounded" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{org.name}</h3>
                          <p className="text-sm text-muted-foreground">/{org.slug}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/school/${org.slug}/admin`)}
                      >
                        Voir l'école
                      </Button>
                    </div>
                  ))}
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
