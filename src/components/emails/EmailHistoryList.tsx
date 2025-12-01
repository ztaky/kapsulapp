import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EmailSendStatus = Database["public"]["Enums"]["email_send_status"];
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Mail, CheckCircle, XCircle, Clock, Eye, MousePointer } from "lucide-react";

interface EmailHistoryListProps {
  organizationId?: string;
  isAdmin?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: "En attente", icon: Clock, className: "bg-yellow-100 text-yellow-800" },
  sent: { label: "Envoyé", icon: CheckCircle, className: "bg-green-100 text-green-800" },
  failed: { label: "Échec", icon: XCircle, className: "bg-red-100 text-red-800" },
  opened: { label: "Ouvert", icon: Eye, className: "bg-blue-100 text-blue-800" },
  clicked: { label: "Cliqué", icon: MousePointer, className: "bg-purple-100 text-purple-800" },
};

export function EmailHistoryList({ organizationId, isAdmin }: EmailHistoryListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmailSendStatus | "all">("all");

  const { data: emails, isLoading } = useQuery({
    queryKey: ["email-sends", organizationId, isAdmin, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("email_sends")
        .select(`
          *,
          email_templates(name, email_type)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!isAdmin && organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredEmails = emails?.filter(
    (email) =>
      email.recipient_email.toLowerCase().includes(search.toLowerCase()) ||
      email.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Historique des envois</h2>
          <p className="text-sm text-slate-500">
            Consultez tous les emails envoyés
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par email ou sujet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EmailSendStatus | "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="failed">Échec</SelectItem>
            <SelectItem value="opened">Ouvert</SelectItem>
            <SelectItem value="clicked">Cliqué</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredEmails?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Aucun email</h3>
            <p className="text-sm text-slate-500">
              L'historique des envois apparaîtra ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destinataire</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmails?.map((email) => {
                const statusConfig = STATUS_CONFIG[email.status];
                const StatusIcon = statusConfig?.icon || Mail;

                return (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium">{email.recipient_email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{email.subject}</TableCell>
                    <TableCell>
                      {email.email_templates?.name || (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${statusConfig?.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig?.label || email.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {format(new Date(email.created_at), "dd MMM yyyy HH:mm", {
                        locale: fr,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
