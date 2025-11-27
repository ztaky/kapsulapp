-- Create enum for ticket status
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting_response', 'resolved', 'closed');

-- Create enum for ticket priority
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  category TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ai_conversation JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create support_messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
ON public.support_tickets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view tickets from their org"
ON public.support_tickets FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND has_org_role(auth.uid(), organization_id, 'coach'::org_role)
);

CREATE POLICY "Super admins can manage all tickets"
ON public.support_tickets FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS policies for support_messages
CREATE POLICY "Users can view messages of their tickets"
ON public.support_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id = ticket_id 
    AND support_tickets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages on their tickets"
ON public.support_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id = ticket_id 
    AND support_tickets.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all messages"
ON public.support_messages FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- Function to notify super admins on new ticket
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
  _user RECORD;
  _admin RECORD;
BEGIN
  SELECT * INTO _user FROM profiles WHERE id = NEW.user_id;
  
  FOR _admin IN 
    SELECT ur.user_id 
    FROM user_roles ur 
    WHERE ur.role = 'super_admin'
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link, metadata)
    VALUES (
      _admin.user_id,
      'Nouveau ticket support',
      COALESCE(_user.full_name, _user.email) || ' : ' || NEW.subject,
      'support',
      '/admin/support/' || NEW.id,
      jsonb_build_object('ticket_id', NEW.id, 'priority', NEW.priority)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_new_support_ticket
AFTER INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_new_ticket();

-- Function to notify user on admin reply
CREATE OR REPLACE FUNCTION public.notify_user_on_ticket_reply()
RETURNS TRIGGER AS $$
DECLARE
  _ticket RECORD;
BEGIN
  IF NEW.is_from_admin = true THEN
    SELECT * INTO _ticket FROM support_tickets WHERE id = NEW.ticket_id;
    
    INSERT INTO notifications (user_id, title, message, type, link, metadata)
    VALUES (
      _ticket.user_id,
      'Réponse à votre ticket',
      'Un administrateur a répondu à votre ticket : ' || _ticket.subject,
      'support',
      '/student/support/' || NEW.ticket_id,
      jsonb_build_object('ticket_id', NEW.ticket_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_ticket_reply
AFTER INSERT ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_on_ticket_reply();

-- Function to notify user on status change
CREATE OR REPLACE FUNCTION public.notify_user_on_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, title, message, type, link, metadata)
    VALUES (
      NEW.user_id,
      'Statut du ticket mis à jour',
      'Votre ticket "' || NEW.subject || '" est maintenant : ' || NEW.status::text,
      'support',
      '/student/support/' || NEW.id,
      jsonb_build_object('ticket_id', NEW.id, 'new_status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_ticket_status_change
AFTER UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_on_ticket_status_change();