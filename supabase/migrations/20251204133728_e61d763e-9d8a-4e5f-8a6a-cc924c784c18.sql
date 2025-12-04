-- Create course_enrollments table for manual course access
CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES public.profiles(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Coaches can manage enrollments for their org courses
CREATE POLICY "Coaches can manage their course enrollments"
ON public.course_enrollments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_enrollments.course_id
    AND c.organization_id IS NOT NULL
    AND has_org_role(auth.uid(), c.organization_id, 'coach')
  )
);

-- Students can view their own enrollments
CREATE POLICY "Users can view their own enrollments"
ON public.course_enrollments
FOR SELECT
USING (auth.uid() = user_id);

-- Super admins can manage all
CREATE POLICY "Super admins can manage all enrollments"
ON public.course_enrollments
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Create has_course_access function
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM purchases 
    WHERE user_id = _user_id AND course_id = _course_id AND status = 'completed'
  ) OR EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE user_id = _user_id AND course_id = _course_id AND is_active = true
  )
$$;