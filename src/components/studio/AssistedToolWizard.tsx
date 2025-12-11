import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, ArrowRight, Sparkles, Check, HelpCircle, Calculator, 
  ListChecks, SlidersHorizontal, FileText, Gamepad2 
} from 'lucide-react';

interface WizardAnswers {
  toolType: string;
  mainGoal: string;
  targetAudience: string;
  interactionLevel: string;
  visualStyle: string;
  specificFeatures: string;
  contentDetails: string;
}

interface AssistedToolWizardProps {
  onComplete: (generatedPrompt: string, category: string) => void;
  onCancel: () => void;
  lessonContext?: {
    title?: string;
    objective?: string;
  };
  courseContext?: {
    title?: string;
    specialty?: string;
  };
}

const TOOL_TYPES = [
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Tester les connaissances avec des QCM' },
  { id: 'calculator', label: 'Calculateur', icon: Calculator, description: 'Effectuer des calculs spécifiques' },
  { id: 'checklist', label: 'Checklist', icon: ListChecks, description: 'Suivre une liste de tâches' },
  { id: 'simulator', label: 'Simulateur', icon: SlidersHorizontal, description: 'Visualiser des scénarios' },
  { id: 'form', label: 'Formulaire', icon: FileText, description: 'Collecter des réponses' },
  { id: 'game', label: 'Mini-jeu', icon: Gamepad2, description: 'Apprendre en jouant' },
];

const INTERACTION_LEVELS = [
  { id: 'simple', label: 'Simple', description: 'Interactions basiques (cliquer, saisir)' },
  { id: 'medium', label: 'Intermédiaire', description: 'Plusieurs étapes, feedback visuel' },
  { id: 'advanced', label: 'Avancé', description: 'Logique complexe, animations, graphiques' },
];

const VISUAL_STYLES = [
  { id: 'modern', label: 'Moderne & épuré', description: 'Design minimaliste avec dégradés' },
  { id: 'colorful', label: 'Coloré & ludique', description: 'Couleurs vives, animations fun' },
  { id: 'professional', label: 'Professionnel', description: 'Sobre, corporate, sérieux' },
  { id: 'playful', label: 'Gamifié', description: 'Badges, scores, progression' },
];

const WIZARD_STEPS = [
  { id: 'toolType', title: 'Type d\'outil', description: 'Quel type d\'outil souhaitez-vous créer ?' },
  { id: 'mainGoal', title: 'Objectif principal', description: 'Que doit accomplir cet outil ?' },
  { id: 'targetAudience', title: 'Public cible', description: 'À qui s\'adresse cet outil ?' },
  { id: 'interactionLevel', title: 'Niveau d\'interaction', description: 'Quelle complexité d\'interactions ?' },
  { id: 'visualStyle', title: 'Style visuel', description: 'Quel style de design préférez-vous ?' },
  { id: 'specificFeatures', title: 'Fonctionnalités', description: 'Quelles fonctionnalités spécifiques ?' },
  { id: 'contentDetails', title: 'Contenu détaillé', description: 'Décrivez le contenu précis de l\'outil' },
];

