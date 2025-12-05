import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Send, Loader2, MessageCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCourseContext, formatCourseContextForAI } from "@/hooks/useCourseContext";
import { useTutorQuota } from "@/hooks/useTutorQuota";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TutorChatWidgetProps {
  courseId: string;
  currentLessonTitle: string;
  organizationId: string;
}

export function TutorChatWidget({ courseId, currentLessonTitle, organizationId }: TutorChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: courseContext } = useCourseContext(courseId);
  const { data: quota, refetch: refetchQuota } = useTutorQuota(session?.user?.id, organizationId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    // Check quota before sending
    if (quota?.isAtLimit) {
      setQuotaError("Tu as atteint ta limite de messages ce mois-ci. Ton quota sera renouvelé le 1er du mois prochain. 📅");
      return;
    }

    setQuotaError(null);
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Get fresh auth token
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            courseContext: courseContext ? formatCourseContextForAI(courseContext) : null,
            currentLessonTitle,
            organizationId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429 && errorData.error === 'quota_exceeded') {
          setQuotaError(errorData.message || "Tu as atteint ta limite de messages ce mois-ci.");
          setMessages(messages); // Revert to previous messages
          refetchQuota();
          return;
        }
        if (response.status === 429) {
          throw new Error("Trop de requêtes. Réessayez dans quelques instants.");
        }
        if (response.status === 402) {
          throw new Error("Service temporairement indisponible.");
        }
        throw new Error("Erreur de communication avec l'assistant.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream unavailable");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

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
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Refetch quota after successful message
      refetchQuota();
    } catch (error) {
      console.error("Tutor chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Une erreur est survenue. Réessayez.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading || quota?.isAtLimit) return;
    const message = input.trim();
    setInput("");
    streamChat(message);
  };

  const suggestions = [
    "Peux-tu m'expliquer autrement ?",
    "Donne-moi un exemple concret",
    "C'est quoi l'essentiel à retenir ?",
  ];

  const getProgressColor = () => {
    if (!quota) return "bg-orange-500";
    if (quota.percentage >= 100) return "bg-red-500";
    if (quota.percentage >= 80) return "bg-amber-500";
    return "bg-orange-500";
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl 
                   bg-gradient-to-br from-orange-500 to-pink-500 
                   hover:scale-110 transition-transform hover:shadow-orange-500/50"
        aria-label="Ouvrir l'assistant Kapsul"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>

      {/* Chat sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col">
          <SheetHeader className="p-6 border-b bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 shrink-0">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Kapsul Tutor
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Je connais tout le cours et je suis là pour t'aider !
            </p>
            
            {/* Quota indicator */}
            {quota && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Messages ce mois : {quota.usage}/{quota.limit}
                  </span>
                  {quota.isNearLimit && !quota.isAtLimit && (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Presque atteint
                    </span>
                  )}
                  {quota.isAtLimit && (
                    <span className="text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Limite atteinte
                    </span>
                  )}
                </div>
                <Progress 
                  value={quota.percentage} 
                  className="h-1.5"
                  indicatorClassName={getProgressColor()}
                />
              </div>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {quotaError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <p className="text-sm text-red-700 dark:text-red-300">{quotaError}</p>
                </div>
              )}

              {messages.length === 0 && !quotaError && (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Pose-moi n'importe quelle question sur le cours !
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((suggestion, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setInput(suggestion);
                        }}
                        disabled={quota?.isAtLimit}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-foreground"
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

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-white dark:bg-slate-900 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={quota?.isAtLimit ? "Quota atteint pour ce mois" : "Pose ta question..."}
                disabled={isLoading || quota?.isAtLimit}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim() || quota?.isAtLimit}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
