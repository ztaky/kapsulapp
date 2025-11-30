import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2, Bot, User, BookOpen, Users, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useStudioContext, formatStudioContextForAI } from "@/hooks/useStudioContext";
import { useChatHistory } from "@/hooks/useChatHistory";
import { ActionCard, ActionType } from "@/components/assistant/ActionCard";

interface ActionData {
  type: ActionType;
  data: any;
}

const SUGGESTIONS = [
  "Comment structurer mon premier cours ?",
  "Génère un quiz de 5 questions sur le marketing digital",
  "Propose une structure de modules pour un cours sur React",
  "Conseils pour engager mes étudiants",
  "Comment fixer le prix de ma formation ?",
];

const WELCOME_MESSAGE = "Bonjour ! Je suis votre assistant expert en création de formations. Je peux vous aider à structurer vos cours, et même **générer des quiz** ou **proposer des modules** que vous pourrez ajouter directement. Comment puis-je vous aider ?";

// Parse tool calls from streamed response
function parseToolCalls(content: string, toolCalls: any[]): { text: string; action?: ActionData } {
  if (toolCalls && toolCalls.length > 0) {
    const toolCall = toolCalls[0];
    if (toolCall.function) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        return {
          text: content || getDefaultTextForAction(toolCall.function.name, args),
          action: {
            type: toolCall.function.name as ActionType,
            data: args,
          },
        };
      } catch (e) {
        console.error("Error parsing tool call arguments:", e);
      }
    }
  }
  
  return { text: content };
}

function getDefaultTextForAction(actionType: string, data: any): string {
  switch (actionType) {
    case "generate_quiz":
      return `J'ai créé un quiz "${data.title}" avec ${data.questions?.length || 0} questions. Vous pouvez le prévisualiser ci-dessous et l'ajouter à une leçon de votre choix.`;
    case "suggest_modules":
      return `Voici une structure de ${data.modules?.length || 0} modules pour votre cours sur "${data.course_topic}". Vous pouvez les ajouter directement à un de vos cours.`;
    default:
      return "Voici le contenu généré :";
  }
}

export default function AIAssistant() {
  const studioContext = useStudioContext();
  const {
    messages,
    setMessages,
    isLoadingHistory,
    userId,
    saveMessage,
    getConversationId,
  } = useChatHistory({
    mode: 'studio',
    context: { organizationId: studioContext.organizationId },
    welcomeMessage: WELCOME_MESSAGE,
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Store actions separately, keyed by message index
  const [messageActions, setMessageActions] = useState<Record<number, ActionData>>({});
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

    const userMessage = { role: "user" as const, content: messageText };
    const allMessages = [...messages, userMessage];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    const convId = getConversationId();
    if (userId) {
      await saveMessage("user", messageText, convId);
    }

    try {
      const formattedContext = formatStudioContextForAI(studioContext);

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          mode: "studio",
          studioContext: formattedContext,
          organizationId: studioContext.organizationId,
          organizationName: studioContext.organizationName,
          coursesCount: studioContext.courses.length,
          lessonsCount: studioContext.totalLessons,
          studentsCount: studioContext.totalStudents,
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
      let assistantContent = "";
      let textBuffer = "";
      let toolCalls: any[] = [];

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
            const delta = parsed.choices?.[0]?.delta;
            
            if (delta?.content) {
              assistantContent += delta.content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  content: assistantContent,
                };
                return newMessages;
              });
            }
            
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.index !== undefined) {
                  if (!toolCalls[tc.index]) {
                    toolCalls[tc.index] = {
                      id: tc.id || "",
                      function: { name: "", arguments: "" },
                    };
                  }
                  if (tc.function?.name) {
                    toolCalls[tc.index].function.name = tc.function.name;
                  }
                  if (tc.function?.arguments) {
                    toolCalls[tc.index].function.arguments += tc.function.arguments;
                  }
                }
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Process tool calls after streaming is complete
      if (toolCalls.length > 0) {
        const { text, action } = parseToolCalls(assistantContent, toolCalls);
        const finalContent = text || assistantContent;
        
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: finalContent,
          };
          // Store action with the message index
          if (action) {
            setMessageActions(prevActions => ({
              ...prevActions,
              [newMessages.length - 1]: action,
            }));
          }
          return newMessages;
        });
        
        if (userId && finalContent) {
          await saveMessage("assistant", finalContent, convId);
        }
      } else {
        if (userId && assistantContent) {
          await saveMessage("assistant", assistantContent, convId);
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

  if (studioContext.isLoading || isLoadingHistory) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-slate-500 mt-2">Chargement du contexte...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-8 border border-slate-100 shadow-premium">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-orange-100 text-orange-600 p-3 w-14 h-14 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Assistant IA</h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Génère des quiz, structure des modules, et plus encore
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <BookOpen className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{studioContext.courses.length}</span>
              <span>cours</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <GraduationCap className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{studioContext.totalLessons}</span>
              <span>leçons</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{studioContext.totalStudents}</span>
              <span>étudiants</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto space-y-6 p-6">
            {messages.length <= 1 && (
              <Card className="p-10 text-center bg-white border border-slate-100 rounded-3xl shadow-premium">
                <div className="rounded-2xl bg-orange-100 text-orange-600 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">
                  Bienvenue ! Comment puis-je vous aider ?
                </h3>
                <p className="text-base text-slate-600 leading-relaxed mb-4 max-w-2xl mx-auto">
                  Je peux créer des <span className="font-semibold text-orange-600">quiz</span>, proposer des <span className="font-semibold text-orange-600">structures de modules</span>, et vous conseiller sur vos formations.
                </p>
                {studioContext.courses.length > 0 && (
                  <p className="text-sm text-orange-600 mb-6">
                    📚 Je connais vos {studioContext.courses.length} cours et {studioContext.totalLessons} leçons
                  </p>
                )}
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

            {messages.slice(1).map((message, idx) => {
              const actualIndex = idx + 1; // Account for the slice(1)
              const action = messageActions[actualIndex];
              
              return (
                <div key={idx} className="space-y-4">
                  <div
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
                  
                  {/* Render ActionCard if there's an action for this message */}
                  {message.role === "assistant" && action && (
                    <div className="ml-13 pl-13">
                      <ActionCard
                        type={action.type}
                        data={action.data}
                        organizationId={studioContext.organizationId || ""}
                      />
                    </div>
                  )}
                </div>
              );
            })}

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
                placeholder="Demandez un quiz, une structure de modules, ou posez votre question..."
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
