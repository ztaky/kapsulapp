import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, ExternalLink, Globe, ArrowRight, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DomainRedirectionGuideProps {
  slug: string;
}

const REGISTRAR_INSTRUCTIONS = [
  {
    name: "OVH",
    steps: [
      "Connectez-vous à votre espace client OVH",
      "Allez dans 'Noms de domaine' > Votre domaine",
      "Cliquez sur 'Redirection'",
      "Ajoutez une redirection visible (301) vers votre URL d'académie"
    ]
  },
  {
    name: "Ionos (1&1)",
    steps: [
      "Connectez-vous à votre compte Ionos",
      "Allez dans 'Domaines & SSL'",
      "Sélectionnez votre domaine > 'Gérer les redirections'",
      "Créez une redirection de type 'Header (301)'"
    ]
  },
  {
    name: "GoDaddy",
    steps: [
      "Connectez-vous à votre compte GoDaddy",
      "Allez dans 'Mes produits' > 'Domaines'",
      "Cliquez sur 'DNS' à côté de votre domaine",
      "Faites défiler jusqu'à 'Forwarding' et ajoutez une redirection"
    ]
  },
  {
    name: "Namecheap",
    steps: [
      "Connectez-vous à votre compte Namecheap",
      "Allez dans 'Domain List'",
      "Cliquez sur 'Manage' à côté de votre domaine",
      "Sélectionnez 'Redirect Domain' et configurez la destination"
    ]
  },
  {
    name: "Cloudflare",
    steps: [
      "Connectez-vous à votre dashboard Cloudflare",
      "Sélectionnez votre domaine",
      "Allez dans 'Rules' > 'Redirect Rules'",
      "Créez une règle de redirection dynamique vers votre URL"
    ]
  }
];

export function DomainRedirectionGuide({ slug }: DomainRedirectionGuideProps) {
  const [copied, setCopied] = useState(false);
  
  const academyUrl = `https://app.kapsul.dev/school/${slug}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(academyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Domaine personnalisé</CardTitle>
          </div>
          <Badge variant="secondary">Guide</Badge>
        </div>
        <CardDescription>
          Redirigez votre nom de domaine vers votre académie Kapsul
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* URL publique de l'académie */}
        <div className="space-y-2">
          <label className="text-sm font-medium">URL publique de votre académie</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm break-all">
              {academyUrl}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="shrink-0"
            >
              <a href={academyUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Guide de redirection */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" />
            Comment rediriger votre domaine
          </h4>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Pour que vos visiteurs arrivent sur votre académie en tapant <strong>votre-domaine.com</strong>, 
              configurez une <strong>redirection permanente (301)</strong> chez votre registrar.
            </p>
            
            <div className="grid gap-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                <span>Connectez-vous à l'interface de votre registrar (là où vous avez acheté votre domaine)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                <span>Cherchez l'option "Redirection URL" ou "Forwarding"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                <span>Configurez une redirection <strong>permanente (301)</strong> vers l'URL ci-dessus</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                <span>Attendez la propagation (généralement 5-30 minutes)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions par registrar */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Instructions par registrar</h4>
          
          <Accordion type="single" collapsible className="w-full">
            {REGISTRAR_INSTRUCTIONS.map((registrar) => (
              <AccordionItem key={registrar.name} value={registrar.name}>
                <AccordionTrigger className="text-sm py-2">
                  {registrar.name}
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="space-y-2 text-sm text-muted-foreground pl-4">
                    {registrar.steps.map((step, index) => (
                      <li key={index} className="list-decimal">
                        {step}
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Note informative */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Bon à savoir :</strong> Avec une redirection, vos visiteurs verront l'URL Kapsul dans leur navigateur 
            après le chargement de la page. C'est la solution la plus simple et la plus fiable.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
