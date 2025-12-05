import { useState, useRef, useEffect } from "react";
import { MessageCircleQuestion, X, Send, Loader2, TicketPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CreateTicketForm } from "./CreateTicketForm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SupportChatWidgetProps {
  organizationId?: string;
}

export function SupportChatWidget({ organizationId }: SupportChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-chat`;
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    
    setMessages(newMessages);
    setIsLoading(true);
    setInput("");

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages, mode: "support" }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to start stream");
      }

      const reader = resp.body.getReader();
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
              setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Check if resolved
      if (assistantContent.includes("[RESOLVED: false]")) {
        setUnresolvedCount(prev => prev + 1);
      }

      // Clean the marker from display
      const cleanContent = assistantContent
        .replace(/\[RESOLVED: (true|false)\]/g, "")
        .trim();
      
      setMessages([...newMessages, { role: "assistant", content: cleanContent }]);

    } catch (error) {
      console.error("Support chat error:", error);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Désolé, une erreur est survenue. Veuillez réessayer." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleTicketCreated = () => {
    setShowTicketForm(false);
    setMessages([]);
    setUnresolvedCount(0);
    setIsOpen(false);
  };

  const conversationSummary = messages
    .map(m => `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  return (
    <>
      {/* Bouton flottant */}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
      >
        <MessageCircleQuestion className="h-6 w-6" />
      </Button>

      {/* Popup chatbot */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-background rounded-xl shadow-2xl flex flex-col z-50 border border-border animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border bg-muted/30 rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Support Kapsul</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          {showTicketForm ? (
            <div className="flex-1 overflow-auto p-4">
              <CreateTicketForm
                organizationId={organizationId}
                aiConversation={messages}
                conversationSummary={conversationSummary}
                onSuccess={handleTicketCreated}
                onCancel={() => setShowTicketForm(false)}
              />
            </div>
          ) : (
            <>
              {/* Zone messages scrollable */}
              <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <MessageCircleQuestion className="h-16 w-16 mb-4 opacity-30" />
                    <p className="font-medium text-foreground mb-2">Bonjour ! Comment puis-je vous aider ?</p>
                    <p className="text-sm">
                      Décrivez votre problème et je ferai de mon mieux pour vous aider.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div 
                            className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5"
                            dangerouslySetInnerHTML={{ 
                              __html: message.content
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                .replace(/^(\d+)\.\s+(.*)$/gm, '<li>$2</li>')
                                .replace(/^-\s+(.*)$/gm, '<li>$1</li>')
                                .replace(/\n/g, '<br/>')
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bouton ticket si nécessaire */}
              {unresolvedCount >= 2 && (
                <div className="px-4 py-2 bg-amber-50 border-t border-amber-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => setShowTicketForm(true)}
                  >
                    <TicketPlus className="h-4 w-4 mr-2" />
                    Créer un ticket de support
                  </Button>
                </div>
              )}

              {/* Input fixe en bas */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background rounded-b-xl">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Décrivez votre problème..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
