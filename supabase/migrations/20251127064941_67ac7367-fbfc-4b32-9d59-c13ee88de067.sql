-- Create coach design preferences table to learn and store coach preferences
CREATE TABLE IF NOT EXISTS public.coach_design_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  preferred_colors TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_fonts JSONB DEFAULT '{}'::JSONB,
  preferred_cta_style TEXT DEFAULT 'gradient',
  preferred_layout_style TEXT DEFAULT 'queen',
  learned_from_edits JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.coach_design_preferences ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their org preferences
CREATE POLICY "Coaches can manage their org preferences"
ON public.coach_design_preferences
FOR ALL
USING (
  organization_id IS NOT NULL 
  AND has_org_role(auth.uid(), organization_id, 'coach'::org_role)
);

-- Super admins can manage all preferences
CREATE POLICY "Super admins can manage all preferences"
ON public.coach_design_preferences
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_coach_design_preferences_updated_at
BEFORE UPDATE ON public.coach_design_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_coach_design_preferences_org_id ON public.coach_design_preferences(organization_id);