export function AssistedToolWizard({ onComplete, onCancel, lessonContext, courseContext }: AssistedToolWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({
    toolType: '',
    mainGoal: '',
    targetAudience: '',
    interactionLevel: 'medium',
    visualStyle: 'modern',
    specificFeatures: '',
    contentDetails: '',
  });

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  const currentStepData = WIZARD_STEPS[currentStep];

  const updateAnswer = (key: keyof WizardAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!answers.toolType;
      case 1: return answers.mainGoal.trim().length >= 10;
      case 2: return answers.targetAudience.trim().length >= 5;
      case 3: return !!answers.interactionLevel;
      case 4: return !!answers.visualStyle;
      case 5: return true; // Optional
      case 6: return answers.contentDetails.trim().length >= 20;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Generate the final prompt
      const prompt = generatePromptFromAnswers();
      onComplete(prompt, answers.toolType);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const generatePromptFromAnswers = (): string => {
    const toolTypeLabel = TOOL_TYPES.find(t => t.id === answers.toolType)?.label || answers.toolType;
    const interactionLabel = INTERACTION_LEVELS.find(i => i.id === answers.interactionLevel)?.description || '';
    const visualLabel = VISUAL_STYLES.find(v => v.id === answers.visualStyle)?.label || '';

    let prompt = `Crée un ${toolTypeLabel.toLowerCase()} interactif avec les caractéristiques suivantes :\n\n`;
    
    prompt += `**Objectif principal :** ${answers.mainGoal}\n\n`;
    prompt += `**Public cible :** ${answers.targetAudience}\n\n`;
    prompt += `**Niveau d'interaction :** ${interactionLabel}\n\n`;
    prompt += `**Style visuel :** ${visualLabel}\n\n`;
    
    if (answers.specificFeatures.trim()) {
      prompt += `**Fonctionnalités spécifiques :** ${answers.specificFeatures}\n\n`;
    }
    
    prompt += `**Contenu détaillé :**\n${answers.contentDetails}\n\n`;
    
    // Add context if available
    if (lessonContext?.title || courseContext?.title) {
      prompt += `**Contexte :** `;
      if (courseContext?.title) prompt += `Cours "${courseContext.title}"`;
      if (courseContext?.specialty) prompt += ` (${courseContext.specialty})`;
      if (lessonContext?.title) prompt += `, Leçon "${lessonContext.title}"`;
      if (lessonContext?.objective) prompt += ` - Objectif: ${lessonContext.objective}`;
    }

    return prompt;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Tool Type
        return (
          <div className="grid grid-cols-2 gap-3">
            {TOOL_TYPES.map((type) => {
              const IconComponent = type.icon;
              const isSelected = answers.toolType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => updateAnswer('toolType', type.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <IconComponent className={`h-6 w-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );

      case 1: // Main Goal
        return (
          <div className="space-y-4">
            <div>
              <Label>Décrivez l'objectif principal de l'outil</Label>
              <Textarea
                value={answers.mainGoal}
                onChange={(e) => updateAnswer('mainGoal', e.target.value)}
                placeholder="Ex: Permettre aux étudiants de calculer leur budget mensuel et d'identifier les postes d'économies potentiels"
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 10 caractères. Soyez précis sur ce que l'utilisateur doit pouvoir faire.
              </p>
            </div>
            {lessonContext?.objective && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>💡 Objectif de la leçon :</strong> {lessonContext.objective}
                </p>
              </div>
            )}
          </div>
        );

      case 2: // Target Audience
        return (
          <div className="space-y-4">
            <div>
              <Label>À qui s'adresse cet outil ?</Label>
              <Input
                value={answers.targetAudience}
                onChange={(e) => updateAnswer('targetAudience', e.target.value)}
                placeholder="Ex: Entrepreneurs débutants, étudiants en marketing, professionnels RH..."
                className="mt-2"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['Débutants', 'Intermédiaires', 'Experts', 'Tout public'].map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateAnswer('targetAudience', answers.targetAudience ? `${answers.targetAudience}, ${suggestion.toLowerCase()}` : suggestion)}
                >
                  + {suggestion}
                </Button>
              ))}
            </div>
          </div>
        );

      case 3: // Interaction Level
        return (
          <RadioGroup
            value={answers.interactionLevel}
            onValueChange={(value) => updateAnswer('interactionLevel', value)}
            className="space-y-3"
          >
            {INTERACTION_LEVELS.map((level) => (
              <div key={level.id} className="flex items-center space-x-3">
                <RadioGroupItem value={level.id} id={level.id} />
                <Label htmlFor={level.id} className="flex-1 cursor-pointer">
                  <span className="font-medium">{level.label}</span>
                  <span className="text-muted-foreground text-sm ml-2">- {level.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 4: // Visual Style
        return (
          <RadioGroup
            value={answers.visualStyle}
            onValueChange={(value) => updateAnswer('visualStyle', value)}
            className="space-y-3"
          >
            {VISUAL_STYLES.map((style) => (
              <div key={style.id} className="flex items-center space-x-3">
                <RadioGroupItem value={style.id} id={style.id} />
                <Label htmlFor={style.id} className="flex-1 cursor-pointer">
                  <span className="font-medium">{style.label}</span>
                  <span className="text-muted-foreground text-sm ml-2">- {style.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 5: // Specific Features
        return (
          <div className="space-y-4">
            <div>
              <Label>Fonctionnalités spécifiques (optionnel)</Label>
              <Textarea
                value={answers.specificFeatures}
                onChange={(e) => updateAnswer('specificFeatures', e.target.value)}
                placeholder="Ex: Timer de 30 secondes par question, sauvegarde des résultats, graphique de progression, export PDF..."
                rows={3}
                className="mt-2"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {getFeatureSuggestions().map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateAnswer('specificFeatures', answers.specificFeatures ? `${answers.specificFeatures}, ${suggestion}` : suggestion)}
                >
                  + {suggestion}
                </Button>
              ))}
            </div>
          </div>
        );

      case 6: // Content Details
        return (
          <div className="space-y-4">
            <div>
              <Label>Décrivez le contenu précis de l'outil</Label>
              <Textarea
                value={answers.contentDetails}
                onChange={(e) => updateAnswer('contentDetails', e.target.value)}
                placeholder={getContentPlaceholder()}
                rows={6}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 20 caractères. Plus vous êtes précis, meilleur sera le résultat.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getFeatureSuggestions = (): string[] => {
    switch (answers.toolType) {
      case 'quiz':
        return ['Timer', 'Explications après réponse', 'Score final', 'Mode révision', 'Niveaux de difficulté'];
      case 'calculator':
        return ['Graphique des résultats', 'Comparaison de scénarios', 'Export des données', 'Historique'];
      case 'checklist':
        return ['Barre de progression', 'Sauvegarde locale', 'Notifications', 'Catégories'];
      case 'simulator':
        return ['Sliders interactifs', 'Graphiques temps réel', 'Comparaison avant/après', 'Scénarios prédéfinis'];
      case 'form':
        return ['Validation en temps réel', 'Récapitulatif', 'Conditionnalité', 'Score/résultat'];
      case 'game':
        return ['Système de points', 'Niveaux', 'Classement', 'Timer', 'Badges'];
      default:
        return ['Animations', 'Feedback visuel', 'Responsive', 'Accessibilité'];
    }
  };

  const getContentPlaceholder = (): string => {
    switch (answers.toolType) {
      case 'quiz':
        return "Listez les questions et réponses :\n- Question 1: ...\n  a) Réponse A\n  b) Réponse B (correcte)\n  c) Réponse C\n\n- Question 2: ...";
      case 'calculator':
        return "Décrivez les formules et champs :\n- Champ 1: Revenus mensuels\n- Champ 2: Dépenses fixes\n- Calcul: Épargne = Revenus - Dépenses\n- Résultat: Taux d'épargne en %";
      case 'checklist':
        return "Listez les éléments à cocher :\n1. Première tâche\n2. Deuxième tâche\n3. ...";
      case 'simulator':
        return "Décrivez les paramètres et visualisations :\n- Paramètre 1: Capital initial (slider 0-100000€)\n- Paramètre 2: Taux d'intérêt (1-10%)\n- Affichage: Graphique de croissance sur 10 ans";
      case 'form':
        return "Décrivez les champs du formulaire :\n- Nom (texte, obligatoire)\n- Email (email, obligatoire)\n- Niveau (select: débutant/intermédiaire/expert)\n- Message (textarea)";
      case 'game':
        return "Décrivez les mécaniques du jeu :\n- Objectif: Associer les termes à leurs définitions\n- Scoring: +10 points par bonne réponse\n- Timer: 60 secondes\n- Contenu: [liste des paires à associer]";
      default:
        return "Décrivez en détail le contenu et le fonctionnement de l'outil...";
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mode assisté
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            Étape {currentStep + 1}/{WIZARD_STEPS.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step header */}
        <div>
          <h3 className="font-semibold text-lg">{currentStepData.title}</h3>
          <p className="text-muted-foreground text-sm">{currentStepData.description}</p>
        </div>

        {/* Step content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onCancel : handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? 'Annuler' : 'Retour'}
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === WIZARD_STEPS.length - 1 ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer l'outil
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
