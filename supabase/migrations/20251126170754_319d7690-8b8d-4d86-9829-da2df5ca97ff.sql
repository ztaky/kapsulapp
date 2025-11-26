-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Org owners and admins can manage their courses" ON public.courses;
DROP POLICY IF EXISTS "Org owners and admins can manage their lessons" ON public.lessons;
DROP POLICY IF EXISTS "Org owners and admins can manage their modules" ON public.modules;
DROP POLICY IF EXISTS "Org owners and admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners and admins can view their members profiles" ON public.profiles;
DROP POLICY IF EXISTS "Org owners and admins can view their org purchases" ON public.purchases;
DROP POLICY IF EXISTS "Org owners and admins can view their org progress" ON public.user_progress;

-- Step 2: Drop functions that depend on org_role enum
DROP FUNCTION IF EXISTS public.has_org_role(uuid, uuid, org_role);
DROP FUNCTION IF EXISTS public.get_user_org_role(uuid, uuid);

-- Step 3: Remove default value temporarily
ALTER TABLE public.organization_members ALTER COLUMN role DROP DEFAULT;

-- Step 4: Update all existing 'owner' and 'admin' roles to 'student' 
UPDATE public.organization_members 
SET role = 'student'::org_role 
WHERE role IN ('owner'::org_role, 'admin'::org_role);

-- Step 5: Convert column to text temporarily
ALTER TABLE public.organization_members ALTER COLUMN role TYPE text;

-- Step 6: Drop and recreate the enum
DROP TYPE public.org_role;
CREATE TYPE public.org_role AS ENUM ('coach', 'student');

-- Step 7: Convert column back to new enum type
ALTER TABLE public.organization_members 
  ALTER COLUMN role TYPE public.org_role USING role::public.org_role;

-- Step 8: Set default value
ALTER TABLE public.organization_members ALTER COLUMN role SET DEFAULT 'student'::org_role;

-- Step 9: Recreate get_user_org_role function
CREATE OR REPLACE FUNCTION public.get_user_org_role(_user_id uuid, _org_id uuid)
RETURNS org_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role
  FROM organization_members
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1
$$;

-- Step 10: Recreate has_org_role function
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _role org_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = _user_id 
      AND organization_id = _org_id 
      AND role = _role
  )
$$;

-- Step 11: Recreate RLS policies with 'coach' role
CREATE POLICY "Coaches can manage their courses" 
ON public.courses 
FOR ALL
USING (
  (organization_id IS NOT NULL) 
  AND has_org_role(auth.uid(), organization_id, 'coach'::org_role)
);

CREATE POLICY "Coaches can manage their lessons" 
ON public.lessons 
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM modules
    JOIN courses ON courses.id = modules.course_id
    WHERE modules.id = lessons.module_id
      AND courses.organization_id IS NOT NULL
      AND has_org_role(auth.uid(), courses.organization_id, 'coach'::org_role)
  )
);

CREATE POLICY "Coaches can manage their modules" 
ON public.modules 
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM courses
    WHERE courses.id = modules.course_id
      AND courses.organization_id IS NOT NULL
      AND has_org_role(auth.uid(), courses.organization_id, 'coach'::org_role)
  )
);

CREATE POLICY "Coaches can manage members" 
ON public.organization_members 
FOR ALL
USING (
  has_org_role(auth.uid(), organization_id, 'coach'::org_role)
);

CREATE POLICY "Coaches can view their members profiles" 
ON public.profiles 
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_members.user_id = profiles.id
      AND has_org_role(auth.uid(), organization_members.organization_id, 'coach'::org_role)
  )
);

CREATE POLICY "Coaches can view their org purchases" 
ON public.purchases 
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM courses
    WHERE courses.id = purchases.course_id
      AND courses.organization_id IS NOT NULL
      AND has_org_role(auth.uid(), courses.organization_id, 'coach'::org_role)
  )
);

CREATE POLICY "Coaches can view their org progress" 
ON public.user_progress 
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM lessons
    JOIN modules ON modules.id = lessons.module_id
    JOIN courses ON courses.id = modules.course_id
    WHERE lessons.id = user_progress.lesson_id
      AND courses.organization_id IS NOT NULL
      AND has_org_role(auth.uid(), courses.organization_id, 'coach'::org_role)
  )
);