-- Create chat_messages table for AI conversation persistence
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'student' CHECK (mode IN ('tutor', 'student', 'studio', 'support')),
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_mode ON public.chat_messages(mode);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own chat messages"
ON public.chat_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own chat messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Super admins can view all messages
CREATE POLICY "Super admins can view all chat messages"
ON public.chat_messages
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));