-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _title TEXT,
  _message TEXT,
  _type TEXT DEFAULT 'info',
  _link TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link, metadata)
  VALUES (_user_id, _title, _message, _type, _link, _metadata)
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;

-- Trigger: Notify coach when a purchase is made
CREATE OR REPLACE FUNCTION public.notify_coach_on_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _course RECORD;
  _buyer RECORD;
  _coach_id UUID;
BEGIN
  -- Get course and organization info
  SELECT c.*, o.id as org_id, o.slug as org_slug
  INTO _course
  FROM courses c
  JOIN organizations o ON o.id = c.organization_id
  WHERE c.id = NEW.course_id;
  
  -- Get buyer info
  SELECT * INTO _buyer FROM profiles WHERE id = NEW.user_id;
  
  -- Get coach user_id
  SELECT om.user_id INTO _coach_id
  FROM organization_members om
  WHERE om.organization_id = _course.org_id AND om.role = 'coach'
  LIMIT 1;
  
  IF _coach_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link, metadata)
    VALUES (
      _coach_id,
      'Nouvelle vente !',
      COALESCE(_buyer.full_name, _buyer.email) || ' a acheté "' || _course.title || '"',
      'purchase',
      '/school/' || _course.org_slug || '/studio/students',
      jsonb_build_object('amount', NEW.amount, 'course_id', NEW.course_id, 'buyer_email', _buyer.email)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_coach_purchase
AFTER INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.notify_coach_on_purchase();

-- Trigger: Notify coach when a student joins
CREATE OR REPLACE FUNCTION public.notify_coach_on_member_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org RECORD;
  _member RECORD;
  _coach_id UUID;
BEGIN
  IF NEW.role = 'student' THEN
    -- Get organization info
    SELECT * INTO _org FROM organizations WHERE id = NEW.organization_id;
    
    -- Get member info
    SELECT * INTO _member FROM profiles WHERE id = NEW.user_id;
    
    -- Get coach user_id
    SELECT om.user_id INTO _coach_id
    FROM organization_members om
    WHERE om.organization_id = NEW.organization_id AND om.role = 'coach'
    LIMIT 1;
    
    IF _coach_id IS NOT NULL AND _coach_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, title, message, type, link, metadata)
      VALUES (
        _coach_id,
        'Nouvel étudiant !',
        COALESCE(_member.full_name, _member.email) || ' a rejoint votre académie',
        'member',
        '/school/' || _org.slug || '/studio/students',
        jsonb_build_object('member_id', NEW.user_id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_coach_member_join
AFTER INSERT ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.notify_coach_on_member_join();

-- Trigger: Notify students when a course is published
CREATE OR REPLACE FUNCTION public.notify_students_on_course_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org RECORD;
  _student RECORD;
BEGIN
  IF OLD.is_published = false AND NEW.is_published = true THEN
    -- Get organization info
    SELECT * INTO _org FROM organizations WHERE id = NEW.organization_id;
    
    -- Notify all students of this organization
    FOR _student IN 
      SELECT om.user_id 
      FROM organization_members om 
      WHERE om.organization_id = NEW.organization_id AND om.role = 'student'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, link, metadata)
      VALUES (
        _student.user_id,
        'Nouvelle formation disponible !',
        '"' || NEW.title || '" est maintenant disponible',
        'course',
        '/school/' || _org.slug || '/course/' || NEW.id,
        jsonb_build_object('course_id', NEW.id)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_students_course_publish
AFTER UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.notify_students_on_course_publish();