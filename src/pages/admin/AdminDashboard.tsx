import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Crown, DollarSign, GraduationCap, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalRevenue: 0,
    totalStudents: 0,
    totalCoaches: 0,
    totalCourses: 0,
    totalSuperAdmins: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    const [
      { count: orgsCount },
      { data: purchases },
      { count: studentsCount },
      { count: coachesCount },
      { count: coursesCount },
      { count: superAdminsCount },
    ] = await Promise.all([
      supabase.from("organizations").select("*", { count: "exact", head: true }),
      supabase.from("purchases").select("amount"),
      supabase.from("organization_members").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("organization_members").select("*", { count: "exact", head: true }).eq("role", "coach"),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "super_admin"),
    ]);

    setStats({
      totalOrgs: orgsCount || 0,
      totalRevenue: purchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      totalStudents: studentsCount || 0,
      totalCoaches: coachesCount || 0,
      totalCourses: coursesCount || 0,
      totalSuperAdmins: superAdminsCount || 0,
    });

    setLoading(false);
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vue d'ensemble</h1>
          <p className="text-slate-400">Bienvenue dans l'administration Kapsul</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 bg-slate-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Vue d'ensemble</h1>
        <p className="text-slate-400">Bienvenue dans l'administration Kapsul</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Académies"
          value={stats.totalOrgs}
          icon={Building2}
          color="bg-blue-600"
        />
        <StatCard
          title="Super Admins"
          value={stats.totalSuperAdmins}
          icon={Crown}
          color="bg-purple-600"
        />
        <StatCard
          title="Coachs"
          value={stats.totalCoaches}
          icon={GraduationCap}
          color="bg-green-600"
        />
        <StatCard
          title="Étudiants"
          value={stats.totalStudents}
          icon={Users}
          color="bg-cyan-600"
        />
        <StatCard
          title="Revenus totaux"
          value={`${stats.totalRevenue.toFixed(2)}€`}
          icon={DollarSign}
          color="bg-orange-600"
        />
        <StatCard
          title="Formations"
          value={stats.totalCourses}
          icon={TrendingUp}
          color="bg-pink-600"
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
