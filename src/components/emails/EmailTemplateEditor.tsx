import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Info } from "lucide-react";

type EmailType = Database["public"]["Enums"]["email_type"];

interface EmailTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
  organizationId?: string;
  isAdmin?: boolean;
}

const EMAIL_TYPES = [
  { value: "welcome_purchase", label: "Bienvenue après achat" },
  { value: "invoice", label: "Facture" },
  { value: "course_reminder", label: "Rappel de cours" },
  { value: "new_content", label: "Nouveau contenu disponible" },
  { value: "onboarding_day_1", label: "Onboarding J+1" },
  { value: "onboarding_day_3", label: "Onboarding J+3" },
  { value: "onboarding_day_7", label: "Onboarding J+7" },
  { value: "custom", label: "Personnalisé" },
];

const ADMIN_EMAIL_TYPES = [
  { value: "coach_welcome", label: "Bienvenue Coach" },
  { value: "founder_welcome", label: "Bienvenue Fondateur" },
  { value: "support_ticket_created", label: "Ticket créé" },
  { value: "support_ticket_reply", label: "Réponse ticket" },
  { value: "support_ticket_status", label: "Statut ticket changé" },
  { value: "platform_update", label: "Mise à jour plateforme" },
];

const AVAILABLE_VARIABLES = [
  { key: "{{student_name}}", description: "Nom de l'étudiant" },
  { key: "{{student_email}}", description: "Email de l'étudiant" },
  { key: "{{course_name}}", description: "Nom de la formation" },
  { key: "{{academy_name}}", description: "Nom de l'académie" },
  { key: "{{coach_name}}", description: "Nom du coach" },
  { key: "{{purchase_amount}}", description: "Montant de l'achat" },
  { key: "{{login_url}}", description: "URL de connexion" },
];

export function EmailTemplateEditor({
  open,
  onOpenChange,
  template,
  organizationId,
  isAdmin,
}: EmailTemplateEditorProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [emailType, setEmailType] = useState<EmailType | "">("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setEmailType(template.email_type);
      setSubject(template.subject);
      setHtmlContent(template.html_content);
    } else {
      setName("");
      setEmailType("");
      setSubject("");
      setHtmlContent(getDefaultHtmlTemplate());
    }
  }, [template, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!emailType) throw new Error("Type d'email requis");
      
      const data = {
        name,
        email_type: emailType as EmailType,
        subject,
        html_content: htmlContent,
        organization_id: isAdmin ? null : organizationId,
        is_default: isAdmin,
      };

      if (template?.id) {
        const { error } = await supabase
          .from("email_templates")
          .update(data)
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("email_templates").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success(template ? "Template mis à jour" : "Template créé");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Une erreur est survenue");
    },
  });

  const insertVariable = (variable: string) => {
    setHtmlContent((prev) => prev + variable);
  };

  const availableTypes = isAdmin ? ADMIN_EMAIL_TYPES : EMAIL_TYPES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Modifier le template" : "Nouveau template"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du template</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Email de bienvenue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type d'email</Label>
              <Select value={emailType} onValueChange={(v) => setEmailType(v as EmailType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Sujet de l'email</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Bienvenue dans votre formation !"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Variables disponibles</Label>
              <Info className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((v) => (
                <Badge
                  key={v.key}
                  variant="outline"
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => insertVariable(v.key)}
                  title={v.description}
                >
                  {v.key}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenu HTML</Label>
            <Textarea
              id="content"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="<html>...</html>"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!name || !emailType || !subject || !htmlContent || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultHtmlTemplate() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #d97706, #f59e0b); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">{{academy_name}}</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #1e293b; margin-top: 0;">Bonjour {{student_name}},</h2>
      <p style="color: #475569; line-height: 1.6;">
        Votre contenu ici...
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{login_url}}" style="display: inline-block; background: #d97706; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Accéder à ma formation
        </a>
      </div>
      <p style="color: #475569; line-height: 1.6;">
        À très vite,<br>
        <strong>{{coach_name}}</strong>
      </p>
    </div>
    <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        © 2024 {{academy_name}}. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>`;
}
