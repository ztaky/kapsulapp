-- Drop and recreate functions with new return types
DROP FUNCTION IF EXISTS public.get_ai_credits_usage(UUID, TEXT);
DROP FUNCTION IF EXISTS public.increment_ai_credits(UUID, TEXT, INTEGER);

-- Fonction pour ajouter des crédits bonus
CREATE OR REPLACE FUNCTION public.add_bonus_credits(
  _organization_id UUID,
  _credits_amount INTEGER,
  _month_year TEXT
)
RETURNS TABLE(success BOOLEAN, new_bonus INTEGER, total_bonus INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_bonus INTEGER;
  _total_bonus INTEGER;
BEGIN
  INSERT INTO ai_credits (organization_id, month_year, credits_used, bonus_credits)
  VALUES (_organization_id, _month_year, 0, _credits_amount)
  ON CONFLICT (organization_id, month_year)
  DO UPDATE SET 
    bonus_credits = ai_credits.bonus_credits + _credits_amount,
    updated_at = now()
  RETURNING bonus_credits INTO _new_bonus;
  
  SELECT COALESCE(SUM(bonus_credits), 0) INTO _total_bonus
  FROM ai_credits
  WHERE organization_id = _organization_id;
  
  RETURN QUERY SELECT true AS success, _new_bonus AS new_bonus, _total_bonus AS total_bonus;
END;
$$;

-- Recreate get_ai_credits_usage with bonus_credits
CREATE OR REPLACE FUNCTION public.get_ai_credits_usage(_organization_id UUID, _month_year TEXT)
RETURNS TABLE(credits_used INTEGER, credits_limit INTEGER, bonus_credits INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _credits_used INTEGER;
  _total_bonus INTEGER;
  _is_founder BOOLEAN;
BEGIN
  SELECT COALESCE(ac.credits_used, 0) INTO _credits_used
  FROM ai_credits ac
  WHERE ac.organization_id = _organization_id AND ac.month_year = _month_year;
  
  IF _credits_used IS NULL THEN
    _credits_used := 0;
  END IF;
  
  SELECT COALESCE(SUM(ac.bonus_credits), 0) INTO _total_bonus
  FROM ai_credits ac
  WHERE ac.organization_id = _organization_id;
  
  SELECT o.is_founder_plan INTO _is_founder
  FROM organizations o
  WHERE o.id = _organization_id;
  
  RETURN QUERY SELECT 
    _credits_used AS credits_used,
    CASE WHEN _is_founder THEN 5000 ELSE NULL END AS credits_limit,
    _total_bonus AS bonus_credits;
END;
$$;

-- Recreate increment_ai_credits with bonus support
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
  _total_bonus INTEGER;
  _effective_limit INTEGER;
BEGIN
  SELECT o.is_founder_plan INTO _is_founder
  FROM organizations o
  WHERE o.id = _organization_id;
  
  _limit := CASE WHEN _is_founder THEN 5000 ELSE NULL END;
  
  SELECT COALESCE(SUM(ac.bonus_credits), 0) INTO _total_bonus
  FROM ai_credits ac
  WHERE ac.organization_id = _organization_id;
  
  SELECT COALESCE(ac.credits_used, 0) INTO _new_count
  FROM ai_credits ac
  WHERE ac.organization_id = _organization_id AND ac.month_year = _month_year;
  
  IF _new_count IS NULL THEN
    _new_count := 0;
  END IF;
  
  IF _is_founder THEN
    _effective_limit := 5000 + _total_bonus;
    IF (_new_count + _amount) > _effective_limit THEN
      RETURN QUERY SELECT false AS success, _new_count AS new_count, _limit AS credits_limit;
      RETURN;
    END IF;
  END IF;
  
  INSERT INTO ai_credits (organization_id, month_year, credits_used, bonus_credits)
  VALUES (_organization_id, _month_year, _amount, 0)
  ON CONFLICT (organization_id, month_year)
  DO UPDATE SET 
    credits_used = ai_credits.credits_used + _amount,
    updated_at = now()
  RETURNING credits_used INTO _new_count;
  
  RETURN QUERY SELECT true AS success, _new_count AS new_count, _limit AS credits_limit;
END;
$$;