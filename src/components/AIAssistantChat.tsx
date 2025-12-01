import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, User, Sparkles, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useChatHistory } from "@/hooks/useChatHistory";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ChatMode = 'tutor' | 'student' | 'studio' | 'support';

interface AIAssistantChatProps {
  mode?: ChatMode;
  context?: Record<string, unknown>;
  placeholder?: string;
  suggestions?: string[];
  showHeader?: boolean;
  className?: string;
}

const DEFAULT_SUGGESTIONS: Record<ChatMode, string[]> = {
  tutor: [
    "Peux-tu m'expliquer ce concept ?",
    "J'ai du mal à comprendre cette partie",
    "Donne-moi un exemple concret",
  ],
  student: [
    "Comment progresser plus vite ?",
    "Conseils pour mieux retenir ?",
    "Aide-moi à organiser mes révisions",
  ],
  studio: [
    "Comment structurer mon cours ?",
    "Aide-moi à écrire une description",
    "Conseils pour engager mes étudiants",
  ],
  support: [
    "J'ai un problème de connexion",
    "Comment configurer les paiements ?",
    "Ma vidéo ne se charge pas",
  ],
};

const WELCOME_MESSAGES: Record<ChatMode, string> = {
  tutor: "Salut ! 👋 Je suis là pour t'aider à comprendre cette leçon. Pose-moi tes questions !",
  student: "Bonjour ! Je suis votre assistant pédagogique. Comment puis-je vous aider dans votre apprentissage ?",
  studio: "Bonjour ! Je suis votre expert en création de formations. Comment puis-je vous aider ?",
  support: "Bonjour ! Je suis l'assistant support Kapsul. Décrivez votre problème et je ferai de mon mieux pour vous aider.",
};

export function AIAssistantChat({ 
  mode = 'student',
  context, 
  placeholder,
  suggestions,
  showHeader = true,
  className = "",
}: AIAssistantChatProps) {
  const {
    messages,
    setMessages,
    isLoadingHistory,
    userId,
    saveMessage,
    startNewConversation,
    getConversationId,
    clearHistory,
  } = useChatHistory({
    mode,
    context,
    welcomeMessage: WELCOME_MESSAGES[mode],
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-chat`;
  const activeSuggestions = suggestions || DEFAULT_SUGGESTIONS[mode];
  const activePlaceholder = placeholder || "Posez votre question...";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Hide suggestions if there's history
  useEffect(() => {
    if (messages.length > 1) {
      setShowSuggestions(false);
    }
  }, [messages.length]);

  const streamChat = async (userMessage: string) => {
    const allMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);

    // Get conversation ID and save user message
    const convId = getConversationId();
    if (userId) {
      await saveMessage("user", userMessage, convId);
    }

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          mode,
          ...context 
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Trop de requêtes, veuillez patienter...");
        } else if (response.status === 402) {
          toast.error("Limite de crédits atteinte");
        } else if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.code === 'AI_CREDITS_LIMIT_REACHED') {
            toast.error("Limite de crédits IA atteinte pour ce mois. Revenez le mois prochain !");
          } else {
            toast.error("Accès refusé");
          }
        }
        throw new Error("Failed to start stream");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1) {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant response after streaming is complete
      if (userId && assistantContent) {
        await saveMessage("assistant", assistantContent, convId);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Erreur lors de la communication avec l'assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleSuggestionClick = (suggestion: string) => {
    streamChat(suggestion);
  };

  const handleNewConversation = () => {
    startNewConversation();
    setShowSuggestions(true);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setShowSuggestions(true);
    toast.success("Historique effacé");
  };

  if (isLoadingHistory) {
    return (
      <Card className={`shadow-premium border-slate-100 flex flex-col h-[600px] items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-slate-500 mt-2">Chargement de l'historique...</p>
      </Card>
    );
  }

  return (
    <Card className={`shadow-premium border-slate-100 flex flex-col h-[600px] ${className}`}>
      {showHeader && (
        <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-orange-50 to-slate-50 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                <Bot className="h-5 w-5 text-orange-600" />
              </div>
              {mode === 'tutor' ? 'Kapsul Tutor' : 
               mode === 'studio' ? 'Assistant Création' :
               mode === 'support' ? 'Support Kapsul' :
               'Assistant Pédagogique'}
            </CardTitle>
            {userId && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-orange-600"
                  onClick={handleNewConversation}
                  title="Nouvelle conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-red-600"
                  onClick={handleClearHistory}
                  title="Effacer l'historique"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-orange-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg"
                    : "bg-white border border-slate-200 text-slate-900 shadow-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {/* Suggestions after welcome message */}
          {showSuggestions && messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {activeSuggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-full border-orange-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Sparkles className="h-3 w-3 mr-1.5 text-orange-500" />
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                <Bot className="h-4 w-4 text-orange-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-slate-500 ml-2">Réflexion en cours...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <CardContent className="border-t border-slate-100 p-4 shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={activePlaceholder}
            disabled={isLoading}
            className="rounded-xl border-slate-200"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            variant="gradient"
            className="rounded-xl shadow-lg shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
