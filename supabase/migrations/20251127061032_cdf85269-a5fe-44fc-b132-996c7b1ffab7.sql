-- Create storage bucket for landing page references
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-page-references', 'landing-page-references', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for landing page reference uploads
CREATE POLICY "Anyone can view landing page references"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-page-references');

CREATE POLICY "Authenticated users can upload landing page references"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'landing-page-references' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own landing page references"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'landing-page-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);