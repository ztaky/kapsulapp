import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import { WizardData } from "./LandingPageWizard";

interface StepReferencesProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

export function StepReferences({ data, onUpdate }: StepReferencesProps) {
  const addScreenshot = (url: string) => {
    if (url && data.referenceScreenshots.length < 5) {
      onUpdate({
        referenceScreenshots: [...data.referenceScreenshots, url],
      });
    }
  };

  const removeScreenshot = (index: number) => {
    onUpdate({
      referenceScreenshots: data.referenceScreenshots.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Références Visuelles</h3>
        <p className="text-muted-foreground">
          Partagez des screenshots de designs qui vous inspirent (optionnel mais recommandé)
        </p>
      </div>

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="h-4 w-4 text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Pourquoi ajouter des références ?</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• L'IA analysera ces designs pour s'inspirer du style</li>
              <li>• Améliore la cohérence visuelle de votre landing page</li>
              <li>• Permet de créer un design unique mais familier</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Screenshot Input */}
      <div className="space-y-2">
        <Label>URLs des screenshots ({data.referenceScreenshots.length}/5)</Label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://exemple.com/screenshot.jpg"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addScreenshot((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
          <Button
            variant="outline"
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              addScreenshot(input.value);
              input.value = "";
            }}
            disabled={data.referenceScreenshots.length >= 5}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Appuyez sur Entrée ou cliquez sur + pour ajouter
        </p>
      </div>

      {/* Screenshot Grid */}
      {data.referenceScreenshots.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {data.referenceScreenshots.map((url, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <img
                src={url}
                alt={`Référence ${index + 1}`}
                className="w-full h-40 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Image+non+disponible";
                }}
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeScreenshot(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {data.referenceScreenshots.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucune référence ajoutée. C'est optionnel, mais cela améliore le résultat.
          </p>
        </Card>
      )}
    </div>
  );
}