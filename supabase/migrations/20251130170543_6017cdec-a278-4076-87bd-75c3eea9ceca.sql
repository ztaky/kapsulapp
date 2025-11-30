-- Create lesson-resources storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-resources', 'lesson-resources', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for lesson-resources bucket
CREATE POLICY "Authenticated users can upload lesson resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-resources');

CREATE POLICY "Authenticated users can update their lesson resources"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'lesson-resources');

CREATE POLICY "Authenticated users can delete lesson resources"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-resources');

CREATE POLICY "Public read access for lesson resources"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-resources');

-- Add resources JSONB column to lessons table (keeps resource_url for backwards compatibility)
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb;