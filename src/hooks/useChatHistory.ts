import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type ChatMode = 'tutor' | 'student' | 'studio' | 'support';

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseChatHistoryOptions {
  mode: ChatMode;
  context?: Record<string, unknown>;
  welcomeMessage: string;
}

export function useChatHistory({ mode, context = {}, welcomeMessage }: UseChatHistoryOptions) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage }
  ]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user and conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoadingHistory(false);
          return;
        }
        
        setUserId(user.id);

        // Get the most recent conversation for this mode
        const { data: recentMessages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .eq('mode', mode)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error loading chat history:', error);
          setIsLoadingHistory(false);
          return;
        }

        if (recentMessages && recentMessages.length > 0) {
          const lastConversationId = recentMessages[0].conversation_id;
          
          // Load all messages from this conversation
          const { data: conversationMessages, error: convError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', lastConversationId)
            .order('created_at', { ascending: true });

          if (convError) {
            console.error('Error loading conversation:', convError);
            setIsLoadingHistory(false);
            return;
          }

          if (conversationMessages && conversationMessages.length > 0) {
            setConversationId(lastConversationId);
            const loadedMessages: Message[] = conversationMessages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }));
            setMessages(loadedMessages);
          }
        }
      } catch (error) {
        console.error('Error in loadHistory:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [mode]);

  // Save a single message to the database
  const saveMessage = useCallback(async (
    role: "user" | "assistant",
    content: string,
    currentConversationId: string
  ) => {
    if (!userId) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('chat_messages') as any).insert({
        user_id: userId,
        conversation_id: currentConversationId,
        role,
        content,
        mode,
        context,
      });
      
      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [userId, mode, context]);

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    const newId = crypto.randomUUID();
    setConversationId(newId);
    setMessages([{ role: "assistant", content: welcomeMessage }]);
    return newId;
  }, [welcomeMessage]);

  // Get or create conversation ID
  const getConversationId = useCallback(() => {
    if (conversationId) return conversationId;
    const newId = crypto.randomUUID();
    setConversationId(newId);
    return newId;
  }, [conversationId]);

  // Clear history for this mode
  const clearHistory = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId)
        .eq('mode', mode);
      
      if (error) {
        console.error('Error clearing history:', error);
        return;
      }
      
      setConversationId(null);
      setMessages([{ role: "assistant", content: welcomeMessage }]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, [userId, mode, welcomeMessage]);

  return {
    messages,
    setMessages,
    conversationId,
    isLoadingHistory,
    userId,
    saveMessage,
    startNewConversation,
    getConversationId,
    clearHistory,
  };
}
