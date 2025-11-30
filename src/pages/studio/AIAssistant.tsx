import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2, Bot, User } from "lucide-react";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Comment structurer mon premier cours ?",
  "Aide-moi à écrire une description accrocheuse",
  "Conseils pour engager mes étudiants",
  "Comment fixer le prix de ma formation ?",
  "Stratégies marketing pour promouvoir mon cours",
];

export default function AIAssistant() {
  const { slug } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-chat`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          mode: "studio",
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast.error("Trop de requêtes, veuillez patienter...");
        } else if (response.status === 402) {
          toast.error("Limite de crédits atteinte");
        }
        throw new Error("Erreur lors de l'appel à l'assistant IA");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
              assistantMessage += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la communication avec l'assistant IA");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-6">
      {/* Header - Premium Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-8 border border-slate-100 shadow-premium">
        <div className="relative z-10 flex items-center gap-4">
          <div className="rounded-2xl bg-orange-100 text-orange-600 p-3 w-14 h-14 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Assistant IA</h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Votre expert personnel en création de formations
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto space-y-6 p-6">
            {messages.length === 0 && (
              <Card className="p-10 text-center bg-white border border-slate-100 rounded-3xl shadow-premium">
                <div className="rounded-2xl bg-orange-100 text-orange-600 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">
                  Bienvenue ! Comment puis-je vous aider ?
                </h3>
                <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto">
                  Posez-moi vos questions sur la création de cours, le marketing, l'engagement...
                </p>
                <div className="grid gap-3 max-w-xl mx-auto">
                  {SUGGESTIONS.map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start text-left h-auto py-4 px-5 rounded-xl border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 text-sm font-medium"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Sparkles className="h-4 w-4 mr-3 shrink-0 text-orange-600" />
                      <span className="text-slate-900">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-orange-600" />
                  </div>
                )}
                <Card
                  className={`p-5 max-w-[80%] rounded-2xl border shadow-sm ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg"
                      : "bg-white border-slate-100"
                  }`}
                >
                  <p className={`whitespace-pre-wrap leading-relaxed ${
                    message.role === "user" ? "text-white" : "text-slate-700"
                  }`}>
                    {message.content}
                  </p>
                </Card>
                {message.role === "user" && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-3 justify-start">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-orange-600" />
                </div>
                <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-slate-500">Réflexion en cours...</span>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-slate-200">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                disabled={isLoading}
                className="flex-1 rounded-xl border-slate-200 h-12"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                variant="gradient"
                size="lg"
                className="shadow-lg h-12 px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
