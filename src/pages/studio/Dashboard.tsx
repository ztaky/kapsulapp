import { useParams } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, BookOpen, TrendingUp, LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass: string;
}

export default function StudioDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const { organizations } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);

  const { data: stats, isLoading, refetch } = useQuery({
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

  // Real-time subscriptions
  useEffect(() => {
    if (!currentOrg?.id) return;

    const coursesChannel = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `organization_id=eq.${currentOrg.id}`
        },
        () => refetch()
      )
      .subscribe();

    const membersChannel = supabase
      .channel('members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_members',
          filter: `organization_id=eq.${currentOrg.id}`
        },
        () => refetch()
      )
      .subscribe();

    const purchasesChannel = supabase
      .channel('purchases-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchases'
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(coursesChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(purchasesChannel);
    };
  }, [currentOrg?.id, refetch]);

  const StatCard = ({ title, value, description, icon: Icon, colorClass }: StatCardProps) => (
    <Card className={cn(
      "relative overflow-hidden group hover:shadow-elevated transition-all duration-300",
      "border-l-4",
      colorClass
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 -mr-8 -mt-8">
        <Icon className="w-full h-full" />
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-lg",
          colorClass.replace("border-l-", "bg-").replace("/50", "/10")
        )}>
          <Icon className={cn(
            "h-5 w-5",
            colorClass.replace("border-l-", "text-")
          )} />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-3xl font-bold tracking-tight mb-1">
          {value}
        </div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  const statCards = [
    {
      title: "Formations",
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      description: "Total de formations créées",
      colorClass: "border-l-primary/50",
    },
    {
      title: "Étudiants",
      value: stats?.totalStudents || 0,
      icon: Users,
      description: "Membres de votre communauté",
      colorClass: "border-l-blue-500/50",
    },
    {
      title: "Revenus",
      value: `${stats?.totalRevenue || 0} €`,
      icon: DollarSign,
      description: "Chiffre d'affaires total",
      colorClass: "border-l-green-500/50",
    },
    {
      title: "Ventes",
      value: stats?.totalPurchases || 0,
      icon: TrendingUp,
      description: "Nombre total d'achats",
      colorClass: "border-l-purple-500/50",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">Vue d'ensemble</h2>
          <p className="text-muted-foreground text-lg">
            Tableau de bord de votre école <span className="text-primary font-medium">{currentOrg?.name}</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-l-4 border-l-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight">Vue d'ensemble</h2>
        <p className="text-muted-foreground text-lg">
          Tableau de bord de votre école <span className="text-primary font-medium">{currentOrg?.name}</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="mt-12 p-8 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 rounded-2xl border border-primary/10">
        <h3 className="text-2xl font-bold mb-4">Actions rapides</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <button className="p-4 bg-card rounded-xl border hover:shadow-card transition-all text-left group">
            <BookOpen className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-semibold mb-1">Créer une formation</div>
            <div className="text-sm text-muted-foreground">Démarrez une nouvelle formation</div>
          </button>
          
          <button className="p-4 bg-card rounded-xl border hover:shadow-card transition-all text-left group">
            <Users className="h-6 w-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-semibold mb-1">Inviter des étudiants</div>
            <div className="text-sm text-muted-foreground">Agrandissez votre communauté</div>
          </button>
          
          <button className="p-4 bg-card rounded-xl border hover:shadow-card transition-all text-left group">
            <TrendingUp className="h-6 w-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-semibold mb-1">Voir les analyses</div>
            <div className="text-sm text-muted-foreground">Suivez vos performances</div>
          </button>
        </div>
      </div>
    </div>
  );
}
