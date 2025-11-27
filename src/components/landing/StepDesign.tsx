import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X, Palette } from "lucide-react";
import { WizardData } from "./LandingPageWizard";

interface StepDesignProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const SUGGESTED_PALETTES = [
  { name: "Ambré Premium", colors: ["#d97706", "#f59e0b", "#fbbf24"] },
  { name: "Océan Profond", colors: ["#0891b2", "#06b6d4", "#22d3ee"] },
  { name: "Violet Royal", colors: ["#7c3aed", "#8b5cf6", "#a78bfa"] },
  { name: "Rose Élégant", colors: ["#db2777", "#ec4899", "#f472b6"] },
  { name: "Vert Naturel", colors: ["#059669", "#10b981", "#34d399"] },
];

const FONT_OPTIONS = [
  "Inter",
  "Playfair Display",
  "Montserrat",
  "Lora",
  "Raleway",
  "Poppins",
  "Merriweather",
];

export function StepDesign({ data, onUpdate }: StepDesignProps) {
  const addColor = () => {
    if (data.colors.length < 3) {
      onUpdate({ colors: [...data.colors, "#d97706"] });
    }
  };

  const removeColor = (index: number) => {
    onUpdate({ colors: data.colors.filter((_, i) => i !== index) });
  };

  const updateColor = (index: number, color: string) => {
    const newColors = [...data.colors];
    newColors[index] = color;
    onUpdate({ colors: newColors });
  };

  const applyPalette = (colors: string[]) => {
    onUpdate({ colors });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2">Design & Identité Visuelle</h3>
        <p className="text-muted-foreground">
          Choisissez les couleurs et polices pour votre landing page (max 3 couleurs, 2 polices)
        </p>
      </div>

      {/* Color Selection */}
      <div className="space-y-4">
        <Label className="text-base">Couleurs ({data.colors.length}/3)</Label>
        
        {/* Suggested Palettes */}
        <div className="grid grid-cols-2 gap-3">
          {SUGGESTED_PALETTES.map((palette) => (
            <Card
              key={palette.name}
              className="p-4 cursor-pointer hover:border-primary transition-all"
              onClick={() => applyPalette(palette.colors)}
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {palette.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{palette.name}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Current Colors */}
        <div className="flex gap-4 flex-wrap items-start">
          {data.colors.map((color, index) => (
            <div key={index} className="relative group space-y-2">
              <div className="relative">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  className="w-24 h-24 cursor-pointer border-2 border-border rounded-lg p-1"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeColor(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input
                type="text"
                value={color}
                onChange={(e) => updateColor(index, e.target.value)}
                className="w-24 text-xs text-center"
                placeholder="#000000"
              />
            </div>
          ))}
          {data.colors.length < 3 && (
            <Button
              variant="outline"
              onClick={addColor}
              className="w-24 h-24 flex flex-col items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Ajouter</span>
            </Button>
          )}
        </div>
      </div>

      {/* Font Selection */}
      <div className="space-y-4">
        <Label className="text-base">Polices</Label>
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Police de titre</Label>
            <select
              value={data.fonts.heading}
              onChange={(e) =>
                onUpdate({ fonts: { ...data.fonts, heading: e.target.value } })
              }
              className="w-full p-2 border rounded-lg bg-background"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Police de corps</Label>
            <select
              value={data.fonts.body}
              onChange={(e) =>
                onUpdate({ fonts: { ...data.fonts, body: e.target.value } })
              }
              className="w-full p-2 border rounded-lg bg-background"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

    </div>
  );
}