import { Routes, Route } from "react-router-dom";
import { TicketList } from "@/components/support/TicketList";
import { TicketDetail } from "@/components/support/TicketDetail";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Clock, CheckCircle, AlertTriangle, BarChart3, ListTodo } from "lucide-react";
import SupportAnalytics from "@/components/support/SupportAnalytics";

function AdminSupportList() {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [activeTab, setActiveTab] = useState("tickets");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await supabase.from("support_tickets").select("status");
      if (data) {
        setStats({
          total: data.length,
          open: data.filter((t) => t.status === "open").length,
          inProgress: data.filter((t) => t.status === "in_progress").length,
          resolved: data.filter((t) => t.status === "resolved" || t.status === "closed").length,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">
          Support
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Gérez les tickets de support et analysez les performances
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Ticket className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
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
                    <p className="text-2xl font-bold">{stats.open}</p>
                    <p className="text-sm text-muted-foreground">Ouverts</p>
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
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
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
                    <p className="text-2xl font-bold">{stats.resolved}</p>
                    <p className="text-sm text-muted-foreground">Résolus</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <TicketList basePath="/admin/support" showUserInfo />
        </TabsContent>

        <TabsContent value="analytics">
          <SupportAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminSupportDetail() {
  return <TicketDetail isAdmin backPath="/admin/support" />;
}

export default function AdminSupport() {
  return (
    <Routes>
      <Route index element={<AdminSupportList />} />
      <Route path=":ticketId" element={<AdminSupportDetail />} />
    </Routes>
  );
}
