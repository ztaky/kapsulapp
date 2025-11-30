-- Create enum for legal page types
CREATE TYPE public.legal_page_type AS ENUM ('mentions_legales', 'politique_confidentialite', 'cgv');

-- Create legal_pages table
CREATE TABLE public.legal_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type legal_page_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, type)
);

-- Enable RLS
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their organization's legal pages
CREATE POLICY "Coaches can manage their org legal pages"
ON public.legal_pages
FOR ALL
USING (has_org_role(auth.uid(), organization_id, 'coach'::org_role));

-- Public can view legal pages (for landing page visitors)
CREATE POLICY "Public can view legal pages"
ON public.legal_pages
FOR SELECT
USING (true);

-- Super admins can manage all legal pages
CREATE POLICY "Super admins can manage all legal pages"
ON public.legal_pages
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_legal_pages_updated_at
BEFORE UPDATE ON public.legal_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();