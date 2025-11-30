-- Add specialty and description columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS specialty TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;