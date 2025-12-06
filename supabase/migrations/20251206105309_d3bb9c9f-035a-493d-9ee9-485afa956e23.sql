-- Rendre le bucket ai-assistant-uploads public pour permettre l'extraction
UPDATE storage.buckets SET public = true WHERE id = 'ai-assistant-uploads';

-- Créer une politique RLS permissive pour les uploads authentifiés
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for ai-assistant-uploads" ON storage.objects;

-- Politique pour uploader (utilisateurs authentifiés avec leur user_id comme premier dossier)
CREATE POLICY "Users can upload to ai-assistant-uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ai-assistant-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour voir ses propres fichiers
CREATE POLICY "Users can view own files in ai-assistant-uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ai-assistant-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour supprimer ses propres fichiers
CREATE POLICY "Users can delete own files in ai-assistant-uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ai-assistant-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour accès public en lecture (nécessaire pour l'edge function)
CREATE POLICY "Public read for ai-assistant-uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ai-assistant-uploads');