-- Create table for course drafts
CREATE TABLE IF NOT EXISTS public.course_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.course_drafts ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their org drafts
CREATE POLICY "Coaches can manage their org drafts"
  ON public.course_drafts
  FOR ALL
  USING (has_org_role(auth.uid(), organization_id, 'coach'::org_role));

-- Super admins can manage all drafts
CREATE POLICY "Super admins can manage all drafts"
  ON public.course_drafts
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_course_drafts_updated_at
  BEFORE UPDATE ON public.course_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_drafts_organization_id ON public.course_drafts(organization_id);
CREATE INDEX IF NOT EXISTS idx_course_drafts_created_at ON public.course_drafts(created_at DESC);