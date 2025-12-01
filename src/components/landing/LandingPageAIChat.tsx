import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Sparkles, Check, X, Palette, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Suggestion {
  type: "content" | "design";
  section?: string;
  designKey?: string;
  field?: string;
  newValue: any;
  oldValue?: any;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestion?: Suggestion;
  applied?: boolean;
}

interface LandingPageAIChatProps {
  content: any;
  trainerInfo: any;
  designConfig: any;
  onApplySuggestion: (section: string, data: any) => void;
  onApplyDesignChange?: (designKey: string, newValue: any) => void;
  currentSection?: string;
  organizationId?: string;
}

const QUICK_ACTIONS = [
  // Copywriting
  { label: "✍️ Améliorer titre", prompt: "Améliore le titre principal pour le rendre plus accrocheur" },
  { label: "✍️ Plus émotionnel", prompt: "Rends le contenu plus émotionnel et engageant" },
  { label: "✍️ Améliorer CTA", prompt: "Propose des améliorations pour les boutons d'action" },
  // Design
  { label: "🎨 Mode sombre", prompt: "Passe la page en mode sombre (dark theme)" },
  { label: "🎨 Couleurs vives", prompt: "Propose des couleurs plus vives et énergiques pour la palette" },
  { label: "🎨 Police moderne", prompt: "Suggère une combinaison de polices plus moderne" },
];

export function LandingPageAIChat({
  content,
  trainerInfo,
  designConfig,
  onApplySuggestion,
  onApplyDesignChange,
  currentSection,
  organizationId,
}: LandingPageAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant pour améliorer votre page de vente. Je peux vous aider avec :\n\n✍️ **Copywriting** : textes, titres, CTA, témoignages...\n🎨 **Design** : couleurs, polices, thème...\n\nComment puis-je vous aider ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('edit-landing-content', {
        body: {
          action: 'edit',
          instruction: messageText,
          currentSection: currentSection || null,
          pageContent: content,
          trainerInfo,
          designConfig,
          organizationId,
        }
      });

      if (response.error) {
        // Check for AI credits limit error
        if (response.error.message?.includes('403') || response.error.code === 'AI_CREDITS_LIMIT_REACHED') {
          toast.error("Limite de crédits IA atteinte pour ce mois");
          throw new Error('AI_CREDITS_LIMIT_REACHED');
        }
        throw response.error;
      }

      const { message, suggestion, nearLimit } = response.data;

      // Check for error in response data
      if (response.data?.error) {
        if (response.data?.code === 'AI_CREDITS_LIMIT_REACHED') {
          toast.error("Limite de crédits IA atteinte pour ce mois");
          throw new Error('AI_CREDITS_LIMIT_REACHED');
        }
        throw new Error(response.data.error);
      }

      // Check for near limit warning
      if (nearLimit) {
        toast.warning("Attention : vous approchez de votre limite de crédits IA (80%)", {
          duration: 5000,
        });
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: message,
        suggestion: suggestion || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("AI chat error:", error);
      const errorMessage = error.message === 'AI_CREDITS_LIMIT_REACHED' 
        ? "Limite de crédits IA atteinte. Réessayez le mois prochain !"
        : "Désolé, une erreur s'est produite. Veuillez réessayer.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
      if (error.message !== 'AI_CREDITS_LIMIT_REACHED') {
        toast.error("Erreur de communication avec l'assistant");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message.suggestion) return;

    const { type, section, designKey, newValue } = message.suggestion;

    if (type === "design" && designKey && onApplyDesignChange) {
      onApplyDesignChange(designKey, newValue);
      toast.success("Design mis à jour !");
    } else if (type === "content" && section) {
      onApplySuggestion(section, newValue);
      toast.success("Contenu mis à jour !");
    } else if (section) {
      // Fallback for old format without type
      onApplySuggestion(section, newValue);
      toast.success("Modification appliquée !");
    }

    // Mark as applied
    setMessages((prev) =>
      prev.map((msg, i) => (i === messageIndex ? { ...msg, applied: true } : msg))
    );
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const renderSuggestionPreview = (suggestion: Suggestion) => {
    if (suggestion.type === "design") {
      const isColor = suggestion.designKey?.includes("palette");
      const isTheme = suggestion.designKey === "theme";
      
      return (
        <div className="flex items-center gap-3">
          {isColor && (
            <div 
              className="w-8 h-8 rounded-full border-2 border-border shadow-sm"
              style={{ backgroundColor: suggestion.newValue }}
            />
          )}
          <div>
            <span className="text-sm font-medium">{suggestion.designKey}</span>
            <p className="text-xs text-muted-foreground">
              {isTheme ? `Thème ${suggestion.newValue}` : suggestion.newValue}
            </p>
          </div>
        </div>
      );
    }

    // Content suggestion
    if (typeof suggestion.newValue === 'string') {
      return (
        <p className="text-sm text-muted-foreground line-clamp-3">
          "{suggestion.newValue}"
        </p>
      );
    }
    
    return (
      <p className="text-sm text-muted-foreground">
        {JSON.stringify(suggestion.newValue).slice(0, 100)}...
      </p>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Suggestion Preview */}
                {message.suggestion && !message.applied && (
                  <Card className="mt-3 p-3 bg-background/80">
                    <div className="flex items-center gap-2 mb-2">
                      {message.suggestion.type === "design" ? (
                        <Palette className="h-4 w-4 text-primary" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-xs font-medium">
                        {message.suggestion.type === "design" 
                          ? `Design: ${message.suggestion.designKey}` 
                          : `Contenu: ${message.suggestion.section}`}
                      </span>
                    </div>
                    
                    {renderSuggestionPreview(message.suggestion)}

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestion(index)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Appliquer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setMessages((prev) =>
                            prev.map((msg, i) =>
                              i === index ? { ...msg, suggestion: undefined } : msg
                            )
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )}

                {message.applied && (
                  <Badge variant="outline" className="mt-2 gap-1">
                    <Check className="h-3 w-3" />
                    Appliqué
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="py-3 border-t">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isLoading}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="Demandez une modification (texte ou design)..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
