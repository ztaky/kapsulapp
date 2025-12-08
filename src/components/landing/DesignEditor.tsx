import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Palette, Type, Sun, Moon, Check } from "lucide-react";

interface DesignEditorProps {
  designConfig: any;
  onChange: (key: string, value: any) => void;
}

// Available fonts with Google Fonts support
const AVAILABLE_FONTS = [
  { value: "Inter", label: "Inter", category: "Sans-serif" },
  { value: "Poppins", label: "Poppins", category: "Sans-serif" },
  { value: "Montserrat", label: "Montserrat", category: "Sans-serif" },
  { value: "Open Sans", label: "Open Sans", category: "Sans-serif" },
  { value: "Roboto", label: "Roboto", category: "Sans-serif" },
  { value: "Lato", label: "Lato", category: "Sans-serif" },
  { value: "Nunito", label: "Nunito", category: "Sans-serif" },
  { value: "Playfair Display", label: "Playfair Display", category: "Serif" },
  { value: "Merriweather", label: "Merriweather", category: "Serif" },
  { value: "Lora", label: "Lora", category: "Serif" },
  { value: "Georgia", label: "Georgia", category: "Serif" },
  { value: "Space Grotesk", label: "Space Grotesk", category: "Sans-serif" },
  { value: "DM Sans", label: "DM Sans", category: "Sans-serif" },
  { value: "Sora", label: "Sora", category: "Sans-serif" },
];

// Preset color palettes
const COLOR_PRESETS = [
  { name: "Rouge Corail", primary: "#e11d48", secondary: "#9333ea" },
  { name: "Orange Chaleur", primary: "#ea580c", secondary: "#f59e0b" },
  { name: "Bleu Confiance", primary: "#2563eb", secondary: "#3b82f6" },
  { name: "Vert Nature", primary: "#059669", secondary: "#10b981" },
  { name: "Violet Premium", primary: "#7c3aed", secondary: "#8b5cf6" },
  { name: "Rose Moderne", primary: "#db2777", secondary: "#ec4899" },
  { name: "Indigo Pro", primary: "#4f46e5", secondary: "#6366f1" },
  { name: "Cyan Tech", primary: "#0891b2", secondary: "#06b6d4" },
];

export function DesignEditor({ designConfig, onChange }: DesignEditorProps) {
  const colors = designConfig?.colors || ["#ea580c", "#f59e0b"];
  const fonts = designConfig?.fonts || { heading: "Inter", body: "Inter" };
  const theme = designConfig?.theme || "light";

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    onChange("colors", newColors);
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    onChange("colors", [preset.primary, preset.secondary]);
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-1">
        {/* Theme Toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "light" ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-400" />
              )}
              <div>
                <Label className="text-sm font-medium">Thème</Label>
                <p className="text-xs text-muted-foreground">
                  {theme === "light" ? "Mode clair" : "Mode sombre"}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => onChange("theme", checked ? "dark" : "light")}
            />
          </div>
        </Card>

        {/* Color Section */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Couleurs</Label>
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Couleur principale</Label>
              <div className="flex items-center gap-2">
                <div 
                  className="relative w-12 h-12 rounded-lg border-2 border-border overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: colors[0] }}
                >
                  <Input
                    type="color"
                    value={colors[0]}
                    onChange={(e) => handleColorChange(0, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <Input
                  value={colors[0]}
                  onChange={(e) => handleColorChange(0, e.target.value)}
                  className="flex-1 font-mono text-xs uppercase"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Couleur secondaire</Label>
              <div className="flex items-center gap-2">
                <div 
                  className="relative w-12 h-12 rounded-lg border-2 border-border overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: colors[1] }}
                >
                  <Input
                    type="color"
                    value={colors[1]}
                    onChange={(e) => handleColorChange(1, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <Input
                  value={colors[1]}
                  onChange={(e) => handleColorChange(1, e.target.value)}
                  className="flex-1 font-mono text-xs uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Gradient Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Aperçu du gradient</Label>
            <div 
              className="h-12 rounded-lg shadow-inner"
              style={{ 
                background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` 
              }}
            />
          </div>

          {/* Color Presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Palettes prédéfinies</Label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isActive = colors[0] === preset.primary && colors[1] === preset.secondary;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={`relative group p-1 rounded-lg transition-all ${
                      isActive 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:ring-2 hover:ring-muted-foreground/20'
                    }`}
                    title={preset.name}
                  >
                    <div 
                      className="h-8 rounded-md"
                      style={{ 
                        background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` 
                      }}
                    />
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Typography Section */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Type className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Typographie</Label>
          </div>

          {/* Heading Font */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Police des titres</Label>
            <Select 
              value={fonts.heading} 
              onValueChange={(value) => onChange("fonts", { ...fonts, heading: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_FONTS.map((font) => (
                  <SelectItem 
                    key={font.value} 
                    value={font.value}
                    style={{ fontFamily: font.value }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{font.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{font.category}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div 
              className="p-3 rounded-lg bg-muted/50 text-lg font-bold"
              style={{ fontFamily: fonts.heading }}
            >
              Aperçu du titre
            </div>
          </div>

          {/* Body Font */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Police du texte</Label>
            <Select 
              value={fonts.body} 
              onValueChange={(value) => onChange("fonts", { ...fonts, body: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_FONTS.map((font) => (
                  <SelectItem 
                    key={font.value} 
                    value={font.value}
                    style={{ fontFamily: font.value }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{font.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{font.category}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div 
              className="p-3 rounded-lg bg-muted/50 text-sm"
              style={{ fontFamily: fonts.body }}
            >
              Voici un aperçu du texte de paragraphe avec la police sélectionnée.
            </div>
          </div>

          {/* Combined Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Aperçu combiné</Label>
            <div 
              className="p-4 rounded-lg border"
              style={{ 
                background: theme === 'dark' ? '#0a0e27' : '#fef8f3',
                color: theme === 'dark' ? '#ffffff' : '#1a1a1a'
              }}
            >
              <h3 
                className="text-xl font-bold mb-2"
                style={{ fontFamily: fonts.heading }}
              >
                Titre de section
              </h3>
              <p 
                className="text-sm opacity-80"
                style={{ fontFamily: fonts.body }}
              >
                Description du contenu avec la police de corps sélectionnée.
              </p>
              <button
                className="mt-3 px-4 py-2 rounded-full text-white text-sm font-medium"
                style={{ 
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                  fontFamily: fonts.body
                }}
              >
                Bouton d'action
              </button>
            </div>
          </div>
        </Card>

        {/* CTA Style */}
        <Card className="p-4 space-y-4">
          <Label className="text-sm font-medium">Style des boutons</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onChange("ctaStyle", "gradient")}
              className={`p-3 rounded-lg border-2 transition-all ${
                designConfig?.ctaStyle !== 'solid' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div 
                className="h-8 rounded-md mb-2"
                style={{ 
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` 
                }}
              />
              <span className="text-xs font-medium">Gradient</span>
            </button>
            <button
              onClick={() => onChange("ctaStyle", "solid")}
              className={`p-3 rounded-lg border-2 transition-all ${
                designConfig?.ctaStyle === 'solid' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div 
                className="h-8 rounded-md mb-2"
                style={{ backgroundColor: colors[0] }}
              />
              <span className="text-xs font-medium">Solide</span>
            </button>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}