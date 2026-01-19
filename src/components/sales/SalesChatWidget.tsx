import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_SUGGESTIONS = [
  "C'est quoi Kapsul en 2 mots ?",
  "Je débute, c'est fait pour moi ?",
  "Ça coûte combien ?",
  "Comment ça marche ?",
];

const EMAIL_ASK_MESSAGE = "Au fait, si vous voulez que je vous envoie un récap de nos échanges ou qu'on puisse reprendre cette conversation plus tard, laissez-moi votre email ! 📧 (Promis, zéro spam)";

const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.\w+/;

export function SalesChatWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Session tracking for lead capture
  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem('kapsul_chat_session');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('kapsul_chat_session', id);
    }
    return id;
  });
  
  const [leadId, setLeadId] = useState<string | null>(null);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [emailAsked, setEmailAsked] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);

  // Show widget with pulse after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulse(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

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

  // Check if email is in conversation
  const hasEmailInConversation = () => {
    return messages.some(msg => msg.role === "user" && EMAIL_REGEX.test(msg.content));
  };

  // Extract email from text
  const extractEmail = (text: string): string | null => {
    const match = text.match(EMAIL_REGEX);
    return match ? match[0] : null;
  };

  // Save or update lead in database
  const saveOrUpdateLead = async (updatedMessages: Message[], detectedEmail?: string) => {
    try {
      const firstUserMessage = updatedMessages.find(m => m.role === "user");
      const conversationData = updatedMessages.map(({ role, content }) => ({ role, content }));

      if (leadId) {
        // Update existing lead
        await supabase
          .from('sales_leads')
          .update({
            conversation: conversationData,
            email: detectedEmail || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId);
      } else {
        // Create new lead
        const { data, error } = await supabase
          .from('sales_leads')
          .insert({
            session_id: sessionId,
            conversation: conversationData,
            first_question: firstUserMessage?.content || null,
            email: detectedEmail || null,
            source_page: window.location.pathname,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error saving lead:', error);
        } else if (data) {
          setLeadId(data.id);
        }
      }
    } catch (error) {
      console.error('Error in saveOrUpdateLead:', error);
    }
  };

  const streamChat = async (userMessage: string) => {
    setIsLoading(true);
    
    // Increment user message count
    setUserMessageCount(prev => prev + 1);
    
    // Check for email in user message
    const detectedEmail = extractEmail(userMessage);
    if (detectedEmail && !emailCaptured) {
      setEmailCaptured(true);
    }

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);

    // Save lead after user message
    await saveOrUpdateLead(newMessages, detectedEmail || undefined);

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

      // After AI response, check if we should ask for email
      const finalMessages: Message[] = [...newMessages, { role: "assistant" as const, content: assistantMessage }];
      
      if (userMessageCount >= 2 && !emailAsked && !emailCaptured && !hasEmailInConversation()) {
        // Add email request message
        const emailRequestMessage: Message = { role: "assistant" as const, content: EMAIL_ASK_MESSAGE };
        const messagesWithEmailAsk: Message[] = [...finalMessages, emailRequestMessage];
        setMessages(messagesWithEmailAsk);
        setEmailAsked(true);
        await saveOrUpdateLead(messagesWithEmailAsk);
      } else {
        await saveOrUpdateLead(finalMessages);
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
    const message = input.trim();
    setInput("");
    streamChat(message);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    streamChat(suggestion);
  };

  const handleStartFree = async () => {
    // Mark as converted in database
    if (leadId) {
      await supabase
        .from('sales_leads')
        .update({ converted: true })
        .eq('id', leadId);
    }
    navigate("/coach-signup");
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
              <h3 className="font-bold text-white">Hugo - Kapsul</h3>
              <p className="text-white/80 text-xs">Conseiller Kapsul</p>
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
                👋 Bonjour ! Je suis Hugo. Posez-moi vos questions sur Kapsul.
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
            onClick={handleStartFree}
            variant="outline"
            className="w-full border-[#DD2476]/30 hover:bg-[#DD2476]/10 text-foreground"
          >
            🚀 Essayer gratuitement
          </Button>
        </div>
      </div>
    </>
  );
}
