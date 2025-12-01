import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type SalesLead = Tables<"sales_leads">;

export default function AdminLeads() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    withEmail: 0,
    converted: 0,
    topQuestions: [] as Array<{ question: string; count: number }>
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLeads(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les leads",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (leadsData: SalesLead[]) => {
    const total = leadsData.length;
    const withEmail = leadsData.filter(l => l.email).length;
    const converted = leadsData.filter(l => l.converted).length;

    // Count top questions
    const questionCounts = leadsData.reduce((acc, lead) => {
      const q = lead.first_question;
      if (q) {
        acc[q] = (acc[q] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topQuestions = Object.entries(questionCounts)
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setStats({ total, withEmail, converted, topQuestions });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Email', 'Première question', 'Date', 'Converti', 'Source'].join(','),
      ...leads.map(lead => [
        lead.email || 'Non fourni',
        `"${lead.first_question || ''}"`,
        format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
        lead.converted ? 'Oui' : 'Non',
        lead.source_page || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_kapsul_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: "Export réussi",
      description: "Le fichier CSV a été téléchargé"
    });
  };

  const conversionRate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : 0;
  const emailCaptureRate = stats.total > 0 ? ((stats.withEmail / stats.total) * 100).toFixed(1) : 0;

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Chargement des leads...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads Sales Chat</h1>
          <p className="text-muted-foreground">
            Analyse des conversations et capture de leads
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Conversations enregistrées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails capturés</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withEmail}</div>
            <p className="text-xs text-muted-foreground">
              {emailCaptureRate}% de taux de capture
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.converted}</div>
            <p className="text-xs text-muted-foreground">
              {conversionRate}% de taux de conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages moyens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 
                ? (leads.reduce((acc, l) => {
                    const msgCount = Array.isArray(l.conversation) ? l.conversation.length : 0;
                    return acc + msgCount;
                  }, 0) / stats.total).toFixed(1)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Par conversation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Questions les plus fréquentes
          </CardTitle>
          <CardDescription>
            Les 10 premières questions posées par les visiteurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topQuestions.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm flex-1">{item.question}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
            {stats.topQuestions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune question pour le moment
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des leads</CardTitle>
          <CardDescription>
            Historique complet des conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Première question</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="text-sm">
                    {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {lead.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{lead.email}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Non fourni</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {lead.first_question || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {Array.isArray(lead.conversation) ? lead.conversation.length : 0} msg
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.source_page || '-'}
                  </TableCell>
                  <TableCell>
                    {lead.converted ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Converti
                      </Badge>
                    ) : (
                      <Badge variant="secondary">En attente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun lead pour le moment
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
