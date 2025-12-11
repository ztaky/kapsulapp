import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, Loader2, RefreshCw, Check, Eye, Calculator, ListChecks, 
  HelpCircle, Gamepad2, SlidersHorizontal, FileText, MessageSquare, Code, 
  Send, AlertTriangle, CheckCircle2, Wand2, Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AssistedToolWizard } from './AssistedToolWizard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIToolBuilderProps {
  toolConfig: {
    description?: string;
    generatedCode?: string;
    generatedAt?: string;
    category?: string;
    conversationHistory?: ConversationMessage[];
  };
  onChange: (config: any) => void;
  organizationId?: string;
  lessonContext?: {
    title?: string;
    objective?: string;
    content?: string;
  };
  courseContext?: {
    title?: string;
    description?: string;
    specialty?: string;
  };
}

const TOOL_CATEGORIES = [
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Questions à choix multiples avec score', color: 'from-purple-500 to-indigo-500' },
  { id: 'calculator', label: 'Calculateur', icon: Calculator, description: 'Calculs et formules interactives', color: 'from-green-500 to-emerald-500' },
  { id: 'checklist', label: 'Checklist', icon: ListChecks, description: 'Liste de tâches avec progression', color: 'from-orange-500 to-amber-500' },
  { id: 'simulator', label: 'Simulateur', icon: SlidersHorizontal, description: 'Visualisation dynamique', color: 'from-blue-500 to-cyan-500' },
  { id: 'form', label: 'Formulaire', icon: FileText, description: 'Formulaire interactif avec validation', color: 'from-pink-500 to-rose-500' },
  { id: 'game', label: 'Mini-jeu', icon: Gamepad2, description: 'Jeu éducatif ludique', color: 'from-red-500 to-orange-500' },
];

const EXAMPLE_PROMPTS_BY_CATEGORY: Record<string, string[]> = {
  quiz: [
    "Un quiz de 5 questions sur les bases de la nutrition avec explications",
    "Un quiz sur les règles de grammaire française avec 3 niveaux de difficulté",
    "Un quiz interactif sur l'histoire de France avec images",
  ],
  calculator: [
    "Un calculateur de calories journalières basé sur le poids, la taille, l'âge et l'activité",
    "Un calculateur d'IMC avec interprétation des résultats et conseils",
    "Un convertisseur d'unités (kg/lbs, km/miles, °C/°F)",
    "Un calculateur de pourcentage de réduction pour les soldes",
  ],
  checklist: [
    "Une checklist de préparation à un entretien d'embauche",
    "Un tracker d'habitudes quotidiennes (sport, méditation, lecture)",
    "Une liste de contrôle pour un projet avec progression",
  ],
  simulator: [
    "Un simulateur d'épargne avec intérêts composés sur plusieurs années",
    "Un visualiseur de budget mensuel avec graphiques",
    "Un simulateur de croissance d'investissement",
  ],
  form: [
    "Un formulaire de diagnostic de niveau en anglais",
    "Un questionnaire d'auto-évaluation des compétences professionnelles",
    "Un formulaire d'inscription avec validation en temps réel",
  ],
  game: [
    "Un memory game sur le vocabulaire anglais",
    "Un jeu de rapidité pour apprendre les tables de multiplication",
    "Un puzzle de mots pour enrichir le vocabulaire",
  ],
};

const REFINEMENT_SUGGESTIONS = [
  "Change les couleurs en bleu et violet",
  "Ajoute un bouton de réinitialisation",
  "Ajoute des animations plus fluides",
  "Rends l'interface plus compacte",
  "Ajoute un compteur de temps",
  "Améliore le feedback visuel",
  "Ajoute un graphique de résultats",
  "Rends le design plus moderne",
];

