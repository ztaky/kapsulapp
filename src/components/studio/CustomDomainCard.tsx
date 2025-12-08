import { useState } from "react";
import { Globe, Copy, Check, ExternalLink, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface CustomDomainCardProps {
  customDomain: string;
  onDomainChange: (domain: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const DNS_IP = "185.158.133.1";

export function CustomDomainCard({ 
  customDomain, 
  onDomainChange, 
  onSave,
  isSaving 
}: CustomDomainCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copié dans le presse-papiers");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  const getStatus = () => {
    if (!customDomain) return { label: "Non configuré", variant: "secondary" as const };
    return { label: "En attente de vérification", variant: "outline" as const };
  };

  const status = getStatus();

  const dnsRecords = [
    { type: "A", name: "@", value: DNS_IP, description: "Domaine racine" },
    { type: "A", name: "www", value: DNS_IP, description: "Sous-domaine www" },
    { type: "TXT", name: "_lovable", value: `lovable_verify=${customDomain || "votre-domaine"}`, description: "Vérification" },
  ];

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Domaine personnalisé</CardTitle>
              <CardDescription>
                Connectez votre propre nom de domaine à votre académie
              </CardDescription>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Domain Input */}
        <div className="space-y-2">
          <Label htmlFor="custom-domain">Votre domaine</Label>
          <Input
            id="custom-domain"
            type="text"
            placeholder="mon-ecole.com"
            value={customDomain}
            onChange={(e) => onDomainChange(e.target.value.toLowerCase().trim())}
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Sans https:// ni www (ex: mon-ecole.com)
          </p>
        </div>

        {/* DNS Configuration Guide */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            📋 Configuration DNS requise
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                1
              </span>
              <p className="text-sm text-muted-foreground">
                Ajoutez ces enregistrements DNS chez votre registrar (OVH, Namecheap, GoDaddy, Ionos...)
              </p>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">Type</TableHead>
                    <TableHead className="w-24">Nom</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead className="w-16 text-right">Copier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dnsRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs font-medium">
                        {record.type}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {record.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs break-all">
                        {record.value}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(record.value, `${record.type}-${record.name}`)}
                        >
                          {copiedField === `${record.type}-${record.name}` ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                2
              </span>
              <p className="text-sm text-muted-foreground">
                Attendez la propagation DNS (peut prendre jusqu'à 72 heures)
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                3
              </span>
              <p className="text-sm text-muted-foreground">
                Votre domaine sera automatiquement vérifié et le certificat SSL sera généré
              </p>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Note importante :</strong> La propagation DNS peut prendre jusqu'à 72 heures. 
            Vous pouvez vérifier vos enregistrements DNS avec{" "}
            <a 
              href="https://dnschecker.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              DNSChecker.org
              <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={onSave} 
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? "Sauvegarde..." : "Sauvegarder le domaine"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
