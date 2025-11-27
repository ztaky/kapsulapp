import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp, MessageSquare, Bot, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { format, subDays, startOfDay, endOfDay, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";

interface TicketData {
  id: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  resolved_at: string | null;
  ai_conversation: any | null;
}

interface AnalyticsData {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  aiResolutionRate: number;
  ticketsByStatus: { name: string; value: number; color: string }[];
  ticketsByPriority: { name: string; value: number; color: string }[];
  ticketsByCategory: { name: string; value: number }[];
  ticketsOverTime: { date: string; count: number }[];
  resolutionTrend: { date: string; avgHours: number }[];
}

const statusColors: Record<string, string> = {
  open: "#f59e0b",
  in_progress: "#8b5cf6",
  waiting_response: "#3b82f6",
  resolved: "#22c55e",
  closed: "#64748b",
};

const priorityColors: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#ef4444",
};

const statusLabels: Record<string, string> = {
  open: "Ouverts",
  in_progress: "En cours",
  waiting_response: "En attente",
  resolved: "Résolus",
  closed: "Fermés",
};

const priorityLabels: Record<string, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

export default function SupportAnalytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), parseInt(period));

      const { data: tickets, error } = await supabase
        .from("support_tickets")
        .select("id, status, priority, category, created_at, resolved_at, ai_conversation")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      if (!tickets || tickets.length === 0) {
        setAnalytics({
          totalTickets: 0,
          openTickets: 0,
          resolvedTickets: 0,
          avgResolutionTime: 0,
          aiResolutionRate: 0,
          ticketsByStatus: [],
          ticketsByPriority: [],
          ticketsByCategory: [],
          ticketsOverTime: [],
          resolutionTrend: [],
        });
        return;
      }

      // Calculate metrics
      const totalTickets = tickets.length;
      const openTickets = tickets.filter((t) =>
        ["open", "in_progress", "waiting_response"].includes(t.status)
      ).length;
      const resolvedTickets = tickets.filter((t) =>
        ["resolved", "closed"].includes(t.status)
      ).length;

      // Average resolution time
      const resolvedWithTime = tickets.filter((t) => t.resolved_at);
      const avgResolutionTime =
        resolvedWithTime.length > 0
          ? resolvedWithTime.reduce((sum, t) => {
              return sum + differenceInHours(new Date(t.resolved_at!), new Date(t.created_at));
            }, 0) / resolvedWithTime.length
          : 0;

      // AI resolution rate (tickets with AI conversation and resolved)
      const aiTickets = tickets.filter((t) => t.ai_conversation);
      const aiResolvedTickets = aiTickets.filter((t) =>
        ["resolved", "closed"].includes(t.status)
      );
      const aiResolutionRate = aiTickets.length > 0 ? (aiResolvedTickets.length / aiTickets.length) * 100 : 0;

      // Tickets by status
      const statusCounts = tickets.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const ticketsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status] || "#64748b",
      }));

      // Tickets by priority
      const priorityCounts = tickets.reduce((acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const ticketsByPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
        name: priorityLabels[priority] || priority,
        value: count,
        color: priorityColors[priority] || "#64748b",
      }));

      // Tickets by category
      const categoryCounts = tickets.reduce((acc, t) => {
        const cat = t.category || "Non catégorisé";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const ticketsByCategory = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Tickets over time (daily)
      const ticketsByDate = tickets.reduce((acc, t) => {
        const date = format(new Date(t.created_at), "yyyy-MM-dd");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const ticketsOverTime = [];
      for (let i = parseInt(period) - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        ticketsOverTime.push({
          date: format(subDays(new Date(), i), "d MMM", { locale: fr }),
          count: ticketsByDate[date] || 0,
        });
      }

      // Resolution trend (average resolution time by day)
      const resolutionByDate = resolvedWithTime.reduce((acc, t) => {
        const date = format(new Date(t.resolved_at!), "yyyy-MM-dd");
        if (!acc[date]) acc[date] = [];
        acc[date].push(differenceInHours(new Date(t.resolved_at!), new Date(t.created_at)));
        return acc;
      }, {} as Record<string, number[]>);

      const resolutionTrend = Object.entries(resolutionByDate)
        .map(([date, hours]) => ({
          date: format(new Date(date), "d MMM", { locale: fr }),
          avgHours: Math.round(hours.reduce((a, b) => a + b, 0) / hours.length),
        }))
        .slice(-14);

      setAnalytics({
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResolutionTime: Math.round(avgResolutionTime),
        aiResolutionRate: Math.round(aiResolutionRate),
        ticketsByStatus,
        ticketsByPriority,
        ticketsByCategory,
        ticketsOverTime,
        resolutionTrend,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytique Support
        </h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Ticket className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalTickets}</p>
                <p className="text-sm text-muted-foreground">Total tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.openTickets}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.resolvedTickets}</p>
                <p className="text-sm text-muted-foreground">Résolus</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.avgResolutionTime}h</p>
                <p className="text-sm text-muted-foreground">Temps moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Bot className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.aiResolutionRate}%</p>
                <p className="text-sm text-muted-foreground">Résolu avec IA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tickets over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Volume de tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.ticketsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.ticketsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {analytics.ticketsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Priority distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par priorité</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.ticketsByPriority} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {analytics.ticketsByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resolution trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Temps de résolution moyen</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.resolutionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.resolutionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} unit="h" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgHours"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Pas assez de données
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tickets par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.ticketsByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <span>{cat.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(cat.value / analytics.totalTickets) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{cat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