// Simple HTML validation
function validateHtmlCode(code: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!code || code.trim().length === 0) {
    return { isValid: false, errors: ['Le code est vide'] };
  }

  // Check for basic HTML structure
  const hasStyleOrDiv = /<style[\s\S]*?>|<div[\s\S]*?>/i.test(code);
  if (!hasStyleOrDiv) {
    errors.push('Le code doit contenir au moins une balise <style> ou <div>');
  }

  // Check for unclosed tags (basic check)
  const openTags = code.match(/<([a-z][a-z0-9]*)\b[^>]*>/gi) || [];
  const closeTags = code.match(/<\/([a-z][a-z0-9]*)\s*>/gi) || [];
  const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
  
  const openTagCounts: Record<string, number> = {};
  const closeTagCounts: Record<string, number> = {};
  
  openTags.forEach(tag => {
    const match = tag.match(/<([a-z][a-z0-9]*)/i);
    if (match && !selfClosing.includes(match[1].toLowerCase())) {
      const tagName = match[1].toLowerCase();
      openTagCounts[tagName] = (openTagCounts[tagName] || 0) + 1;
    }
  });
  
  closeTags.forEach(tag => {
    const match = tag.match(/<\/([a-z][a-z0-9]*)/i);
    if (match) {
      const tagName = match[1].toLowerCase();
      closeTagCounts[tagName] = (closeTagCounts[tagName] || 0) + 1;
    }
  });
  
  Object.keys(openTagCounts).forEach(tag => {
    const openCount = openTagCounts[tag] || 0;
    const closeCount = closeTagCounts[tag] || 0;
    if (openCount > closeCount) {
      errors.push(`Balise <${tag}> non fermée (${openCount - closeCount} manquante(s))`);
    }
  });

  // Check for basic JavaScript syntax issues
  const scriptMatch = code.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
  if (scriptMatch) {
    scriptMatch.forEach(script => {
      const jsCode = script.replace(/<\/?script[^>]*>/gi, '');
      // Check for common JS errors
      const openBraces = (jsCode.match(/{/g) || []).length;
      const closeBraces = (jsCode.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push(`JavaScript: accolades non équilibrées ({: ${openBraces}, }: ${closeBraces})`);
      }
      
      const openParens = (jsCode.match(/\(/g) || []).length;
      const closeParens = (jsCode.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push(`JavaScript: parenthèses non équilibrées ((: ${openParens}, ): ${closeParens})`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}

export function AIToolBuilder({ toolConfig, onChange, organizationId, lessonContext, courseContext }: AIToolBuilderProps) {
  const [description, setDescription] = useState(toolConfig.description || '');
  const [category, setCategory] = useState(toolConfig.category || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'assisted' | 'refine' | 'code'>('generate');
  const [showWizard, setShowWizard] = useState(false);
  const [refinementMessage, setRefinementMessage] = useState('');
  const [editedCode, setEditedCode] = useState(toolConfig.generatedCode || '');
  const [codeValidation, setCodeValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>(
    toolConfig.conversationHistory || []
  );
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync editedCode when generatedCode changes externally
  useEffect(() => {
    if (toolConfig.generatedCode && toolConfig.generatedCode !== editedCode) {
      setEditedCode(toolConfig.generatedCode);
    }
  }, [toolConfig.generatedCode]);

  // Validate code when it changes in code editor
  useEffect(() => {
    if (activeTab === 'code' && editedCode) {
      const validation = validateHtmlCode(editedCode);
      setCodeValidation(validation);
    }
  }, [editedCode, activeTab]);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (activeTab === 'refine' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, activeTab]);

  const generateTool = async (isRefinement = false, customMessage?: string) => {
    const messageToSend = isRefinement ? (customMessage || refinementMessage) : description;
    
    if (!messageToSend.trim()) {
      toast.error(isRefinement 
        ? 'Veuillez décrire les modifications souhaitées' 
        : 'Veuillez décrire l\'outil que vous souhaitez créer'
      );
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-interactive-tool', {
        body: { 
          description: messageToSend, 
          organizationId,
          category: isRefinement ? undefined : (category || undefined),
          lessonContext,
          courseContext,
          conversationHistory: isRefinement ? conversationHistory : undefined,
          currentCode: isRefinement ? (editedCode || toolConfig.generatedCode) : undefined,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.code === 'AI_CREDITS_LIMIT_REACHED') {
          toast.error('Limite de crédits IA atteinte pour ce mois');
        } else {
          toast.error(data.error);
        }
        return;
      }

      // Check for near limit warning
      if (data.nearLimit) {
        toast.warning("Attention : vous approchez de votre limite de crédits IA (80%)", {
          duration: 5000,
        });
      }

      // Update conversation history with timestamps
      const now = new Date().toISOString();
      const userMessage: ConversationMessage = { role: 'user', content: messageToSend, timestamp: now };
      const assistantMessage: ConversationMessage = { role: 'assistant', content: 'Modifications appliquées', timestamp: now };
      
      const newHistory: ConversationMessage[] = isRefinement 
        ? [...conversationHistory, userMessage, assistantMessage]
        : [userMessage, assistantMessage];
      
      setConversationHistory(newHistory);
      setEditedCode(data.code);
      
      onChange({
        description: isRefinement ? toolConfig.description : messageToSend,
        category: isRefinement ? toolConfig.category : category,
        generatedCode: data.code,
        generatedAt: new Date().toISOString(),
        conversationHistory: newHistory,
      });

      toast.success(isRefinement ? 'Outil modifié avec succès !' : 'Outil généré avec succès !');
      
      if (isRefinement) {
        setRefinementMessage('');
      }
      
      setActiveTab(isRefinement ? 'refine' : 'generate');
    } catch (error: any) {
      console.error('Error generating tool:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyCodeChanges = () => {
    const validation = validateHtmlCode(editedCode);
    if (!validation.isValid) {
      toast.error('Le code contient des erreurs. Veuillez les corriger avant d\'appliquer.');
      return;
    }

    onChange({
      ...toolConfig,
      generatedCode: editedCode,
      generatedAt: new Date().toISOString(),
    });
    toast.success('Modifications du code appliquées !');
  };

  const useExample = (example: string) => {
    setDescription(example);
  };

  const selectCategory = (catId: string) => {
    setCategory(catId === category ? '' : catId);
  };

  const currentExamples = category ? EXAMPLE_PROMPTS_BY_CATEGORY[category] || [] : [];
  const hasGeneratedCode = !!toolConfig.generatedCode;

  const handleWizardComplete = (generatedPrompt: string, wizardCategory: string) => {
    setDescription(generatedPrompt);
    setCategory(wizardCategory);
    setShowWizard(false);
    setActiveTab('generate');
    // Auto-generate after wizard completion
    setTimeout(() => {
      generateToolWithPrompt(generatedPrompt, wizardCategory);
    }, 100);
  };

  const generateToolWithPrompt = async (promptText: string, categoryId: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-interactive-tool', {
        body: { 
          description: promptText, 
          organizationId,
          category: categoryId || undefined,
          lessonContext,
          courseContext,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.code === 'AI_CREDITS_LIMIT_REACHED') {
          toast.error('Limite de crédits IA atteinte pour ce mois');
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data.nearLimit) {
        toast.warning("Attention : vous approchez de votre limite de crédits IA (80%)", {
          duration: 5000,
        });
      }

      const now = new Date().toISOString();
      const newHistory: ConversationMessage[] = [
        { role: 'user', content: promptText, timestamp: now },
        { role: 'assistant', content: 'Outil généré avec succès', timestamp: now }
      ];
      setConversationHistory(newHistory);
      setEditedCode(data.code);
      
      onChange({
        description: promptText,
        category: categoryId,
        generatedCode: data.code,
        generatedAt: new Date().toISOString(),
        conversationHistory: newHistory,
      });

      toast.success('Outil généré avec succès !');
    } catch (error: any) {
      console.error('Error generating tool:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Context indicator */}
      {(lessonContext?.title || courseContext?.title) && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>🎯 Contexte détecté :</strong>{' '}
              {courseContext?.title && <span>Cours "{courseContext.title}"</span>}
              {lessonContext?.title && <span> - Leçon "{lessonContext.title}"</span>}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              L'IA utilisera ce contexte pour générer un outil adapté à votre formation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different modes */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Libre
          </TabsTrigger>
          <TabsTrigger value="assisted" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Assisté
          </TabsTrigger>
          <TabsTrigger value="refine" disabled={!hasGeneratedCode} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Affiner
          </TabsTrigger>
          <TabsTrigger value="code" disabled={!hasGeneratedCode} className="gap-2">
            <Code className="h-4 w-4" />
            Code
          </TabsTrigger>
        </TabsList>

        {/* Assisted Tab - Wizard Mode */}
        <TabsContent value="assisted" className="mt-4">
          {showWizard ? (
            <AssistedToolWizard
              onComplete={handleWizardComplete}
              onCancel={() => setShowWizard(false)}
              lessonContext={lessonContext}
              courseContext={courseContext}
            />
          ) : (
            <Card className="border-dashed border-2 border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Mode assisté</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Répondez à quelques questions simples et l'IA créera automatiquement l'outil parfait pour votre formation.
                </p>
                <div className="space-y-3">
                  <Button onClick={() => setShowWizard(true)} size="lg" className="gap-2">
                    <Wand2 className="h-5 w-5" />
                    Démarrer le questionnaire guidé
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    ~2 minutes • 7 étapes • Résultats optimisés
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4 mt-4">
          {/* Category Selection */}
          <div>
            <Label className="mb-2 block">Type d'outil (optionnel)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TOOL_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.id)}
                    className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-medium text-sm">{cat.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description de l'outil à créer</Label>
            <Textarea
              rows={4}
              placeholder={category 
                ? `Décrivez votre ${TOOL_CATEGORIES.find(c => c.id === category)?.label.toLowerCase() || 'outil'}...`
                : "Décrivez l'outil interactif que vous souhaitez créer pour vos étudiants..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Soyez précis : fonctionnalités, champs de saisie, calculs, résultats attendus...
            </p>
          </div>

          {/* Example prompts by category */}
          {currentExamples.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">💡 Exemples pour {TOOL_CATEGORIES.find(c => c.id === category)?.label} :</p>
              <div className="flex flex-wrap gap-2">
                {currentExamples.map((example, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5 px-3 whitespace-normal text-left"
                    onClick={() => useExample(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          <Button
            type="button"
            onClick={() => generateTool(false)}
            disabled={isGenerating || !description.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : hasGeneratedCode ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Régénérer l'outil
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer avec l'IA
              </>
            )}
          </Button>
        </TabsContent>

        {/* Refine Tab - Conversation Mode */}
        <TabsContent value="refine" className="space-y-4 mt-4">
          {hasGeneratedCode && (
            <div className="flex flex-col h-[500px]">
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="font-medium">Mode conversation</span>
                  <span className="text-xs text-muted-foreground">
                    ({conversationHistory.length} message{conversationHistory.length > 1 ? 's' : ''})
                  </span>
                </div>
                {conversationHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setConversationHistory([]);
                      onChange({ ...toolConfig, conversationHistory: [] });
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Effacer l'historique
                  </Button>
                )}
              </div>

              {/* Conversation History */}
              <ScrollArea className="flex-1 py-4">
                <div className="space-y-3 pr-4">
                  {conversationHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Aucun message pour le moment</p>
                      <p className="text-xs mt-1">Utilisez le champ ci-dessous pour affiner votre outil</p>
                    </div>
                  ) : (
                    conversationHistory.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                              : 'bg-muted rounded-tl-sm'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${
                            msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Suggestions */}
              <div className="py-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">💡 Suggestions rapides :</p>
                <div className="flex flex-wrap gap-1.5">
                  {REFINEMENT_SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => {
                        setRefinementMessage(suggestion);
                        inputRef.current?.focus();
                      }}
                      disabled={isGenerating}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="flex gap-2 pt-2 border-t">
                <Textarea
                  ref={inputRef}
                  rows={2}
                  placeholder="Décrivez les modifications souhaitées... (Entrée pour envoyer)"
                  value={refinementMessage}
                  onChange={(e) => setRefinementMessage(e.target.value)}
                  className="flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (refinementMessage.trim()) {
                        generateTool(true);
                      }
                    }
                  }}
                  disabled={isGenerating}
                />
                <Button
                  type="button"
                  onClick={() => generateTool(true)}
                  disabled={isGenerating || !refinementMessage.trim()}
                  className="self-end h-10 w-10 p-0"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Preview Card */}
              <Card className="mt-4">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Prévisualisation en direct
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="border rounded-lg bg-background overflow-hidden">
                    <AIToolPreview code={editedCode || toolConfig.generatedCode || ''} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Code Tab - Manual Editor */}
        <TabsContent value="code" className="space-y-4 mt-4">
          {hasGeneratedCode && (
            <>
              {/* Validation status */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                codeValidation.isValid 
                  ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300' 
                  : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
              }`}>
                {codeValidation.isValid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Code valide</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    <div className="text-sm">
                      <p className="font-medium">Erreurs détectées :</p>
                      <ul className="list-disc list-inside text-xs mt-1">
                        {codeValidation.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* Code editor */}
              <div>
                <Label>Code HTML/CSS/JavaScript</Label>
                <Textarea
                  className="font-mono text-xs min-h-[300px] mt-1"
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  spellCheck={false}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={applyCodeChanges}
                  disabled={!codeValidation.isValid || editedCode === toolConfig.generatedCode}
                  className="flex-1"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Appliquer les modifications
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditedCode(toolConfig.generatedCode || '')}
                  disabled={editedCode === toolConfig.generatedCode}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Live preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Prévisualisation en direct
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg bg-background overflow-hidden">
                    <AIToolPreview code={editedCode} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Success state - shown in generate tab */}
      {activeTab === 'generate' && hasGeneratedCode && (
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Outil généré le {new Date(toolConfig.generatedAt!).toLocaleString('fr-FR')}
              {toolConfig.category && ` (${TOOL_CATEGORIES.find(c => c.id === toolConfig.category)?.label})`}
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Sandboxed preview component with iframe
function AIToolPreview({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(300);

  useEffect(() => {
    if (!code) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'resize' && typeof event.data.height === 'number') {
        setIframeHeight(Math.max(200, event.data.height + 20));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code]);

  if (!code) {
    return <p className="text-muted-foreground text-center py-8">Aucun code généré</p>;
  }

  // Wrap the generated code with auto-resize script
  const wrappedCode = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        body { 
          margin: 0; 
          padding: 16px; 
          font-family: system-ui, -apple-system, sans-serif;
          background: transparent;
        }
      </style>
    </head>
    <body>
      ${code}
      <script>
        // Auto-resize iframe
        function sendHeight() {
          const height = document.body.scrollHeight;
          parent.postMessage({ type: 'resize', height }, '*');
        }
        
        // Send height on load and on DOM changes
        window.addEventListener('load', sendHeight);
        window.addEventListener('resize', sendHeight);
        
        // Observe DOM changes
        const observer = new MutationObserver(sendHeight);
        observer.observe(document.body, { 
          childList: true, 
          subtree: true, 
          attributes: true 
        });
        
        // Initial send
        setTimeout(sendHeight, 100);
      </script>
    </body>
    </html>
  `;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={wrappedCode}
      sandbox="allow-scripts allow-forms"
      className="w-full border-0"
      style={{ height: `${iframeHeight}px`, minHeight: '200px' }}
      title="Prévisualisation de l'outil IA"
    />
  );
}
