import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Workflow, History } from "lucide-react";
import { EmailTemplatesList } from "@/components/emails/EmailTemplatesList";
import { EmailSequencesList } from "@/components/emails/EmailSequencesList";
import { EmailHistoryList } from "@/components/emails/EmailHistoryList";

export default function StudioEmails() {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState("templates");

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

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Emails</h1>
        <p className="text-slate-500 mt-1">
          Gérez vos templates d'emails et séquences automatisées
        </p>
      </div>

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
