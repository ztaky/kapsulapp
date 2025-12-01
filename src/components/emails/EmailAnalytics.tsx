import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle, Eye, MousePointer, TrendingUp } from "lucide-react";

export function EmailAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["email-analytics"],
    queryFn: async () => {
      // Get counts by status
      const { data: sends, error } = await supabase
        .from("email_sends")
        .select("status, created_at");
      
      if (error) throw error;

      const totalSent = sends?.filter((s) => s.status === "sent").length || 0;
      const totalFailed = sends?.filter((s) => s.status === "failed").length || 0;
      const totalOpened = sends?.filter((s) => s.status === "opened").length || 0;
      const totalClicked = sends?.filter((s) => s.status === "clicked").length || 0;
      const total = sends?.length || 0;

      // Get today's count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = sends?.filter(
        (s) => new Date(s.created_at) >= today
      ).length || 0;

      return {
        total,
        totalSent,
        totalFailed,
        totalOpened,
        totalClicked,
        todayCount,
        openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0",
        clickRate: totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : "0",
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total envoyés",
      value: stats?.total || 0,
      icon: Mail,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
    {
      title: "Envoyés avec succès",
      value: stats?.totalSent || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Échecs",
      value: stats?.totalFailed || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Ouverts",
      value: stats?.totalOpened || 0,
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      subtitle: `${stats?.openRate}% taux d'ouverture`,
    },
    {
      title: "Cliqués",
      value: stats?.totalClicked || 0,
      icon: MousePointer,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      subtitle: `${stats?.clickRate}% taux de clic`,
    },
    {
      title: "Aujourd'hui",
      value: stats?.todayCount || 0,
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Analytics Emails</h2>
        <p className="text-sm text-slate-500">
          Vue d'ensemble des performances de vos emails
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              {stat.subtitle && (
                <CardDescription className="text-xs mt-1">
                  {stat.subtitle}
                </CardDescription>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conseils d'optimisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
            <div>
              <p className="font-medium text-slate-900">Personnalisez vos sujets</p>
              <p className="text-sm text-slate-600">
                Les emails avec le prénom du destinataire ont un taux d'ouverture 26% plus élevé.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            <div>
              <p className="font-medium text-slate-900">Optimisez vos CTAs</p>
              <p className="text-sm text-slate-600">
                Un seul bouton d'action clair augmente le taux de clic de 371%.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
            <div>
              <p className="font-medium text-slate-900">Envoyez au bon moment</p>
              <p className="text-sm text-slate-600">
                Les mardi et jeudi entre 9h et 11h sont les meilleurs moments pour l'engagement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
