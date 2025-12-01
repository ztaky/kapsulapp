import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Mail, Workflow, History, AlertTriangle, Plus } from "lucide-react";
import { EmailTemplatesList } from "@/components/emails/EmailTemplatesList";
import { EmailSequencesList } from "@/components/emails/EmailSequencesList";
import { EmailHistoryList } from "@/components/emails/EmailHistoryList";
import { EmailCreditsShop } from "@/components/credits/EmailCreditsShop";
import { useEmailQuota } from "@/hooks/useEmailQuota";
import { toast } from "@/hooks/use-toast";

export default function StudioEmails() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("templates");
  const [showCreditsShop, setShowCreditsShop] = useState(false);

  const { data: organization } = useQuery({
    queryKey: ["organization", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: emailQuota } = useEmailQuota(organization?.id);

  // Handle success redirect from Stripe
  useEffect(() => {
    if (searchParams.get("email_purchase") === "success") {
      toast({
        title: "Crédits emails ajoutés !",
        description: "Vos emails bonus ont été ajoutés à votre compte.",
      });
      // Remove the query param
      searchParams.delete("email_purchase");
      setSearchParams(searchParams, { replace: true });
      // Refresh quota data
      queryClient.invalidateQueries({ queryKey: ["email-quota", organization?.id] });
    }
  }, [searchParams, setSearchParams, queryClient, organization?.id]);

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Emails</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos templates d'emails et séquences automatisées
          </p>
        </div>

        {/* Email Quota Card */}
        {emailQuota && emailQuota.emailsLimit && (
          <Card className="w-full md:w-80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Quota Emails du mois
                {emailQuota.isNearLimit && !emailQuota.isAtLimit && (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                {emailQuota.isAtLimit && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {emailQuota.emailsSent.toLocaleString()} / {emailQuota.totalAvailable?.toLocaleString()} emails
                </span>
                <span className={`font-medium ${
                  emailQuota.isAtLimit ? "text-destructive" : 
                  emailQuota.isNearLimit ? "text-amber-500" : "text-foreground"
                }`}>
                  {emailQuota.percentage}%
                </span>
              </div>
              <Progress 
                value={emailQuota.percentage} 
                className={`h-2 ${
                  emailQuota.isAtLimit ? "[&>div]:bg-destructive" : 
                  emailQuota.isNearLimit ? "[&>div]:bg-amber-500" : ""
                }`}
              />
              {emailQuota.bonusEmails > 0 && (
                <p className="text-xs text-muted-foreground">
                  dont {emailQuota.bonusEmails.toLocaleString()} bonus
                </p>
              )}
              {emailQuota.isAtLimit && (
                <p className="text-xs text-destructive font-medium">
                  Quota atteint ! Les emails ne seront plus envoyés.
                </p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => setShowCreditsShop(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Acheter plus d'emails
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <EmailCreditsShop 
        open={showCreditsShop} 
        onOpenChange={setShowCreditsShop}
        organizationId={organization.id}
        organizationSlug={slug || ""}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="sequences" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Séquences
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <EmailTemplatesList organizationId={organization.id} />
        </TabsContent>

        <TabsContent value="sequences" className="mt-6">
          <EmailSequencesList organizationId={organization.id} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <EmailHistoryList organizationId={organization.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
