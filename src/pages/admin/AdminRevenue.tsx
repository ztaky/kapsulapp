import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Purchase {
  id: string;
  amount: number;
  purchased_at: string;
  status: string;
  course: {
    title: string;
  };
  profile: {
    email: string;
    full_name: string | null;
  };
}

const AdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("purchases")
      .select(`
        id,
        amount,
        purchased_at,
        status,
        courses!inner(title),
        profiles!inner(email, full_name)
      `)
      .order("purchased_at", { ascending: false });

    if (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Erreur lors du chargement des achats");
    }

    const processed = data?.map((item: any) => ({
      id: item.id,
      amount: item.amount,
      purchased_at: item.purchased_at,
      status: item.status,
      course: {
        title: item.courses.title,
      },
      profile: {
        email: item.profiles.email,
        full_name: item.profiles.full_name,
      },
    })) || [];

    setPurchases(processed);
    setTotalRevenue(processed.reduce((sum, p) => sum + Number(p.amount), 0));

    // Build chart data by month
    const monthlyData: Record<string, number> = {};
    processed.forEach((p) => {
      const date = new Date(p.purchased_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(p.amount);
    });

    const chartArray = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month: new Date(month + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        revenue,
      }));

    setChartData(chartArray);
    setLoading(false);
  };

  const filteredPurchases = purchases.filter(purchase =>
    purchase.profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (purchase.profile.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    purchase.course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Revenus</h1>
        <p className="text-slate-400">Suivez les ventes de la plateforme</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Revenus totaux</CardTitle>
            <div className="p-2 rounded-lg bg-orange-600">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalRevenue.toFixed(2)}€</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Nombre de ventes</CardTitle>
            <div className="p-2 rounded-lg bg-green-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{purchases.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Évolution des revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#f8fafc" }}
                    formatter={(value: number) => [`${value.toFixed(2)}€`, "Revenus"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Rechercher une vente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Purchases table */}
      {loading ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 bg-slate-800 mb-4" />
            <Skeleton className="h-4 w-full bg-slate-800 mb-2" />
            <Skeleton className="h-4 w-full bg-slate-800 mb-2" />
            <Skeleton className="h-4 w-full bg-slate-800" />
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              Historique des ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-slate-500">
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Formation</th>
                    <th className="pb-3 font-medium">Montant</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="py-4">
                        <div>
                          <p className="font-semibold text-white">{purchase.profile.full_name || "Sans nom"}</p>
                          <p className="text-sm text-slate-500">{purchase.profile.email}</p>
                        </div>
                      </td>
                      <td className="py-4 text-slate-300">{purchase.course.title}</td>
                      <td className="py-4">
                        <span className="text-white font-semibold">{Number(purchase.amount).toFixed(2)}€</span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          purchase.status === "completed" 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {purchase.status === "completed" ? "Complété" : purchase.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-slate-400">
                        {new Date(purchase.purchased_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                  {filteredPurchases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Aucune vente trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminRevenue;
