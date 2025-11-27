import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, ExternalLink, AlertCircle } from "lucide-react";
import { WizardData } from "./LandingPageWizard";

interface StepCloneDesignProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

export function StepCloneDesign({ data, onUpdate }: StepCloneDesignProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Cloner un Design Existant</h3>
        <p className="text-muted-foreground">
          Vous avez déjà une landing page ailleurs et voulez reproduire son design ? (optionnel)
        </p>
      </div>

      <Alert>
        <Copy className="h-4 w-4" />
        <AlertDescription>
          <strong>Comment ça marche ?</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• L'IA analysera la page web que vous fournissez</li>
            <li>• Elle reproduira la structure et le style visuel</li>
            <li>• Le contenu sera régénéré avec un copywriting professionnel</li>
            <li>• Idéal si vous aimez déjà votre design actuel</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>URL de la landing page à cloner</Label>
        <Input
          type="url"
          value={data.cloneSourceUrl || ""}
          onChange={(e) => onUpdate({ cloneSourceUrl: e.target.value })}
          placeholder="https://exemple.com/ma-landing-page"
        />
        <p className="text-xs text-muted-foreground">
          Laissez vide si vous voulez un design généré de zéro par l'IA
        </p>
      </div>

      {data.cloneSourceUrl && (
        <Card className="p-6 space-y-4 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <ExternalLink className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2 flex-1">
              <p className="font-semibold text-sm">Page à analyser :</p>
              <a
                href={data.cloneSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {data.cloneSourceUrl}
              </a>
            </div>
          </div>
        </Card>
      )}

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Important :</strong> Assurez-vous d'avoir les droits nécessaires pour reproduire le design d'une page existante. L'IA créera une version similaire mais avec votre contenu unique.
        </AlertDescription>
      </Alert>
    </div>
  );
}