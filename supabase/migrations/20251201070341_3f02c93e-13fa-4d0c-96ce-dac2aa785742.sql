-- Add plan limits columns to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS is_founder_plan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_coaches INTEGER DEFAULT 1;

-- Create function to check student limit
CREATE OR REPLACE FUNCTION public.check_student_limit(_organization_id uuid)
RETURNS TABLE(can_add BOOLEAN, current_count INTEGER, max_allowed INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_count INTEGER;
  _max_students INTEGER;
BEGIN
  -- Get current student count
  SELECT COUNT(*) INTO _current_count
  FROM organization_members
  WHERE organization_id = _organization_id AND role = 'student';
  
  -- Get max students limit
  SELECT o.max_students INTO _max_students
  FROM organizations o
  WHERE o.id = _organization_id;
  
  -- Return result (NULL max means unlimited)
  RETURN QUERY SELECT 
    (_max_students IS NULL OR _current_count < _max_students) AS can_add,
    _current_count AS current_count,
    _max_students AS max_allowed;
END;
$$;

-- Create function to check coach limit
CREATE OR REPLACE FUNCTION public.check_coach_limit(_organization_id uuid)
RETURNS TABLE(can_add BOOLEAN, current_count INTEGER, max_allowed INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_count INTEGER;
  _max_coaches INTEGER;
BEGIN
  -- Get current coach count
  SELECT COUNT(*) INTO _current_count
  FROM organization_members
  WHERE organization_id = _organization_id AND role = 'coach';
  
  -- Get max coaches limit
  SELECT o.max_coaches INTO _max_coaches
  FROM organizations o
  WHERE o.id = _organization_id;
  
  -- Return result (NULL max means unlimited)
  RETURN QUERY SELECT 
    (_max_coaches IS NULL OR _current_count < _max_coaches) AS can_add,
    _current_count AS current_count,
    _max_coaches AS max_allowed;
END;
$$;