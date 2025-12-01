-- Create storage bucket for AI assistant file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-assistant-uploads', 'ai-assistant-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ai-assistant-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ai-assistant-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ai-assistant-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);