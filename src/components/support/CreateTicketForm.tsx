import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendSupportEmail, getAdminEmails } from "@/lib/support-email";

const ticketSchema = z.object({
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères"),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères"),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CreateTicketFormProps {
  organizationId?: string;
  aiConversation?: Message[];
  conversationSummary?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const categories = [
  { value: "technical", label: "Problème technique" },
  { value: "billing", label: "Facturation" },
  { value: "account", label: "Mon compte" },
  { value: "course", label: "Cours / Formation" },
  { value: "payment", label: "Paiement" },
  { value: "other", label: "Autre" },
];

export function CreateTicketForm({
  organizationId,
  aiConversation = [],
  conversationSummary = "",
  onSuccess,
  onCancel,
}: CreateTicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      description: conversationSummary 
        ? `Suite à ma conversation avec l'assistant IA :\n\n${conversationSummary.slice(0, 500)}${conversationSummary.length > 500 ? "..." : ""}\n\n---\n\nDétails supplémentaires:\n`
        : "",
      category: undefined,
      priority: "medium",
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      const { data: ticketData, error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        organization_id: organizationId || null,
        subject: data.subject,
        description: data.description,
        category: data.category || null,
        priority: data.priority,
        ai_conversation: aiConversation as any,
      }).select().single();

      if (error) throw error;

      // Send email to user
      sendSupportEmail({
        type: "ticket_created",
        ticketId: ticketData.id,
        recipientEmail: profile?.email || user.email || "",
        recipientName: profile?.full_name || undefined,
        ticketSubject: data.subject,
      });

      // Send email to all admins
      const admins = await getAdminEmails();
      admins.forEach(admin => {
        sendSupportEmail({
          type: "ticket_created",
          ticketId: ticketData.id,
          recipientEmail: admin.email,
          recipientName: admin.name || "Admin",
          ticketSubject: data.subject,
        });
      });

      toast.success("Ticket créé avec succès", {
        description: "Notre équipe va traiter votre demande rapidement.",
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Erreur lors de la création du ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onCancel} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au chat
      </Button>

      <div>
        <h3 className="font-semibold text-lg">Créer un ticket de support</h3>
        <p className="text-sm text-muted-foreground">
          Notre équipe vous répondra dans les plus brefs délais.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sujet</FormLabel>
                <FormControl>
                  <Input placeholder="Résumé du problème" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priorité</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Décrivez votre problème en détail..."
                    className="min-h-[150px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer le ticket
          </Button>
        </form>
      </Form>
    </div>
  );
}
