-- Add email limit column to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email_limit_per_month INTEGER DEFAULT 3000;

-- Create email_usage table (similar to ai_credits)
CREATE TABLE IF NOT EXISTS email_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  bonus_emails INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, month_year)
);

-- Enable RLS
ALTER TABLE email_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_usage
CREATE POLICY "Coaches can view their org email usage"
ON email_usage FOR SELECT
USING (has_org_role(auth.uid(), organization_id, 'coach'::org_role));

CREATE POLICY "Super admins can manage all email usage"
ON email_usage FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_email_usage_updated_at
BEFORE UPDATE ON email_usage
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to get email usage
CREATE OR REPLACE FUNCTION get_email_usage(_organization_id UUID, _month_year TEXT)
RETURNS TABLE(emails_sent INTEGER, emails_limit INTEGER, bonus_emails INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _emails_sent INTEGER;
  _total_bonus INTEGER;
  _is_founder BOOLEAN;
  _custom_limit INTEGER;
BEGIN
  -- Get current month usage
  SELECT COALESCE(eu.emails_sent, 0) INTO _emails_sent
  FROM email_usage eu
  WHERE eu.organization_id = _organization_id AND eu.month_year = _month_year;
  
  IF _emails_sent IS NULL THEN
    _emails_sent := 0;
  END IF;
  
  -- Get total bonus emails (all time)
  SELECT COALESCE(SUM(eu.bonus_emails), 0) INTO _total_bonus
  FROM email_usage eu
  WHERE eu.organization_id = _organization_id;
  
  -- Get organization plan info
  SELECT o.is_founder_plan, o.email_limit_per_month INTO _is_founder, _custom_limit
  FROM organizations o
  WHERE o.id = _organization_id;
  
  -- Determine limit: use custom limit if set, otherwise 3000 for founders
  RETURN QUERY SELECT 
    _emails_sent AS emails_sent,
    COALESCE(_custom_limit, CASE WHEN _is_founder THEN 3000 ELSE NULL END) AS emails_limit,
    _total_bonus AS bonus_emails;
END;
$$;

-- Function to increment email usage (with quota check)
CREATE OR REPLACE FUNCTION increment_email_usage(_organization_id UUID, _month_year TEXT, _amount INTEGER DEFAULT 1)
RETURNS TABLE(success BOOLEAN, new_count INTEGER, emails_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_count INTEGER;
  _is_founder BOOLEAN;
  _custom_limit INTEGER;
  _limit INTEGER;
  _total_bonus INTEGER;
  _effective_limit INTEGER;
BEGIN
  -- Get organization plan info
  SELECT o.is_founder_plan, o.email_limit_per_month INTO _is_founder, _custom_limit
  FROM organizations o
  WHERE o.id = _organization_id;
  
  -- Determine limit
  _limit := COALESCE(_custom_limit, CASE WHEN _is_founder THEN 3000 ELSE NULL END);
  
  -- Get total bonus emails
  SELECT COALESCE(SUM(eu.bonus_emails), 0) INTO _total_bonus
  FROM email_usage eu
  WHERE eu.organization_id = _organization_id;
  
  -- Get current usage
  SELECT COALESCE(eu.emails_sent, 0) INTO _new_count
  FROM email_usage eu
  WHERE eu.organization_id = _organization_id AND eu.month_year = _month_year;
  
  IF _new_count IS NULL THEN
    _new_count := 0;
  END IF;
  
  -- Check quota if there's a limit
  IF _limit IS NOT NULL THEN
    _effective_limit := _limit + _total_bonus;
    IF (_new_count + _amount) > _effective_limit THEN
      RETURN QUERY SELECT false AS success, _new_count AS new_count, _limit AS emails_limit;
      RETURN;
    END IF;
  END IF;
  
  -- Increment usage
  INSERT INTO email_usage (organization_id, month_year, emails_sent, bonus_emails)
  VALUES (_organization_id, _month_year, _amount, 0)
  ON CONFLICT (organization_id, month_year)
  DO UPDATE SET 
    emails_sent = email_usage.emails_sent + _amount,
    updated_at = now()
  RETURNING emails_sent INTO _new_count;
  
  RETURN QUERY SELECT true AS success, _new_count AS new_count, _limit AS emails_limit;
END;
$$;

-- Function to add bonus emails
CREATE OR REPLACE FUNCTION add_bonus_emails(_organization_id UUID, _emails_amount INTEGER, _month_year TEXT)
RETURNS TABLE(success BOOLEAN, new_bonus INTEGER, total_bonus INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_bonus INTEGER;
  _total_bonus INTEGER;
BEGIN
  INSERT INTO email_usage (organization_id, month_year, emails_sent, bonus_emails)
  VALUES (_organization_id, _month_year, 0, _emails_amount)
  ON CONFLICT (organization_id, month_year)
  DO UPDATE SET 
    bonus_emails = email_usage.bonus_emails + _emails_amount,
    updated_at = now()
  RETURNING bonus_emails INTO _new_bonus;
  
  SELECT COALESCE(SUM(eu.bonus_emails), 0) INTO _total_bonus
  FROM email_usage eu
  WHERE eu.organization_id = _organization_id;
  
  RETURN QUERY SELECT true AS success, _new_bonus AS new_bonus, _total_bonus AS total_bonus;
END;
$$;