-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view logs
CREATE POLICY "Super admins can view all logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow inserts from authenticated users (for logging their own actions)
CREATE POLICY "Authenticated users can insert their own logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  _action TEXT,
  _entity_type TEXT DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), _action, _entity_type, _entity_id, _metadata)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Trigger function for course changes
CREATE OR REPLACE FUNCTION public.log_course_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'course_created', 'course', NEW.id, jsonb_build_object('title', NEW.title, 'organization_id', NEW.organization_id));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_published = false AND NEW.is_published = true THEN
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (auth.uid(), 'course_published', 'course', NEW.id, jsonb_build_object('title', NEW.title));
    ELSE
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (auth.uid(), 'course_updated', 'course', NEW.id, jsonb_build_object('title', NEW.title));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'course_deleted', 'course', OLD.id, jsonb_build_object('title', OLD.title));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for courses
CREATE TRIGGER log_course_activity
AFTER INSERT OR UPDATE OR DELETE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.log_course_changes();

-- Trigger function for organization changes
CREATE OR REPLACE FUNCTION public.log_organization_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'organization_created', 'organization', NEW.id, jsonb_build_object('name', NEW.name, 'slug', NEW.slug));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'organization_updated', 'organization', NEW.id, jsonb_build_object('name', NEW.name));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for organizations
CREATE TRIGGER log_organization_activity
AFTER INSERT OR UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.log_organization_changes();

-- Trigger function for purchases
CREATE OR REPLACE FUNCTION public.log_purchase_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (NEW.user_id, 'purchase_completed', 'purchase', NEW.id, jsonb_build_object('amount', NEW.amount, 'course_id', NEW.course_id));
  RETURN NEW;
END;
$$;

-- Trigger for purchases
CREATE TRIGGER log_purchase_activity
AFTER INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.log_purchase_changes();

-- Trigger function for organization member changes
CREATE OR REPLACE FUNCTION public.log_member_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.user_id, 'member_joined', 'organization_member', NEW.id, jsonb_build_object('organization_id', NEW.organization_id, 'role', NEW.role));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (OLD.user_id, 'member_left', 'organization_member', OLD.id, jsonb_build_object('organization_id', OLD.organization_id, 'role', OLD.role));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for organization members
CREATE TRIGGER log_member_activity
AFTER INSERT OR DELETE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.log_member_changes();

-- Trigger function for landing page changes
CREATE OR REPLACE FUNCTION public.log_landing_page_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), 'landing_page_created', 'landing_page', NEW.id, jsonb_build_object('name', NEW.name, 'slug', NEW.slug));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'draft' AND NEW.status = 'published' THEN
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (auth.uid(), 'landing_page_published', 'landing_page', NEW.id, jsonb_build_object('name', NEW.name));
    ELSE
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (auth.uid(), 'landing_page_updated', 'landing_page', NEW.id, jsonb_build_object('name', NEW.name));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for landing pages
CREATE TRIGGER log_landing_page_activity
AFTER INSERT OR UPDATE ON public.landing_pages
FOR EACH ROW EXECUTE FUNCTION public.log_landing_page_changes();

-- Trigger function for user role changes
CREATE OR REPLACE FUNCTION public.log_user_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.user_id, 'role_granted', 'user_role', NEW.id, jsonb_build_object('role', NEW.role));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (OLD.user_id, 'role_revoked', 'user_role', OLD.id, jsonb_build_object('role', OLD.role));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for user roles
CREATE TRIGGER log_user_role_activity
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_user_role_changes();