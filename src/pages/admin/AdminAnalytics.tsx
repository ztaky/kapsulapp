import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/shared/StatCard";
import { BarChart3, TrendingUp, Users, Target, Building2, Percent } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

interface RevenueData {
  date: string;
  revenue: number;
}

interface AcademyRevenue {
  id: string;
  name: string;
  revenue: number;
  salesCount: number;
}

interface ConversionData {
  stage: string;
  count: number;
  percentage: number;
}

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '12m'>('30d');
  const [mrr, setMrr] = useState(0);
  const [churnRate, setChurnRate] = useState(0);
  const [ltv, setLtv] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topAcademies, setTopAcademies] = useState<AcademyRevenue[]>([]);
  const [revenueByType, setRevenueByType] = useState<{ name: string; value: number }[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionData[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      if (period === '7d') {
        startDate = subDays(now, 7);
      } else if (period === '30d') {
        startDate = subDays(now, 30);
      } else {
        startDate = subMonths(now, 12);
      }

      // Fetch purchases for revenue data
      const { data: purchases } = await supabase
        .from('purchases')
        .select(`
          id,
          amount,
          purchased_at,
          status,
          course_id,
          courses!inner (
            id,
            title,
            organization_id,
            organizations!inner (
              id,
              name,
              is_founder_plan
            )
          )
        `)
        .gte('purchased_at', startDate.toISOString())
        .eq('status', 'completed');

      // Fetch all organizations for churn calculation
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name, created_at, is_founder_plan');

      // Fetch courses count per org
      const { data: courses } = await supabase
        .from('courses')
        .select('id, organization_id, is_published');

      // Calculate MRR (Monthly Recurring Revenue - this month)
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      
      const { data: mrrPurchases } = await supabase
        .from('purchases')
        .select('amount')
        .gte('purchased_at', currentMonthStart.toISOString())
        .lte('purchased_at', currentMonthEnd.toISOString())
        .eq('status', 'completed');
      
      const calculatedMrr = mrrPurchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      setMrr(calculatedMrr);

      // Calculate Churn Rate (orgs without activity in last 30 days)
      const thirtyDaysAgo = subDays(now, 30);
      const activeOrgIds = new Set(
        purchases
          ?.filter(p => new Date(p.purchased_at) >= thirtyDaysAgo)
          .map(p => (p.courses as any)?.organization_id)
          .filter(Boolean)
      );
      
      const totalOrgs = organizations?.length || 1;
      const inactiveOrgs = totalOrgs - activeOrgIds.size;
      const calculatedChurn = totalOrgs > 0 ? (inactiveOrgs / totalOrgs) * 100 : 0;
      setChurnRate(Math.round(calculatedChurn * 10) / 10);

      // Calculate LTV (average revenue per academy)
      const orgRevenues = new Map<string, number>();
      purchases?.forEach(p => {
        const orgId = (p.courses as any)?.organization_id;
        if (orgId) {
          orgRevenues.set(orgId, (orgRevenues.get(orgId) || 0) + Number(p.amount));
        }
      });
      
      const avgLtv = orgRevenues.size > 0 
        ? Array.from(orgRevenues.values()).reduce((a, b) => a + b, 0) / orgRevenues.size 
        : 0;
      setLtv(Math.round(avgLtv));

      // Total revenue for period
      const total = purchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      setTotalRevenue(total);

      // Revenue by date for chart
      const revenueByDate = new Map<string, number>();
      purchases?.forEach(p => {
        const dateKey = period === '12m' 
          ? format(new Date(p.purchased_at), 'MMM yyyy', { locale: fr })
          : format(new Date(p.purchased_at), 'dd/MM', { locale: fr });
        revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + Number(p.amount));
      });
      
      const chartData = Array.from(revenueByDate.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setRevenueData(chartData);

      // Top 10 academies by revenue
      const academyRevenues = new Map<string, { name: string; revenue: number; salesCount: number }>();
      purchases?.forEach(p => {
        const org = (p.courses as any)?.organizations;
        if (org) {
          const existing = academyRevenues.get(org.id) || { name: org.name, revenue: 0, salesCount: 0 };
          academyRevenues.set(org.id, {
            name: org.name,
            revenue: existing.revenue + Number(p.amount),
            salesCount: existing.salesCount + 1
          });
        }
      });
      
      const topAcademiesList = Array.from(academyRevenues.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      setTopAcademies(topAcademiesList);

      // Revenue by type (simplified: Courses vs Founder fees - would need more data for full breakdown)
      const founderOrgs = new Set(
        organizations?.filter(o => o.is_founder_plan).map(o => o.id)
      );
      
      let founderRevenue = 0;
      let courseRevenue = 0;
      
      purchases?.forEach(p => {
        const orgId = (p.courses as any)?.organization_id;
        if (founderOrgs.has(orgId)) {
          founderRevenue += Number(p.amount);
        } else {
          courseRevenue += Number(p.amount);
        }
      });
      
      setRevenueByType([
        { name: 'Formations', value: courseRevenue },
        { name: 'Académies Founder', value: founderRevenue }
      ]);

      // Conversion funnel
      const totalAccounts = organizations?.length || 0;
      const orgsWithCourses = new Set(courses?.map(c => c.organization_id)).size;
      const orgsWithPublishedCourses = new Set(
        courses?.filter(c => c.is_published).map(c => c.organization_id)
      ).size;
      const orgsWithSales = orgRevenues.size;

      setConversionFunnel([
        { stage: 'Académies créées', count: totalAccounts, percentage: 100 },
        { stage: 'Avec cours', count: orgsWithCourses, percentage: totalAccounts > 0 ? (orgsWithCourses / totalAccounts) * 100 : 0 },
        { stage: 'Cours publié', count: orgsWithPublishedCourses, percentage: totalAccounts > 0 ? (orgsWithPublishedCourses / totalAccounts) * 100 : 0 },
        { stage: 'Avec ventes', count: orgsWithSales, percentage: totalAccounts > 0 ? (orgsWithSales / totalAccounts) * 100 : 0 }
      ]);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Business</h1>
        <p className="text-muted-foreground mt-1">
          Métriques clés et performance de la plateforme
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '12m'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '12 mois'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="MRR (ce mois)"
            value={formatCurrency(mrr)}
            icon={TrendingUp}
            isHighlighted
          />
          <StatCard
            title="Churn Rate"
            value={`${churnRate}%`}
            description="Académies inactives 30j"
            icon={Percent}
          />
          <StatCard
            title="LTV moyen"
            value={formatCurrency(ltv)}
            description="Par académie"
            icon={Target}
          />
          <StatCard
            title={`Revenus (${period})`}
            value={formatCurrency(totalRevenue)}
            icon={BarChart3}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Évolution des revenus
          </h3>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `${v}€`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aucune donnée pour cette période
            </div>
          )}
        </div>

        {/* Revenue by Type Pie Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Répartition revenus
          </h3>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : revenueByType.some(r => r.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={revenueByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {revenueByType.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aucune donnée
            </div>
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Funnel de conversion
        </h3>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="space-y-4">
            {conversionFunnel.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">{stage.stage}</span>
                  <span className="text-muted-foreground">
                    {stage.count} ({Math.round(stage.percentage)}%)
                  </span>
                </div>
                <div className="h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${stage.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 10 Academies */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Top 10 Académies par revenus
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : topAcademies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">#</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Académie</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ventes</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Revenus</th>
                </tr>
              </thead>
              <tbody>
                {topAcademies.map((academy, index) => (
                  <tr key={academy.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        index === 1 ? 'bg-slate-400/20 text-slate-400' :
                        index === 2 ? 'bg-orange-600/20 text-orange-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{academy.name}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{academy.salesCount}</td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">
                      {formatCurrency(academy.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune académie avec des ventes
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
