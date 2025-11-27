import { useState } from "react";
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
  const [customColor, setCustomColor] = useState("#000000");

  const addColor = () => {
    if (data.colors.length < 3) {
      onUpdate({ colors: [...data.colors, customColor] });
    }
  };

  const removeColor = (index: number) => {
    onUpdate({ colors: data.colors.filter((_, i) => i !== index) });
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
        <div className="flex gap-2 flex-wrap">
          {data.colors.map((color, index) => (
            <div key={index} className="relative group">
              <div
                className="w-16 h-16 rounded-lg border-2 border-border shadow-sm"
                style={{ backgroundColor: color }}
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
          ))}
          {data.colors.length < 3 && (
            <div className="flex gap-2">
              <Input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-16 h-16 cursor-pointer"
              />
              <Button
                variant="outline"
                onClick={addColor}
                className="h-16"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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

      {/* Preview */}
      <Card className="p-6" style={{
        background: `linear-gradient(135deg, ${data.colors[0] || '#d97706'}20, ${data.colors[1] || '#f59e0b'}10)`
      }}>
        <div className="space-y-3">
          <h4
            style={{ fontFamily: data.fonts.heading, color: data.colors[0] || '#d97706' }}
            className="text-2xl font-bold"
          >
            Aperçu du Design
          </h4>
          <p style={{ fontFamily: data.fonts.body }} className="text-muted-foreground">
            Voici comment votre landing page utilisera ces couleurs et polices
          </p>
        </div>
      </Card>
    </div>
  );
}