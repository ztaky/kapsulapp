import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, BookOpen, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    totalCourses: 0,
    recentEnrollments: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error || data?.role !== "admin") {
            navigate("/dashboard");
          } else {
            fetchStats();
          }
        });
    });
  }, [navigate]);

  const fetchStats = async () => {
    setLoading(true);

    // Fetch total students
    const { count: studentsCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    // Fetch total revenue
    const { data: purchases } = await supabase
      .from("purchases")
      .select("amount");

    const totalRevenue = purchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Fetch total courses
    const { count: coursesCount } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });

    // Fetch recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentCount } = await supabase
      .from("purchases")
      .select("*", { count: "exact", head: true })
      .gte("purchased_at", thirtyDaysAgo.toISOString());

    setStats({
      totalStudents: studentsCount || 0,
      totalRevenue,
      totalCourses: coursesCount || 0,
      recentEnrollments: recentCount || 0,
    });

    setLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Administration</h1>
          <p className="text-muted-foreground">Gérez votre plateforme LMS</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="courses">Formations</TabsTrigger>
            <TabsTrigger value="students">Étudiants</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Étudiants"
                  value={stats.totalStudents}
                  icon={Users}
                  description="Total inscrits"
                />
                <StatCard
                  title="Revenus"
                  value={`€${stats.totalRevenue.toFixed(2)}`}
                  icon={DollarSign}
                  description="Revenus totaux"
                />
                <StatCard
                  title="Formations"
                  value={stats.totalCourses}
                  icon={BookOpen}
                  description="Total de formations"
                />
                <StatCard
                  title="Inscriptions récentes"
                  value={stats.recentEnrollments}
                  icon={TrendingUp}
                  description="30 derniers jours"
                />
              </div>
            )}

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Statistiques d'engagement</CardTitle>
                <CardDescription>Aperçu de l'activité de la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Graphiques à venir prochainement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Gestion des formations</CardTitle>
                <CardDescription>Créer et gérer vos formations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Module CMS à venir prochainement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Gestion des étudiants</CardTitle>
                <CardDescription>Voir et gérer les utilisateurs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Module de gestion des utilisateurs à venir prochainement...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
