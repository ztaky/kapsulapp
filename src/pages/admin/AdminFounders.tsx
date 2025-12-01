import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Mail, Brain, DollarSign, Users, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Cost constants (adjust based on actual pricing)
const AI_COST_PER_CREDIT = 0.002; // $0.002 per AI credit
const EMAIL_COST_PER_SEND = 0.001; // $0.001 per email (Resend pricing ~$0.001)

interface FounderData {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  coach_email: string;
  coach_name: string | null;
  created_at: string;
  total_ai_credits: number;
  total_emails: number;
  current_month_ai: number;
  current_month_emails: number;
  ai_limit: number;
  email_limit: number;
}

export default function AdminFounders() {
  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const { data: founders, isLoading } = useQuery({
    queryKey: ["admin-founders"],
    queryFn: async () => {
      // Get all founder organizations with their coaches
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select(`
          id,
          name,
          slug,
          created_at,
          email_limit_per_month,
          organization_members!inner (
            user_id,
            role,
            profiles:user_id (
              email,
              full_name
            )
          )
        `)
        .eq("is_founder_plan", true)
        .eq("organization_members.role", "coach");

      if (orgsError) throw orgsError;

      // Get AI credits for all founder orgs
      const orgIds = orgs?.map(o => o.id) || [];
      
      const { data: aiCredits } = await supabase
        .from("ai_credits")
        .select("organization_id, credits_used, month_year")
        .in("organization_id", orgIds);

      // Get email usage for all founder orgs
      const { data: emailUsage } = await supabase
        .from("email_usage")
        .select("organization_id, emails_sent, month_year")
        .in("organization_id", orgIds);

      // Process the data
      const foundersData: FounderData[] = (orgs || []).map(org => {
        const coach = org.organization_members?.[0];
        const profile = coach?.profiles as any;
        
        // Calculate AI credits
        const orgAiCredits = aiCredits?.filter(ac => ac.organization_id === org.id) || [];
        const totalAi = orgAiCredits.reduce((sum, ac) => sum + ac.credits_used, 0);
        const currentMonthAi = orgAiCredits.find(ac => ac.month_year === currentMonthYear)?.credits_used || 0;
        
        // Calculate emails from email_usage table
        const orgEmailUsage = emailUsage?.filter(eu => eu.organization_id === org.id) || [];
        const totalEmails = orgEmailUsage.reduce((sum, eu) => sum + eu.emails_sent, 0);
        const currentMonthEmails = orgEmailUsage.find(eu => eu.month_year === currentMonthYear)?.emails_sent || 0;

        return {
          organization_id: org.id,
          organization_name: org.name,
          organization_slug: org.slug,
          coach_email: profile?.email || "N/A",
          coach_name: profile?.full_name,
          created_at: org.created_at,
          total_ai_credits: totalAi,
          total_emails: totalEmails,
          current_month_ai: currentMonthAi,
          current_month_emails: currentMonthEmails,
          ai_limit: 5000,
          email_limit: (org as any).email_limit_per_month || 3000,
        };
      });

      return foundersData;
    },
  });

  // Calculate totals
  const totalFounders = founders?.length || 0;
  const totalAiCredits = founders?.reduce((sum, f) => sum + f.total_ai_credits, 0) || 0;
  const totalEmails = founders?.reduce((sum, f) => sum + f.total_emails, 0) || 0;
  const totalAiCost = totalAiCredits * AI_COST_PER_CREDIT;
  const totalEmailCost = totalEmails * EMAIL_COST_PER_SEND;
  const totalCost = totalAiCost + totalEmailCost;

  // Current month totals
  const currentMonthAi = founders?.reduce((sum, f) => sum + f.current_month_ai, 0) || 0;
  const currentMonthEmails = founders?.reduce((sum, f) => sum + f.current_month_emails, 0) || 0;
  const currentMonthCost = (currentMonthAi * AI_COST_PER_CREDIT) + (currentMonthEmails * EMAIL_COST_PER_SEND);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Sparkles className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Founders</h1>
          <p className="text-muted-foreground">Suivi des coûts IA et Email des comptes Founder</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Founders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalFounders}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crédits IA utilisés</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalAiCredits.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {currentMonthAi.toLocaleString()} ce mois
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails envoyés</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalEmails.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {currentMonthEmails.toLocaleString()} ce mois
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût Total Estimé</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(currentMonthCost)} ce mois
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Détail Coûts IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Coût par crédit</span>
              <span>{formatCurrency(AI_COST_PER_CREDIT)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total crédits</span>
              <span>{totalAiCredits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Coût total IA</span>
              <span className="text-primary">{formatCurrency(totalAiCost)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Détail Coûts Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Coût par email</span>
              <span>{formatCurrency(EMAIL_COST_PER_SEND)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total emails</span>
              <span>{totalEmails.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Coût total Email</span>
              <span className="text-primary">{formatCurrency(totalEmailCost)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Founders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Liste des Founders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : founders && founders.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Académie</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead className="text-right">Crédits IA (5000/mois)</TableHead>
                  <TableHead className="text-right">Emails (3000/mois)</TableHead>
                  <TableHead className="text-right">Coût Estimé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {founders.map((founder) => {
                  const founderCost = (founder.total_ai_credits * AI_COST_PER_CREDIT) + 
                                     (founder.total_emails * EMAIL_COST_PER_SEND);
                  return (
                    <TableRow key={founder.organization_id}>
                      <TableCell>
                        <div className="font-medium">{founder.organization_name}</div>
                        <div className="text-xs text-muted-foreground">{founder.organization_slug}</div>
                      </TableCell>
                      <TableCell>
                        <div>{founder.coach_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{founder.coach_email}</div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(founder.created_at), "d MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{founder.total_ai_credits.toLocaleString()}</div>
                        <div className={`text-xs ${
                          founder.current_month_ai >= founder.ai_limit ? "text-destructive font-medium" :
                          founder.current_month_ai >= founder.ai_limit * 0.8 ? "text-amber-500" : "text-muted-foreground"
                        }`}>
                          {founder.current_month_ai.toLocaleString()} / {founder.ai_limit.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{founder.total_emails.toLocaleString()}</div>
                        <div className={`text-xs ${
                          founder.current_month_emails >= founder.email_limit ? "text-destructive font-medium" :
                          founder.current_month_emails >= founder.email_limit * 0.8 ? "text-amber-500" : "text-muted-foreground"
                        }`}>
                          {founder.current_month_emails.toLocaleString()} / {founder.email_limit.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={founderCost > 10 ? "destructive" : founderCost > 5 ? "secondary" : "outline"}>
                          {formatCurrency(founderCost)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun compte Founder pour le moment
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="p-2 bg-amber-100 rounded-lg h-fit">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">À propos des coûts</h4>
              <p className="text-sm text-muted-foreground">
                Les coûts affichés sont des estimations basées sur les tarifs moyens :
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>IA : ~{formatCurrency(AI_COST_PER_CREDIT)} par crédit (basé sur les modèles Lovable AI)</li>
                <li>Email : ~{formatCurrency(EMAIL_COST_PER_SEND)} par email (Resend free tier jusqu'à 3000/mois)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
