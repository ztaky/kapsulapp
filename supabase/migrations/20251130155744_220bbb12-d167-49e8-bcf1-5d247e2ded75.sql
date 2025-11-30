-- Add onboarding_completed column to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create onboarding_progress table to track steps
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  step_key text NOT NULL,
  completed_at timestamptz,
  skipped boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, step_key)
);

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_progress
CREATE POLICY "Coaches can manage their org onboarding progress"
ON public.onboarding_progress
FOR ALL
USING (has_org_role(auth.uid(), organization_id, 'coach'::org_role));

CREATE POLICY "Super admins can manage all onboarding progress"
ON public.onboarding_progress
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));