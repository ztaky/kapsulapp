-- Create tutor_usage table to track AI tutor message consumption
CREATE TABLE public.tutor_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, organization_id, month_year)
);

-- Index for fast lookups
CREATE INDEX idx_tutor_usage_lookup ON public.tutor_usage(user_id, organization_id, month_year);

-- Enable RLS
ALTER TABLE public.tutor_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own usage" ON public.tutor_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Coaches can view org usage
CREATE POLICY "Coaches can view org usage" ON public.tutor_usage
  FOR SELECT USING (has_org_role(auth.uid(), organization_id, 'coach'));

-- Super admins can view all usage
CREATE POLICY "Super admins can manage all usage" ON public.tutor_usage
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Add quota column to organizations
ALTER TABLE public.organizations 
ADD COLUMN tutor_quota_per_student INTEGER DEFAULT 50;

-- Create function to increment tutor usage (security definer to bypass RLS for insert/update)
CREATE OR REPLACE FUNCTION public.increment_tutor_usage(
  _user_id UUID,
  _organization_id UUID,
  _month_year TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_count INTEGER;
BEGIN
  INSERT INTO tutor_usage (user_id, organization_id, month_year, message_count)
  VALUES (_user_id, _organization_id, _month_year, 1)
  ON CONFLICT (user_id, organization_id, month_year)
  DO UPDATE SET 
    message_count = tutor_usage.message_count + 1,
    updated_at = now()
  RETURNING message_count INTO _new_count;
  
  RETURN _new_count;
END;
$$;

-- Create function to get current usage
CREATE OR REPLACE FUNCTION public.get_tutor_usage(
  _user_id UUID,
  _organization_id UUID,
  _month_year TEXT
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT message_count FROM tutor_usage 
     WHERE user_id = _user_id 
     AND organization_id = _organization_id 
     AND month_year = _month_year),
    0
  );
$$;