import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Workflow, History, BarChart3 } from "lucide-react";
import { EmailTemplatesList } from "@/components/emails/EmailTemplatesList";
import { EmailSequencesList } from "@/components/emails/EmailSequencesList";
import { EmailHistoryList } from "@/components/emails/EmailHistoryList";
import { EmailAnalytics } from "@/components/emails/EmailAnalytics";

export default function AdminEmails() {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestion des Emails</h1>
        <p className="text-slate-500 mt-1">
          Templates globaux, séquences et analytics de la plateforme
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
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
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <EmailTemplatesList isAdmin />
        </TabsContent>

        <TabsContent value="sequences" className="mt-6">
          <EmailSequencesList isAdmin />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <EmailHistoryList isAdmin />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <EmailAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
