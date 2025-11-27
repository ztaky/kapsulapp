import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, ArrowLeft, Send, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendSupportEmail, getAdminEmails } from "@/lib/support-email";

interface Message {
  id: string;
  content: string;
  is_from_admin: boolean;
  created_at: string;
  sender_id: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  ai_conversation: any[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_id: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

interface TicketDetailProps {
  isAdmin?: boolean;
  backPath: string;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  waiting_response: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  waiting_response: "En attente",
  resolved: "Résolu",
  closed: "Fermé",
};

const priorityLabels: Record<string, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

export function TicketDetail({ isAdmin = false, backPath }: TicketDetailProps) {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      fetchMessages();

      const channel = supabase
        .channel(`ticket-${ticketId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` },
          () => fetchMessages()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "support_tickets", filter: `id=eq.${ticketId}` },
          () => fetchTicket()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`*, profiles!support_tickets_user_id_fkey (full_name, email)`)
        .eq("id", ticketId)
        .single();

      if (error) throw error;
      setTicket(data as any);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      toast.error("Ticket non trouvé");
      navigate(backPath);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select(`*, profiles!support_messages_sender_id_fkey (full_name, email)`)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []) as any);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        content: newMessage.trim(),
        is_from_admin: isAdmin,
      });

      if (error) throw error;

      // Update ticket status if admin replies
      if (isAdmin && ticket.status === "open") {
        await supabase
          .from("support_tickets")
          .update({ status: "in_progress" })
          .eq("id", ticket.id);
      }

      // Send email notification
      if (isAdmin) {
        // Admin replied - notify user
        sendSupportEmail({
          type: "ticket_reply",
          ticketId: ticket.id,
          recipientEmail: ticket.profiles?.email || "",
          recipientName: ticket.profiles?.full_name || undefined,
          ticketSubject: ticket.subject,
          replyContent: newMessage.trim().slice(0, 500),
          fromAdmin: true,
        });
      } else {
        // User replied - notify admins
        const admins = await getAdminEmails();
        admins.forEach(admin => {
          sendSupportEmail({
            type: "ticket_reply",
            ticketId: ticket.id,
            recipientEmail: admin.email,
            recipientName: admin.name || "Admin",
            ticketSubject: ticket.subject,
            replyContent: newMessage.trim().slice(0, 500),
            fromAdmin: false,
          });
        });
      }

      setNewMessage("");
      toast.success("Message envoyé");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    setUpdatingStatus(true);
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "resolved") {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updates)
        .eq("id", ticket.id);

      if (error) throw error;

      // Send email notification to user about status change
      sendSupportEmail({
        type: "ticket_status_changed",
        ticketId: ticket.id,
        recipientEmail: ticket.profiles?.email || "",
        recipientName: ticket.profiles?.full_name || undefined,
        ticketSubject: ticket.subject,
        ticketStatus: statusLabels[newStatus] || newStatus,
      });

      toast.success("Statut mis à jour");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(backPath)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux tickets
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{ticket.subject}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusColors[ticket.status]}>
                  {statusLabels[ticket.status]}
                </Badge>
                <Badge variant="outline">{priorityLabels[ticket.priority]}</Badge>
                {ticket.category && <Badge variant="secondary">{ticket.category}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun message pour le moment
                  </p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.is_from_admin ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            message.is_from_admin ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          {message.is_from_admin ? (
                            <Shield className="h-4 w-4 text-primary-foreground" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.is_from_admin
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.is_from_admin ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Votre message..."
                  className="min-h-[80px]"
                />
                <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Créé par</p>
                <p className="font-medium">
                  {ticket.profiles?.full_name || ticket.profiles?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créé le</p>
                <p className="font-medium">
                  {format(new Date(ticket.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>
              {ticket.resolved_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Résolu le</p>
                  <p className="font-medium">
                    {format(new Date(ticket.resolved_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
              )}

              {isAdmin && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Changer le statut</p>
                    <Select
                      value={ticket.status}
                      onValueChange={handleStatusChange}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Ouvert</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="waiting_response">En attente de réponse</SelectItem>
                        <SelectItem value="resolved">Résolu</SelectItem>
                        <SelectItem value="closed">Fermé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {ticket.ai_conversation && ticket.ai_conversation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historique IA</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 text-sm">
                    {(ticket.ai_conversation as any[]).map((msg, i) => (
                      <div key={i} className="p-2 rounded bg-muted">
                        <p className="font-medium text-xs text-muted-foreground">
                          {msg.role === "user" ? "Utilisateur" : "Assistant"}
                        </p>
                        <p className="line-clamp-3">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
