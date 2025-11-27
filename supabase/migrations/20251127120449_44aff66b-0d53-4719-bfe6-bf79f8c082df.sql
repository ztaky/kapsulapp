-- Create FAQ entries table
CREATE TABLE public.faq_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  source_ticket_ids UUID[] DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_entries ENABLE ROW LEVEL SECURITY;

-- Public can read published FAQ entries
CREATE POLICY "Anyone can view published FAQ entries"
ON public.faq_entries
FOR SELECT
USING (is_published = true);

-- Super admins can manage all FAQ entries
CREATE POLICY "Super admins can manage FAQ entries"
ON public.faq_entries
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Add updated_at trigger
CREATE TRIGGER update_faq_entries_updated_at
BEFORE UPDATE ON public.faq_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment FAQ views
CREATE OR REPLACE FUNCTION public.increment_faq_views(faq_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE faq_entries
  SET views_count = views_count + 1
  WHERE id = faq_id;
END;
$$;

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION public.increment_faq_helpful(faq_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE faq_entries
  SET helpful_count = helpful_count + 1
  WHERE id = faq_id;
END;
$$;