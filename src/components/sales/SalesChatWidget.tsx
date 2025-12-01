import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SalesChatWidgetProps {
  onFounderClick: () => void;
}

const QUICK_SUGGESTIONS = [
  "Quelles sont les fonctionnalités ?",
  "Quel est le prix ?",
  "Pourquoi Kapsul vs Kajabi ?",
  "Comment ça marche ?",
];

const AUTO_WELCOME_MESSAGE = "👋 Bonjour ! Je vois que vous explorez Kapsul. Avez-vous des questions sur notre plateforme de formation ? Je suis là pour vous aider !";

export function SalesChatWidget({ onFounderClick }: SalesChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [autoMessageShown, setAutoMessageShown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check sessionStorage for previous interaction
  useEffect(() => {
    const interacted = sessionStorage.getItem("kapsul_chat_interacted");
    if (interacted) {
      setHasInteracted(true);
      setAutoMessageShown(true);
    }
  }, []);

  // Show widget with pulse after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulse(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Auto welcome message after 10 seconds of inactivity
  useEffect(() => {
    if (hasInteracted || autoMessageShown || isOpen) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      setAutoMessageShown(true);
      setShowPulse(false);
      setMessages([{ role: "assistant", content: AUTO_WELCOME_MESSAGE }]);
    }, 10000);

    return () => clearTimeout(timer);
  }, [hasInteracted, autoMessageShown, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const markAsInteracted = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      sessionStorage.setItem("kapsul_chat_interacted", "true");
    }
  };

  const streamChat = async (userMessage: string) => {
    setIsLoading(true);
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            mode: "sales",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur de connexion");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return updated;
                });
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "Désolé, une erreur est survenue. N'hésitez pas à nous contacter directement !",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    markAsInteracted();
    const message = input.trim();
    setInput("");
    streamChat(message);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    markAsInteracted();
    streamChat(suggestion);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setShowPulse(false);
        }}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] text-white font-medium shadow-xl shadow-[#DD2476]/30 hover:shadow-2xl hover:shadow-[#DD2476]/40 transition-all hover:scale-105",
          isOpen && "hidden"
        )}
      >
        {showPulse && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
        )}
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Une question ?</span>
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform",
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Kapsul AI</h3>
              <p className="text-white/80 text-xs">Je réponds à vos questions</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="h-[320px] p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm text-center">
                👋 Bonjour ! Je suis là pour répondre à toutes vos questions sur Kapsul.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-left transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                      message.role === "user"
                        ? "bg-gradient-to-r from-[#FF512F] to-[#DD2476] text-white"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {message.content || (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              disabled={isLoading}
              className="flex-1 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-[#DD2476]"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-[#FF512F] to-[#DD2476] hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* CTA Button */}
        <div className="p-3 pt-0">
          <Button
            onClick={onFounderClick}
            variant="outline"
            className="w-full border-[#DD2476]/30 hover:bg-[#DD2476]/10 text-foreground"
          >
            🚀 Profiter de l'offre Fondateur
          </Button>
        </div>
      </div>
    </>
  );
}
