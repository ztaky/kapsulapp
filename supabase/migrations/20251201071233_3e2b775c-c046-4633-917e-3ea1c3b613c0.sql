-- Create ai_credits table to track AI usage per organization per month
CREATE TABLE public.ai_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, month_year)
);

-- Enable RLS
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

-- Coaches can view their org credits
CREATE POLICY "Coaches can view their org credits"
  ON public.ai_credits
  FOR SELECT
  USING (has_org_role(auth.uid(), organization_id, 'coach'::org_role));

-- Super admins can manage all credits
CREATE POLICY "Super admins can manage all credits"
  ON public.ai_credits
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create function to get AI credits usage
CREATE OR REPLACE FUNCTION public.get_ai_credits_usage(_organization_id UUID, _month_year TEXT)
RETURNS TABLE(credits_used INTEGER, credits_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _credits_used INTEGER;
  _is_founder BOOLEAN;
BEGIN
  -- Get current usage
  SELECT COALESCE(ac.credits_used, 0) INTO _credits_used
  FROM ai_credits ac
  WHERE ac.organization_id = _organization_id AND ac.month_year = _month_year;
  
  IF _credits_used IS NULL THEN
    _credits_used := 0;
  END IF;
  
  -- Check if founder plan (5000 credits) or regular (unlimited = NULL)
  SELECT o.is_founder_plan INTO _is_founder
  FROM organizations o
  WHERE o.id = _organization_id;
  
  RETURN QUERY SELECT 
    _credits_used AS credits_used,
    CASE WHEN _is_founder THEN 5000 ELSE NULL END AS credits_limit;
END;
$$;

-- Create function to increment AI credits and check limit
CREATE OR REPLACE FUNCTION public.increment_ai_credits(_organization_id UUID, _month_year TEXT, _amount INTEGER DEFAULT 1)
RETURNS TABLE(success BOOLEAN, new_count INTEGER, credits_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_count INTEGER;
  _is_founder BOOLEAN;
  _limit INTEGER;
BEGIN
  -- Check if founder plan
  SELECT o.is_founder_plan INTO _is_founder
  FROM organizations o
  WHERE o.id = _organization_id;
  
  _limit := CASE WHEN _is_founder THEN 5000 ELSE NULL END;
  
  -- Get current usage
  SELECT COALESCE(ac.credits_used, 0) INTO _new_count
  FROM ai_credits ac
  WHERE ac.organization_id = _organization_id AND ac.month_year = _month_year;
  
  IF _new_count IS NULL THEN
    _new_count := 0;
  END IF;
  
  -- Check if limit would be exceeded (only for founder plan)
  IF _is_founder AND (_new_count + _amount) > 5000 THEN
    RETURN QUERY SELECT false AS success, _new_count AS new_count, _limit AS credits_limit;
    RETURN;
  END IF;
  
  -- Increment or insert
  INSERT INTO ai_credits (organization_id, month_year, credits_used)
  VALUES (_organization_id, _month_year, _amount)
  ON CONFLICT (organization_id, month_year)
  DO UPDATE SET 
    credits_used = ai_credits.credits_used + _amount,
    updated_at = now()
  RETURNING credits_used INTO _new_count;
  
  RETURN QUERY SELECT true AS success, _new_count AS new_count, _limit AS credits_limit;
END;
$$;