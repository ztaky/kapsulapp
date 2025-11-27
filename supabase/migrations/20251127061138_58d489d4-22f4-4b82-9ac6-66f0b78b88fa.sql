-- Fix function search path
CREATE OR REPLACE FUNCTION increment_landing_page_views(page_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE landing_pages
  SET views_count = views_count + 1
  WHERE slug = page_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;