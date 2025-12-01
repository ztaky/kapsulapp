import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/shared/StatCard";
import { Wallet, CheckCircle, XCircle, RotateCcw, Search, Filter, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface Payment {
  id: string;
  amount: number;
  status: string;
  purchased_at: string;
  user_id: string;
  course_id: string;
  stripe_payment_id: string | null;
  customer: {
    full_name: string | null;
    email: string;
  } | null;
  course: {
    title: string;
    organization: {
      id: string;
      name: string;
      is_founder_plan: boolean;
    } | null;
  } | null;
}

interface Organization {
  id: string;
  name: string;
}

interface CommissionData {
  month: string;
  commission: number;
  revenue: number;
}

const AdminPayments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("30d");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  
  // Stats
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [refundedCount, setRefundedCount] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [commissionData, setCommissionData] = useState<CommissionData[]>([]);

  useEffect(() => {
    fetchPayments();
    fetchOrganizations();
  }, [periodFilter]);

  const fetchOrganizations = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');
    
    if (data) {
      setOrganizations(data);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    
    try {
      const now = new Date();
      let startDate: Date;
      
      if (periodFilter === '7d') {
        startDate = subDays(now, 7);
      } else if (periodFilter === '30d') {
        startDate = subDays(now, 30);
      } else if (periodFilter === '3m') {
        startDate = subMonths(now, 3);
      } else {
        startDate = subMonths(now, 12);
      }

      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          amount,
          status,
          purchased_at,
          user_id,
          course_id,
          stripe_payment_id,
          profiles!purchases_user_id_fkey (
            full_name,
            email
          ),
          courses!purchases_course_id_fkey (
            title,
            organization_id,
            organizations!courses_organization_id_fkey (
              id,
              name,
              is_founder_plan
            )
          )
        `)
        .gte('purchased_at', startDate.toISOString())
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      const formattedPayments: Payment[] = (data || []).map(p => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        purchased_at: p.purchased_at,
        user_id: p.user_id,
        course_id: p.course_id,
        stripe_payment_id: p.stripe_payment_id,
        customer: p.profiles ? {
          full_name: (p.profiles as any).full_name,
          email: (p.profiles as any).email
        } : null,
        course: p.courses ? {
          title: (p.courses as any).title,
          organization: (p.courses as any).organizations ? {
            id: (p.courses as any).organizations.id,
            name: (p.courses as any).organizations.name,
            is_founder_plan: (p.courses as any).organizations.is_founder_plan
          } : null
        } : null
      }));

      setPayments(formattedPayments);

      // Calculate stats
      const total = formattedPayments.reduce((sum, p) => sum + p.amount, 0);
      setTotalProcessed(total);
      setSuccessCount(formattedPayments.filter(p => p.status === 'completed').length);
      setRefundedCount(formattedPayments.filter(p => p.status === 'refunded').length);

      // Calculate commission (8% on Free accounts)
      const freeAccountsRevenue = formattedPayments
        .filter(p => p.course?.organization && !p.course.organization.is_founder_plan)
        .reduce((sum, p) => sum + p.amount, 0);
      setTotalCommission(freeAccountsRevenue * 0.08);

      // Commission by month for chart
      const commissionByMonth = new Map<string, { commission: number; revenue: number }>();
      formattedPayments.forEach(p => {
        const monthKey = format(new Date(p.purchased_at), 'MMM yyyy', { locale: fr });
        const existing = commissionByMonth.get(monthKey) || { commission: 0, revenue: 0 };
        const isFree = p.course?.organization && !p.course.organization.is_founder_plan;
        commissionByMonth.set(monthKey, {
          commission: existing.commission + (isFree ? p.amount * 0.08 : 0),
          revenue: existing.revenue + p.amount
        });
      });

      const chartData = Array.from(commissionByMonth.entries())
        .map(([month, data]) => ({ month, ...data }))
        .reverse();
      setCommissionData(chartData);

    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">✓ Réussi</Badge>;
      case 'refunded':
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">↩ Remboursé</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">✗ Échoué</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-500 border-slate-500/30">{status}</Badge>;
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesOrg = orgFilter === 'all' || payment.course?.organization?.id === orgFilter;

    return matchesSearch && matchesStatus && matchesOrg;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paiements & Transactions</h1>
        <p className="text-muted-foreground mt-1">
          Suivi des paiements et commissions de la plateforme
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total traité"
            value={formatCurrency(totalProcessed)}
            icon={Wallet}
            isHighlighted
          />
          <StatCard
            title="Paiements réussis"
            value={successCount.toString()}
            icon={CheckCircle}
          />
          <StatCard
            title="Remboursements"
            value={refundedCount.toString()}
            icon={RotateCcw}
          />
          <StatCard
            title="Commissions (8%)"
            value={formatCurrency(totalCommission)}
            description="Sur comptes Free"
            icon={Building2}
          />
        </div>
      )}

      {/* Commission Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Évolution des commissions
        </h3>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : commissionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={commissionData}>
              <defs>
                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
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
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'commission' ? 'Commission 8%' : 'Revenus'
                ]}
              />
              <Area
                type="monotone"
                dataKey="commission"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorCommission)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Aucune donnée
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email, nom, formation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 jours</SelectItem>
            <SelectItem value="30d">30 jours</SelectItem>
            <SelectItem value="3m">3 mois</SelectItem>
            <SelectItem value="12m">12 mois</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="completed">Réussi</SelectItem>
            <SelectItem value="refunded">Remboursé</SelectItem>
            <SelectItem value="failed">Échoué</SelectItem>
          </SelectContent>
        </Select>

        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Académie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les académies</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Académie</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Formation</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Montant</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Commission 8%</th>
                  <th className="text-center py-4 px-6 text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => {
                    const isFreeAccount = payment.course?.organization && !payment.course.organization.is_founder_plan;
                    const commission = isFreeAccount ? payment.amount * 0.08 : 0;
                    
                    return (
                      <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-foreground">
                              {payment.customer?.full_name || 'N/A'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payment.customer?.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">
                              {payment.course?.organization?.name || 'N/A'}
                            </span>
                            {payment.course?.organization?.is_founder_plan && (
                              <Badge variant="outline" className="text-xs border-primary text-primary">
                                Founder
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-foreground">
                          {payment.course?.title || 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-foreground">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {commission > 0 ? (
                            <span className="text-green-500 font-medium">
                              {formatCurrency(commission)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">
                          {format(new Date(payment.purchased_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Aucun paiement trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && filteredPayments.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{filteredPayments.length} transaction(s) affichée(s)</span>
          <span>
            Total filtré : <span className="font-semibold text-foreground">
              {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
