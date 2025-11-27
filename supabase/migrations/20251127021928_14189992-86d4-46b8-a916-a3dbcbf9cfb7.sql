-- Create enum for landing page status
CREATE TYPE landing_page_status AS ENUM ('draft', 'published');

-- Create landing_pages table
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status landing_page_status NOT NULL DEFAULT 'draft',
  design_config JSONB NOT NULL DEFAULT '{"colors": [], "fonts": [], "layout": "modern"}',
  content JSONB NOT NULL DEFAULT '{}',
  trainer_info JSONB,
  target_audience TEXT,
  reference_screenshots TEXT[],
  clone_source_url TEXT,
  stripe_product_id TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  conversions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payment columns to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_merchant_id TEXT,
ADD COLUMN IF NOT EXISTS payment_methods_enabled TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for landing_pages
CREATE POLICY "Super admins can manage all landing pages"
ON public.landing_pages
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Coaches can manage their org landing pages"
ON public.landing_pages
FOR ALL
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_org_role(auth.uid(), organization_id, 'coach'::org_role)
);

CREATE POLICY "Published landing pages are viewable by everyone"
ON public.landing_pages
FOR SELECT
TO public
USING (status = 'published');

-- Create trigger for updated_at
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for slug lookups
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_organization ON public.landing_pages(organization_id);
CREATE INDEX idx_landing_pages_course ON public.landing_pages(course_id);