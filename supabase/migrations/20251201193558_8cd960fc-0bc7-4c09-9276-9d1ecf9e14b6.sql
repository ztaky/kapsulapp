-- Create sales_leads table for tracking chat conversations and lead capture
CREATE TABLE public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  session_id TEXT NOT NULL UNIQUE,
  conversation JSONB NOT NULL DEFAULT '[]',
  first_question TEXT,
  source_page TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}'
);

-- Index for performance
CREATE INDEX idx_sales_leads_email ON public.sales_leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_sales_leads_created_at ON public.sales_leads(created_at DESC);
CREATE INDEX idx_sales_leads_session ON public.sales_leads(session_id);

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for anonymous visitors)
CREATE POLICY "Anyone can insert leads"
  ON public.sales_leads
  FOR INSERT
  WITH CHECK (true);

-- Allow updates by session_id
CREATE POLICY "Anyone can update their session"
  ON public.sales_leads
  FOR UPDATE
  USING (true);

-- Super admins can view all leads
CREATE POLICY "Super admins can view all leads"
  ON public.sales_leads
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();