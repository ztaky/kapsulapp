import { useParams } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, BookOpen, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function StudioDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const { organizations } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);

  const { data: stats } = useQuery({
    queryKey: ["studio-stats", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;

      // Get organization courses
      const { data: orgCourses } = await supabase
        .from("courses")
        .select("id")
        .eq("organization_id", currentOrg.id);

      const courseIds = orgCourses?.map((c) => c.id) || [];

      const [coursesRes, studentsRes, purchasesRes] = await Promise.all([
        supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrg.id),
        supabase
          .from("organization_members")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", currentOrg.id)
          .eq("role", "student"),
        courseIds.length > 0
          ? supabase
              .from("purchases")
              .select("amount")
              .in("course_id", courseIds)
          : { data: [], error: null },
      ]);

      let totalRevenue = 0;
      if (purchasesRes.data) {
        for (const purchase of purchasesRes.data) {
          totalRevenue += Number(purchase.amount);
        }
      }

      return {
        totalCourses: coursesRes.count || 0,
        totalStudents: studentsRes.count || 0,
        totalRevenue,
        totalPurchases: purchasesRes.data?.length || 0,
      };
    },
    enabled: !!currentOrg?.id,
  });

  const statCards = [
    {
      title: "Formations",
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      description: "Total de formations créées",
    },
    {
      title: "Étudiants",
      value: stats?.totalStudents || 0,
      icon: Users,
      description: "Membres de votre communauté",
    },
    {
      title: "Revenus",
      value: `${stats?.totalRevenue || 0} €`,
      icon: DollarSign,
      description: "Chiffre d'affaires total",
    },
    {
      title: "Ventes",
      value: stats?.totalPurchases || 0,
      icon: TrendingUp,
      description: "Nombre total d'achats",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h2>
        <p className="text-muted-foreground">
          Tableau de bord de votre école {currentOrg?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
