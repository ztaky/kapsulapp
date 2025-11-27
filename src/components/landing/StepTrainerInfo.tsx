import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X, User, Sparkles } from "lucide-react";
import { WizardData } from "./LandingPageWizard";

interface StepTrainerInfoProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const SOCIAL_PLATFORMS = ["LinkedIn", "Instagram", "Twitter", "Facebook", "YouTube", "TikTok"];

export function StepTrainerInfo({ data, onUpdate }: StepTrainerInfoProps) {
  const addSocialLink = () => {
    onUpdate({
      trainerSocials: [...data.trainerSocials, { platform: "LinkedIn", url: "" }],
    });
  };

  const removeSocialLink = (index: number) => {
    onUpdate({
      trainerSocials: data.trainerSocials.filter((_, i) => i !== index),
    });
  };

  const updateSocialLink = (index: number, field: "platform" | "url", value: string) => {
    const updated = [...data.trainerSocials];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ trainerSocials: updated });
  };

  const generateBioWithAI = () => {
    // TODO: Call AI to generate a professional bio
    const aiSuggestion = `Expert passionné avec plus de 10 ans d'expérience dans le domaine. J'ai accompagné des centaines de personnes à atteindre leurs objectifs grâce à des méthodes éprouvées et un accompagnement personnalisé.`;
    onUpdate({ trainerBio: aiSuggestion });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Informations Formateur</h3>
        <p className="text-muted-foreground">
          Mettez en avant votre expertise et votre crédibilité
        </p>
      </div>

      {/* Trainer Name */}
      <div className="space-y-2">
        <Label>Nom complet *</Label>
        <Input
          value={data.trainerName}
          onChange={(e) => onUpdate({ trainerName: e.target.value })}
          placeholder="Ex: Marie Dubois"
        />
      </div>

      {/* Trainer Photo */}
      <div className="space-y-2">
        <Label>Photo professionnelle</Label>
        <div className="flex items-center gap-4">
          {data.trainerPhoto ? (
            <div className="relative">
              <img
                src={data.trainerPhoto}
                alt="Formateur"
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                onClick={() => onUpdate({ trainerPhoto: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <Input
            type="url"
            placeholder="URL de votre photo"
            onChange={(e) => onUpdate({ trainerPhoto: e.target.value })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Une photo professionnelle augmente la crédibilité de 67%
        </p>
      </div>

      {/* Trainer Bio */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Bio courte *</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={generateBioWithAI}
            className="text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Générer avec l'IA
          </Button>
        </div>
        <Textarea
          value={data.trainerBio}
          onChange={(e) => onUpdate({ trainerBio: e.target.value })}
          placeholder="Parlez de votre parcours, vos résultats, ce qui vous rend unique...&#10;&#10;Ex: Après 15 ans en tant que directrice marketing, j'ai décidé de partager mes stratégies qui ont généré +10M€ de revenus pour mes clients. Ma mission : aider les entrepreneurs à maîtriser le marketing digital sans se ruiner."
          rows={6}
          className="resize-none"
        />
      </div>

      {/* Social Links */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Réseaux sociaux (optionnel)</Label>
          <Button size="sm" variant="outline" onClick={addSocialLink}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {data.trainerSocials.map((social, index) => (
          <Card key={index} className="p-3 flex items-center gap-3">
            <select
              value={social.platform}
              onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
              className="p-2 border rounded-lg bg-background"
            >
              {SOCIAL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <Input
              value={social.url}
              onChange={(e) => updateSocialLink(index, "url", e.target.value)}
              placeholder="URL du profil"
              className="flex-1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeSocialLink(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}