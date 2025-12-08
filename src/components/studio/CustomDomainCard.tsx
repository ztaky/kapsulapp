import { useState, useEffect, useCallback } from "react";
import { Globe, Copy, Check, ExternalLink, AlertCircle, Info, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

interface DnsCheckDetail {
  type: string;
  status: string;
  expected: string;
  found: string;
}

interface CustomDomainCardProps {
  customDomain: string;
  customDomainStatus: string | null;
  organizationId: string;
  onDomainChange: (domain: string) => void;
  onSave: () => void;
  onStatusChange: (status: string | null) => void;
  isSaving: boolean;
}

const DNS_IP = "185.158.133.1";

export function CustomDomainCard({ 
  customDomain, 
  customDomainStatus,
  organizationId,
  onDomainChange, 
  onSave,
  onStatusChange,
  isSaving 
}: CustomDomainCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [dnsDetails, setDnsDetails] = useState<DnsCheckDetail[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

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

  const verifyDns = useCallback(async () => {
    if (!customDomain || !organizationId) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-dns", {
        body: { organizationId, domain: customDomain },
      });

      if (error) throw error;

      setDnsDetails(data.details || []);
      setLastChecked(new Date());
      onStatusChange(data.status);

      if (data.isVerified) {
        toast.success("Domaine vérifié avec succès !");
      }
    } catch (error) {
      console.error("Error verifying DNS:", error);
      toast.error("Erreur lors de la vérification DNS");
    } finally {
      setIsVerifying(false);
    }
  }, [customDomain, organizationId, onStatusChange]);

  // Auto-verify when domain is set and status is pending
  useEffect(() => {
    if (customDomain && customDomainStatus === "pending") {
      const interval = setInterval(() => {
        verifyDns();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [customDomain, customDomainStatus, verifyDns]);

  const getStatusConfig = () => {
    if (!customDomain) {
      return { 
        label: "Non configuré", 
        variant: "secondary" as const, 
        icon: null,
        color: "text-muted-foreground" 
      };
    }
    
    switch (customDomainStatus) {
      case "verified":
        return { 
          label: "Vérifié", 
          variant: "default" as const, 
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          color: "text-green-600" 
        };
      case "failed":
        return { 
          label: "Échec", 
          variant: "destructive" as const, 
          icon: <XCircle className="h-3.5 w-3.5" />,
          color: "text-destructive" 
        };
      case "pending":
        return { 
          label: "En attente", 
          variant: "outline" as const, 
          icon: <Clock className="h-3.5 w-3.5" />,
          color: "text-amber-600" 
        };
      default:
        return { 
          label: "Non vérifié", 
          variant: "secondary" as const, 
          icon: null,
          color: "text-muted-foreground" 
        };
    }
  };

  const statusConfig = getStatusConfig();

  const dnsRecords = [
    { type: "A", name: "@", value: DNS_IP, description: "Domaine racine" },
    { type: "A", name: "www", value: DNS_IP, description: "Sous-domaine www" },
    { type: "TXT", name: "_lovable", value: `lovable_verify=${customDomain || "votre-domaine"}`, description: "Vérification" },
  ];

  const getRecordStatus = (recordType: string, recordName: string) => {
    const detail = dnsDetails.find(d => 
      d.type.toLowerCase().includes(recordType.toLowerCase()) && 
      d.type.toLowerCase().includes(recordName.toLowerCase())
    );
    
    if (!detail) return null;
    
    switch (detail.status) {
      case "valid":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "invalid":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "missing":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const handleSaveAndVerify = async () => {
    onSave();
    // Set status to pending after save
    if (customDomain) {
      onStatusChange("pending");
      // Wait a bit for save to complete, then verify
      setTimeout(() => {
        verifyDns();
      }, 1500);
    }
  };

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
          <Badge variant={statusConfig.variant} className="gap-1">
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Domain Input */}
        <div className="space-y-2">
          <Label htmlFor="custom-domain">Votre domaine</Label>
          <div className="flex gap-2">
            <Input
              id="custom-domain"
              type="text"
              placeholder="mon-ecole.com"
              value={customDomain}
              onChange={(e) => onDomainChange(e.target.value.toLowerCase().trim())}
              className="flex-1"
            />
            {customDomain && (
              <Button
                variant="outline"
                size="icon"
                onClick={verifyDns}
                disabled={isVerifying}
                title="Vérifier les DNS"
              >
                <RefreshCw className={`h-4 w-4 ${isVerifying ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Sans https:// ni www (ex: mon-ecole.com)
          </p>
        </div>

        {/* Last checked indicator */}
        {lastChecked && (
          <p className="text-xs text-muted-foreground">
            Dernière vérification : {lastChecked.toLocaleTimeString("fr-FR")}
            {customDomainStatus === "pending" && " • Vérification automatique toutes les 30s"}
          </p>
        )}

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
                    <TableHead className="w-12">État</TableHead>
                    <TableHead className="w-16">Type</TableHead>
                    <TableHead className="w-24">Nom</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead className="w-16 text-right">Copier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dnsRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {getRecordStatus(record.type, record.name === "@" ? "(@)" : `(${record.name})`)}
                      </TableCell>
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

        {/* Verification status details */}
        {dnsDetails.length > 0 && customDomainStatus !== "verified" && (
          <Alert variant={customDomainStatus === "pending" ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>État de la vérification :</strong>
              <ul className="mt-2 space-y-1">
                {dnsDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    {detail.status === "valid" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span>{detail.type}: {detail.status === "valid" ? "OK" : `Attendu ${detail.expected}, trouvé ${detail.found}`}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success message */}
        {customDomainStatus === "verified" && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm">
              <strong>Domaine vérifié !</strong> Votre domaine personnalisé est correctement configuré et actif.
            </AlertDescription>
          </Alert>
        )}

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
        <div className="flex justify-end gap-2">
          <Button 
            onClick={handleSaveAndVerify} 
            disabled={isSaving || isVerifying}
            className="gap-2"
          >
            {isSaving ? "Sauvegarde..." : isVerifying ? "Vérification..." : "Sauvegarder et vérifier"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
