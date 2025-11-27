import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Users, Target, TrendingUp, Heart } from "lucide-react";
import { WizardData } from "./LandingPageWizard";

interface StepTargetAudienceProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const GUIDING_QUESTIONS = [
  { icon: Users, question: "Quel est le profil démographique ?", example: "Entrepreneurs 30-45 ans" },
  { icon: Target, question: "Quel est leur objectif principal ?", example: "Augmenter leurs revenus" },
  { icon: TrendingUp, question: "Quel problème cherchent-ils à résoudre ?", example: "Manque de temps et d'organisation" },
  { icon: Heart, question: "Quelles sont leurs motivations ?", example: "Liberté financière, plus de temps en famille" },
];

export function StepTargetAudience({ data, onUpdate }: StepTargetAudienceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Client Cible</h3>
        <p className="text-muted-foreground">
          Plus vous êtes précis sur votre client idéal, plus le copywriting sera percutant
        </p>
      </div>

      {/* Guiding Questions */}
      <div className="grid grid-cols-2 gap-4">
        {GUIDING_QUESTIONS.map((item, index) => (
          <Card key={index} className="p-4 space-y-2 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-primary">
              <item.icon className="h-5 w-5" />
              <span className="font-semibold text-sm">{item.question}</span>
            </div>
            <p className="text-xs text-muted-foreground italic">Ex: {item.example}</p>
          </Card>
        ))}
      </div>

      {/* Target Audience Input */}
      <div className="space-y-2">
        <Label>Description du client cible *</Label>
        <Textarea
          value={data.targetAudience}
          onChange={(e) => onUpdate({ targetAudience: e.target.value })}
          placeholder="Décrivez en détail votre client idéal : qui est-il ? quels sont ses défis ? ses aspirations ? son niveau d'expérience ?&#10;&#10;Exemple : Mon client idéal est un entrepreneur débutant entre 25-40 ans qui a lancé son activité il y a moins de 2 ans. Il travaille seul ou avec une petite équipe, génère moins de 50k€ de CA annuel, et lutte pour attirer des clients de manière régulière. Il passe trop de temps sur les tâches administratives et pas assez sur la prospection. Il rêve d'avoir un système d'acquisition client automatisé et de doubler son CA dans les 12 prochains mois."
          rows={10}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Plus vous donnez de détails, meilleur sera le copywriting
        </p>
      </div>

      {/* AI Suggestion Card */}
      {data.courseName && (
        <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">IA</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Suggestion de l'IA</p>
              <p className="text-xs text-muted-foreground">
                Basé sur votre formation "{data.courseName}", votre client cible semble être quelqu'un qui cherche à développer des compétences spécifiques dans ce domaine. Affinez cette description avec plus de détails sur leur situation actuelle et leurs objectifs.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}