import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Sparkles, Loader2, Bot, User, BookOpen, Users, GraduationCap, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { useStudioContext, formatStudioContextForAI } from "@/hooks/useStudioContext";
import { useChatHistory } from "@/hooks/useChatHistory";
import { ActionCard, ActionType } from "@/components/assistant/ActionCard";
import { DraftsList } from "@/components/assistant/DraftsList";

interface ActionData {
  type: ActionType;
  data: any;
}

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
    case "create_complete_course":
      return `J'ai généré un cours complet "${data.course?.title}" avec ${data.modules?.length || 0} modules et tout le contenu pédagogique. Vous pouvez prévisualiser, modifier chaque élément, puis créer le cours en un clic !`;
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
    startNewConversation,
  } = useChatHistory({
    mode: 'studio',
    context: { organizationId: studioContext.organizationId },
    welcomeMessage: WELCOME_MESSAGE,
    loadHistoryOnMount: false,
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
          specialty: studioContext.organizationSpecialty,
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
        } else if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.code === 'AI_CREDITS_LIMIT_REACHED') {
            toast.error("Limite de crédits IA atteinte pour ce mois. Revenez le mois prochain !");
          } else {
            toast.error("Accès refusé");
          }
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        sendMessage(input);
      }
    }
  };


  const handleLoadDraft = (draft: any) => {
    // Parse draft and create a message with the loaded data
    const draftData = draft.draft_data;
    const action: ActionData = {
      type: "create_complete_course",
      data: draftData,
    };

    // Add a system message showing the loaded draft
    const loadMessage = {
      role: "assistant" as const,
      content: `Brouillon "${draft.title}" chargé. Vous pouvez continuer à le modifier ou le créer.`,
    };

    setMessages((prev) => [...prev, loadMessage]);
    setMessageActions((prev) => ({
      ...prev,
      [messages.length]: action,
    }));
  };

  if (studioContext.isLoading || isLoadingHistory) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-slate-500 mt-2">Chargement du contexte...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header compact */}
      <div className="shrink-0 relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-orange-50/50 p-4 border border-slate-100 shadow-sm">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 text-orange-600 p-2 w-10 h-10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assistant IA</h1>
              <p className="text-sm text-slate-600">
                Génère des quiz, structure des modules, et plus encore
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Button
              onClick={() => {
                startNewConversation();
                setMessageActions({});
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle conversation
            </Button>
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

      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0 mt-4">
        <div className="shrink-0 px-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Conversation
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Brouillons
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-4">
          {/* Messages scrollable area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-4xl mx-auto space-y-6 p-6">

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
                            organizationSlug={studioContext.organizationSlug}
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
          </div>

          {/* Input fixed at bottom */}
          <div className="shrink-0 border-t bg-white p-4">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question... (Shift+Entrée pour sauter une ligne)"
                  disabled={isLoading}
                  className="flex-1 min-h-[60px] max-h-[200px] resize-none"
                  rows={2}
                />
                <Button type="submit" disabled={isLoading || !input.trim()} className="h-[60px]">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="flex-1 min-h-0 mt-4">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto p-6">
              <DraftsList
                organizationId={studioContext.organizationId || ""}
                onLoadDraft={handleLoadDraft}
              />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
