import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Sparkles, Check, X, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestion?: {
    section: string;
    field?: string;
    newValue: any;
    oldValue?: any;
  };
  applied?: boolean;
}

interface LandingPageAIChatProps {
  content: any;
  trainerInfo: any;
  designConfig: any;
  onApplySuggestion: (section: string, data: any) => void;
  currentSection?: string;
}

const QUICK_ACTIONS = [
  { label: "Améliorer le titre", prompt: "Améliore le titre principal pour le rendre plus accrocheur" },
  { label: "Raccourcir", prompt: "Raccourcis les textes de la section actuelle pour être plus concis" },
  { label: "Plus émotionnel", prompt: "Rends le contenu plus émotionnel et engageant" },
  { label: "Ajouter urgence", prompt: "Ajoute un sentiment d'urgence à la page" },
  { label: "Améliorer CTA", prompt: "Propose des améliorations pour les boutons d'action" },
];

export function LandingPageAIChat({
  content,
  trainerInfo,
  designConfig,
  onApplySuggestion,
  currentSection,
}: LandingPageAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant pour améliorer votre page de vente. Comment puis-je vous aider ? Vous pouvez me demander de modifier du texte, ajouter des éléments ou améliorer le copywriting.",
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
        }
      });

      if (response.error) throw response.error;

      const { message, suggestion } = response.data;

      const assistantMessage: Message = {
        role: "assistant",
        content: message,
        suggestion: suggestion || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        },
      ]);
      toast.error("Erreur de communication avec l'assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message.suggestion) return;

    const { section, newValue } = message.suggestion;
    onApplySuggestion(section, newValue);

    // Mark as applied
    setMessages((prev) =>
      prev.map((msg, i) => (i === messageIndex ? { ...msg, applied: true } : msg))
    );

    toast.success("Modification appliquée !");
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
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
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium">Suggestion pour: {message.suggestion.section}</span>
                    </div>
                    
                    {typeof message.suggestion.newValue === 'string' ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        "{message.suggestion.newValue}"
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {JSON.stringify(message.suggestion.newValue).slice(0, 100)}...
                      </p>
                    )}

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
          placeholder="Demandez une modification..."
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
