-- Create course-covers storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-covers', 'course-covers', true);

-- Allow authenticated users to upload to course-covers bucket
CREATE POLICY "Authenticated users can upload course covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-covers');

-- Allow authenticated users to update their course covers
CREATE POLICY "Authenticated users can update course covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-covers');

-- Allow public read access to course covers
CREATE POLICY "Public can view course covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-covers');

-- Allow authenticated users to delete their course covers
CREATE POLICY "Authenticated users can delete course covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-covers');