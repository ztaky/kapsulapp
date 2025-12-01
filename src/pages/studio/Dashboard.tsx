import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useFounderStatus } from "@/hooks/useFounderStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, BookOpen, TrendingUp, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { StatCard } from "@/components/shared/StatCard";
import { FounderBadge } from "@/components/shared/FounderBadge";

export default function StudioDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { organizations } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);
  const { isFounder } = useFounderStatus();

  const [showWizard, setShowWizard] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  const {
    steps,
    progress,
    completedCount,
    totalSteps,
    onboardingCompleted,
    isLoading: onboardingLoading,
    markComplete,
    skipStep,
    completeOnboarding,
    refetch: refetchOnboarding,
  } = useOnboarding(currentOrg?.id);

  // Auto-open wizard for new coaches
  useEffect(() => {
    if (!onboardingLoading && !hasCheckedOnboarding && currentOrg?.id) {
      setHasCheckedOnboarding(true);
      if (!onboardingCompleted && completedCount === 0) {
        setShowWizard(true);
      }
    }
  }, [onboardingLoading, onboardingCompleted, completedCount, hasCheckedOnboarding, currentOrg?.id]);

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
        () => {
          refetch();
          refetchOnboarding();
        }
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
  }, [currentOrg?.id, refetch, refetchOnboarding]);

  const handleStepAction = (stepKey: string, action: "complete" | "skip") => {
    if (action === "complete") {
      markComplete(stepKey);
    } else {
      skipStep(stepKey);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/30 p-10 border border-slate-100 shadow-sm">
          <Skeleton className="h-12 w-80 mb-3" />
          <Skeleton className="h-6 w-96" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
      {/* Onboarding Wizard */}
      <OnboardingWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        organizationSlug={slug || ""}
        organizationName={currentOrg?.name || ""}
        onStepAction={handleStepAction}
      />

      {/* Hero Header */}
      <div className="flex items-start justify-between">
        <DashboardHeader
          title="Tableau de bord"
          subtitle="Vue d'ensemble de votre académie"
          highlight={currentOrg?.name}
        />
        {isFounder && <FounderBadge className="mt-2" />}
      </div>

      {/* Onboarding Checklist - Show if not completed */}
      {!onboardingCompleted && (
        <OnboardingChecklist
          steps={steps}
          progress={progress}
          completedCount={completedCount}
          totalSteps={totalSteps}
          organizationSlug={slug || ""}
          onOpenWizard={() => setShowWizard(true)}
          onComplete={completeOnboarding}
        />
      )}

      {/* Stats Grid - Neutral style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Formations"
          value={stats?.totalCourses || 0}
          icon={BookOpen}
          colorVariant="slate"
        />
        <StatCard
          title="Étudiants"
          value={stats?.totalStudents || 0}
          icon={Users}
          colorVariant="slate"
        />
        <StatCard
          title="Revenus"
          value={`${stats?.totalRevenue || 0} €`}
          icon={TrendingUp}
          colorVariant="slate"
          isHighlighted
        />
        <StatCard
          title="Ventes"
          value={stats?.totalPurchases || 0}
          icon={DollarSign}
          colorVariant="slate"
        />
      </div>

      {/* Quick Actions Section */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-8 border border-slate-100 shadow-sm">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6 text-foreground tracking-tight">Actions rapides</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <button 
              onClick={() => navigate(`/school/${slug}/studio/courses`)}
              className="p-6 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="rounded-xl bg-amber-50 text-slate-600 p-3 w-11 h-11 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="font-semibold text-foreground mb-1 tracking-tight flex items-center gap-2">
                Créer une formation
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">Démarrez une nouvelle formation</div>
            </button>
            
            <button 
              onClick={() => navigate(`/school/${slug}/studio/students`)}
              className="p-6 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="rounded-xl bg-amber-50 text-slate-600 p-3 w-11 h-11 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <div className="font-semibold text-foreground mb-1 tracking-tight flex items-center gap-2">
                Inviter des étudiants
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">Agrandissez votre communauté</div>
            </button>
            
            <button 
              onClick={() => navigate(`/school/${slug}/studio/landing-pages`)}
              className="p-6 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="rounded-xl bg-amber-50 text-slate-600 p-3 w-11 h-11 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="font-semibold text-foreground mb-1 tracking-tight flex items-center gap-2">
                Voir les analyses
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">Suivez vos performances</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
