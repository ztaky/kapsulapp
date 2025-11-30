import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Crown, DollarSign, GraduationCap, Users, BookOpen, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { StatCard } from "@/components/shared/StatCard";

const AdminDashboard = () => {
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/30 p-10 border border-slate-100 shadow-sm">
          <Skeleton className="h-12 w-80 mb-3" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <DashboardHeader
        title="Administration"
        subtitle="Vue d'ensemble de la plateforme Kapsul"
        badge="Super Admin"
      />

      {/* Stats Grid - Colored cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Académies"
          value={stats.totalOrgs}
          icon={Building2}
          colorVariant="blue"
        />
        <StatCard
          title="Super Admins"
          value={stats.totalSuperAdmins}
          icon={Crown}
          colorVariant="purple"
        />
        <StatCard
          title="Coachs"
          value={stats.totalCoaches}
          icon={GraduationCap}
          colorVariant="orange"
        />
        <StatCard
          title="Étudiants"
          value={stats.totalStudents}
          icon={Users}
          colorVariant="pink"
        />
        <StatCard
          title="Revenus totaux"
          value={`${stats.totalRevenue.toFixed(2)}€`}
          icon={DollarSign}
          colorVariant="green"
          isHighlighted
        />
        <StatCard
          title="Formations"
          value={stats.totalCourses}
          icon={BookOpen}
          colorVariant="slate"
        />
      </div>

      {/* Quick Actions Section */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-8 border border-slate-100 shadow-sm">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6 text-foreground tracking-tight">Actions rapides</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <button 
              onClick={() => navigate("/admin/academies")}
              className="p-6 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all text-left group"
            >
              <div className="rounded-xl bg-amber-50 text-slate-600 p-3 w-11 h-11 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="font-semibold text-foreground mb-1 tracking-tight flex items-center gap-2">
                Gérer les académies
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">Voir toutes les organisations</div>
            </button>
            
            <button 
              onClick={() => navigate("/admin/revenue")}
              className="p-6 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all text-left group"
            >
              <div className="rounded-xl bg-amber-50 text-slate-600 p-3 w-11 h-11 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="font-semibold text-foreground mb-1 tracking-tight flex items-center gap-2">
                Voir les revenus
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">Analyser les performances</div>
            </button>
            
            <button 
              onClick={() => navigate("/admin/support")}
              className="p-6 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all text-left group"
            >
              <div className="rounded-xl bg-amber-50 text-slate-600 p-3 w-11 h-11 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <div className="font-semibold text-foreground mb-1 tracking-tight flex items-center gap-2">
                Support utilisateurs
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">Gérer les tickets</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
