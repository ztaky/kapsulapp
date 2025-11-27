import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X, Sun, Moon } from "lucide-react";
import { WizardData } from "./LandingPageWizard";

interface StepDesignProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const SUGGESTED_PALETTES_LIGHT = [
  { name: "Ambré Premium", colors: ["#d97706", "#f59e0b"] },
  { name: "Océan Profond", colors: ["#0891b2", "#06b6d4"] },
  { name: "Violet Royal", colors: ["#7c3aed", "#8b5cf6"] },
  { name: "Rose Élégant", colors: ["#db2777", "#ec4899"] },
  { name: "Vert Naturel", colors: ["#059669", "#10b981"] },
  { name: "Bleu Confiance", colors: ["#2563eb", "#3b82f6"] },
];

const SUGGESTED_PALETTES_DARK = [
  { name: "Or Premium", colors: ["#fbbf24", "#f59e0b"] },
  { name: "Cyan Néon", colors: ["#22d3ee", "#06b6d4"] },
  { name: "Lavande Néon", colors: ["#a78bfa", "#8b5cf6"] },
  { name: "Rose Néon", colors: ["#f472b6", "#ec4899"] },
  { name: "Émeraude", colors: ["#34d399", "#10b981"] },
  { name: "Bleu Électrique", colors: ["#60a5fa", "#3b82f6"] },
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
  const theme = data.theme || 'light';
  const suggestedPalettes = theme === 'dark' ? SUGGESTED_PALETTES_DARK : SUGGESTED_PALETTES_LIGHT;

  const updateColor = (index: number, color: string) => {
    const newColors = [...data.colors];
    newColors[index] = color;
    onUpdate({ colors: newColors.slice(0, 2) });
  };

  const applyPalette = (colors: string[]) => {
    onUpdate({ colors: colors.slice(0, 2) });
  };

  const toggleTheme = () => {
    onUpdate({ theme: theme === 'light' ? 'dark' : 'light' });
  };

  // Initialize with 2 colors if more exist
  if (data.colors.length > 2) {
    onUpdate({ colors: data.colors.slice(0, 2) });
  }
  if (data.colors.length < 2) {
    onUpdate({ colors: [...data.colors, "#f59e0b"].slice(0, 2) });
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2">Design & Identité Visuelle</h3>
        <p className="text-muted-foreground">
          Choisissez le thème et 2 couleurs principales (H1 et H2)
        </p>
      </div>

      {/* Theme Selection */}
      <div className="space-y-4">
        <Label className="text-base">Thème de la page</Label>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Light Theme */}
          <Card
            className={`p-6 cursor-pointer transition-all hover:border-primary ${
              theme === 'light' ? 'border-primary ring-2 ring-primary' : ''
            }`}
            onClick={() => onUpdate({ theme: 'light' })}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-full h-24 rounded-xl bg-gradient-to-b from-gray-50 to-white border flex items-center justify-center">
                <Sun className="h-10 w-10 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Mode Clair</p>
                <p className="text-sm text-muted-foreground">Fond blanc, texte noir</p>
              </div>
            </div>
          </Card>
          
          {/* Dark Theme */}
          <Card
            className={`p-6 cursor-pointer transition-all hover:border-primary ${
              theme === 'dark' ? 'border-primary ring-2 ring-primary' : ''
            }`}
            onClick={() => onUpdate({ theme: 'dark' })}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-full h-24 rounded-xl bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
                <Moon className="h-10 w-10 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Mode Sombre</p>
                <p className="text-sm text-muted-foreground">Fond sombre, texte blanc</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Color Selection - 2 colors only */}
      <div className="space-y-4">
        <Label className="text-base">Couleurs principales (2 max)</Label>
        <p className="text-sm text-muted-foreground">
          <strong>Couleur 1</strong> → Titres H1 • <strong>Couleur 2</strong> → Titres H2
        </p>
        
        {/* Suggested Palettes */}
        <div className="grid grid-cols-2 gap-3">
          {suggestedPalettes.map((palette) => (
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
        <div className="flex gap-6 items-start pt-4">
          {/* Color 1 - H1 */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Couleur 1 (H1)</Label>
            <div className="relative group">
              <Input
                type="color"
                value={data.colors[0] || "#d97706"}
                onChange={(e) => updateColor(0, e.target.value)}
                className="w-20 h-20 cursor-pointer border-2 border-border rounded-lg p-1"
              />
            </div>
            <Input
              type="text"
              value={data.colors[0] || "#d97706"}
              onChange={(e) => updateColor(0, e.target.value)}
              className="w-20 text-xs text-center"
              placeholder="#000000"
            />
          </div>

          {/* Color 2 - H2 */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Couleur 2 (H2)</Label>
            <div className="relative group">
              <Input
                type="color"
                value={data.colors[1] || "#f59e0b"}
                onChange={(e) => updateColor(1, e.target.value)}
                className="w-20 h-20 cursor-pointer border-2 border-border rounded-lg p-1"
              />
            </div>
            <Input
              type="text"
              value={data.colors[1] || "#f59e0b"}
              onChange={(e) => updateColor(1, e.target.value)}
              className="w-20 text-xs text-center"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <Label className="text-base">Aperçu</Label>
        <Card 
          className="p-6 rounded-xl"
          style={{ 
            backgroundColor: theme === 'dark' ? '#1a1a2e' : '#fafafa',
          }}
        >
          <div className="space-y-3">
            <h1 
              className="text-2xl font-bold"
              style={{ color: data.colors[0] || "#d97706" }}
            >
              Titre Principal (H1)
            </h1>
            <h2 
              className="text-xl font-semibold"
              style={{ color: data.colors[1] || "#f59e0b" }}
            >
              Sous-titre (H2)
            </h2>
            <p style={{ color: theme === 'dark' ? '#f5f5f5' : '#1a1a1a' }}>
              Corps de texte standard avec une couleur neutre adaptée au thème.
            </p>
            <p style={{ color: theme === 'dark' ? '#d1d5db' : '#4b5563' }}>
              Sous-texte plus léger pour les descriptions secondaires.
            </p>
          </div>
        </Card>
      </div>

      {/* CTA Style Selection */}
      <div className="space-y-4">
        <Label className="text-base">Style des boutons d'action (CTA)</Label>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Option Solid */}
          <Card
            className={`p-4 cursor-pointer transition-all hover:border-primary ${
              data.ctaStyle === 'solid' ? 'border-primary ring-2 ring-primary' : ''
            }`}
            onClick={() => onUpdate({ ctaStyle: 'solid' })}
          >
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-full h-12 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: data.colors[0] || '#d97706' }}
              >
                Couleur unie
              </div>
              <span className="text-sm text-center">Un seul couleur solide</span>
            </div>
          </Card>
          
          {/* Option Gradient */}
          <Card
            className={`p-4 cursor-pointer transition-all hover:border-primary ${
              data.ctaStyle === 'gradient' ? 'border-primary ring-2 ring-primary' : ''
            }`}
            onClick={() => onUpdate({ ctaStyle: 'gradient' })}
          >
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-full h-12 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ 
                  background: `linear-gradient(135deg, ${data.colors[0] || '#d97706'}, ${data.colors[1] || '#f59e0b'})`
                }}
              >
                Dégradé
              </div>
              <span className="text-sm text-center">Dégradé de 2 couleurs</span>
            </div>
          </Card>
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
