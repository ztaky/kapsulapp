import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useUserOrganizations } from "@/hooks/useUserRole";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useFounderStatus } from "@/hooks/useFounderStatus";
import { useStudentLimit } from "@/hooks/useStudentLimit";
import { useAICredits } from "@/hooks/useAICredits";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, BookOpen, TrendingUp, ArrowRight, Sparkles, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingPopup } from "@/components/onboarding/OnboardingPopup";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { StatCard } from "@/components/shared/StatCard";
import { FounderBadge } from "@/components/shared/FounderBadge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AICreditsShop } from "@/components/credits/AICreditsShop";
import { toast } from "sonner";

export default function StudioDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { organizations } = useUserOrganizations();
  const currentOrg = organizations.find((org) => org.slug === slug);
  const { isFounder } = useFounderStatus();
  const { data: studentLimit } = useStudentLimit(currentOrg?.id);
  const { data: aiCredits, refetch: refetchCredits } = useAICredits(currentOrg?.id);

  const [showWizard, setShowWizard] = useState(false);
  const [showCreditsShop, setShowCreditsShop] = useState(false);
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

  // Handle credits purchase success from URL params
  useEffect(() => {
    const creditsPurchase = searchParams.get("credits_purchase");
    const pack = searchParams.get("pack");
    
    if (creditsPurchase === "success" && pack) {
      toast.success("Crédits IA ajoutés avec succès !");
      refetchCredits();
      // Clean URL
      searchParams.delete("credits_purchase");
      searchParams.delete("pack");
      setSearchParams(searchParams);
    } else if (creditsPurchase === "cancelled") {
      searchParams.delete("credits_purchase");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, refetchCredits]);

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
      {/* Onboarding Popup - Always show widget when onboarding not completed */}
      {!onboardingCompleted && (
        <OnboardingPopup
          open={showWizard}
          onOpenChange={setShowWizard}
          organizationSlug={slug || ""}
          organizationName={currentOrg?.name || ""}
          onStepAction={handleStepAction}
          showMinimizedByDefault={true}
          completedCount={completedCount}
          totalSteps={totalSteps}
        />
      )}

      {/* AI Credits Shop Modal */}
      {currentOrg?.id && (
        <AICreditsShop
          open={showCreditsShop}
          onOpenChange={setShowCreditsShop}
          organizationId={currentOrg.id}
          organizationSlug={slug || ""}
        />
      )}

      {/* Hero Header */}
      <div className="flex items-start justify-between">
        <DashboardHeader
          title="Tableau de bord"
          subtitle="Vue d'ensemble de votre académie"
          highlight={currentOrg?.name}
        />
        {isFounder && <FounderBadge className="mt-2" />}
      </div>


      {/* Stats Grid - Neutral style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Formations"
          value={stats?.totalCourses || 0}
          icon={BookOpen}
          colorVariant="slate"
        />
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-slate-100 text-slate-600 p-3 w-11 h-11 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Étudiants</p>
              <p className="text-2xl font-bold tracking-tight">
                {stats?.totalStudents || 0}
                {studentLimit?.maxAllowed && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {studentLimit.maxAllowed}
                  </span>
                )}
              </p>
              {studentLimit?.maxAllowed && (
                <div className="mt-2">
                  <Progress 
                    value={studentLimit.percentage} 
                    className={`h-1.5 ${
                      studentLimit.isAtLimit 
                        ? "[&>div]:bg-red-500" 
                        : studentLimit.isNearLimit 
                          ? "[&>div]:bg-amber-500" 
                          : "[&>div]:bg-emerald-500"
                    }`}
                  />
                  {studentLimit.isNearLimit && !studentLimit.isAtLimit && (
                    <p className="text-xs text-amber-600 mt-1">
                      {100 - studentLimit.percentage}% restant
                    </p>
                  )}
                  {studentLimit.isAtLimit && (
                    <p className="text-xs text-red-600 mt-1">
                      Limite atteinte
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* AI Credits Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 p-3 w-11 h-11 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">Crédits IA</p>
                {aiCredits?.creditsLimit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                    onClick={() => setShowCreditsShop(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Acheter
                  </Button>
                )}
              </div>
              <p className="text-2xl font-bold tracking-tight">
                {aiCredits?.totalAvailable ? (
                  <>
                    {aiCredits.remaining?.toLocaleString('fr-FR')}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / {aiCredits.totalAvailable.toLocaleString('fr-FR')}
                    </span>
                  </>
                ) : (
                  <span className="text-lg">∞</span>
                )}
              </p>
              {aiCredits?.bonusCredits && aiCredits.bonusCredits > 0 && (
                <p className="text-xs text-violet-600 mt-0.5">
                  dont {aiCredits.bonusCredits.toLocaleString('fr-FR')} bonus
                </p>
              )}
              {aiCredits?.totalAvailable && (
                <div className="mt-2">
                  <Progress 
                    value={aiCredits.percentage} 
                    className={`h-1.5 ${
                      aiCredits.isAtLimit 
                        ? "[&>div]:bg-red-500" 
                        : aiCredits.isNearLimit 
                          ? "[&>div]:bg-amber-500" 
                          : "[&>div]:bg-violet-500"
                    }`}
                  />
                  {aiCredits.isNearLimit && !aiCredits.isAtLimit && (
                    <p className="text-xs text-amber-600 mt-1">
                      {aiCredits.remaining?.toLocaleString('fr-FR')} restants
                    </p>
                  )}
                  {aiCredits.isAtLimit && (
                    <p className="text-xs text-red-600 mt-1">
                      Limite atteinte
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
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
