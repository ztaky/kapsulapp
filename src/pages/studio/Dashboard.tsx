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
  iconBgClass: string;
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

  const StatCard = ({ title, value, description, icon: Icon, colorClass, iconBgClass }: StatCardProps & { iconBgClass: string }) => (
    <Card className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl shadow-premium hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-slate-600 tracking-tight">
          {title}
        </CardTitle>
        <div className={cn(
          "rounded-2xl p-3 w-12 h-12 flex items-center justify-center",
          iconBgClass
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="text-4xl font-bold tracking-tight mb-1 text-slate-900">
          {value}
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
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
      colorClass: "text-orange-600",
      iconBgClass: "bg-orange-100 text-orange-600",
    },
    {
      title: "Étudiants",
      value: stats?.totalStudents || 0,
      icon: Users,
      description: "Membres de votre communauté",
      colorClass: "text-blue-600",
      iconBgClass: "bg-blue-100 text-blue-600",
    },
    {
      title: "Revenus",
      value: `${stats?.totalRevenue || 0} €`,
      icon: DollarSign,
      description: "Chiffre d'affaires total",
      colorClass: "text-green-600",
      iconBgClass: "bg-green-100 text-green-600",
    },
    {
      title: "Ventes",
      value: stats?.totalPurchases || 0,
      icon: TrendingUp,
      description: "Nombre total d'achats",
      colorClass: "text-purple-600",
      iconBgClass: "bg-purple-100 text-purple-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
          <Skeleton className="h-12 w-80 mb-3" />
          <Skeleton className="h-6 w-96" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white border border-slate-100 rounded-3xl shadow-premium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-12 rounded-2xl" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 text-[#1e293b] tracking-tight">
            Vue d'ensemble
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Tableau de bord de votre école <span className="font-semibold text-orange-600">{currentOrg?.name}</span>
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-8 border border-slate-100 shadow-premium">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6 text-[#1e293b] tracking-tight">Actions rapides</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <button className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/30 rounded-2xl border border-orange-100 hover:shadow-lg transition-all text-left group">
              <div className="rounded-2xl bg-orange-100 text-orange-600 p-3 w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="font-bold text-slate-900 mb-2 tracking-tight">Créer une formation</div>
              <div className="text-sm text-slate-500 leading-relaxed">Démarrez une nouvelle formation</div>
            </button>
            
            <button className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl border border-blue-100 hover:shadow-lg transition-all text-left group">
              <div className="rounded-2xl bg-blue-100 text-blue-600 p-3 w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div className="font-bold text-slate-900 mb-2 tracking-tight">Inviter des étudiants</div>
              <div className="text-sm text-slate-500 leading-relaxed">Agrandissez votre communauté</div>
            </button>
            
            <button className="p-6 bg-gradient-to-br from-green-50 to-green-100/30 rounded-2xl border border-green-100 hover:shadow-lg transition-all text-left group">
              <div className="rounded-2xl bg-green-100 text-green-600 p-3 w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="font-bold text-slate-900 mb-2 tracking-tight">Voir les analyses</div>
              <div className="text-sm text-slate-500 leading-relaxed">Suivez vos performances</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
