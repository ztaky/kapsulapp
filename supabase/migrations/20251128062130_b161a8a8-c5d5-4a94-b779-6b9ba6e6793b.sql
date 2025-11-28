-- Fix: Allow coaches to update their own organization
CREATE POLICY "Coaches can update their organization"
ON public.organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'coach'
  )
);

-- Fix: Add WITH CHECK to modules policy for coaches
DROP POLICY IF EXISTS "Coaches can manage their modules" ON public.modules;

CREATE POLICY "Coaches can manage their modules"
ON public.modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = modules.course_id
    AND courses.organization_id IS NOT NULL
    AND has_org_role(auth.uid(), courses.organization_id, 'coach'::org_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = modules.course_id
    AND courses.organization_id IS NOT NULL
    AND has_org_role(auth.uid(), courses.organization_id, 'coach'::org_role)
  )
);