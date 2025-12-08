-- Add custom_domain column to organizations table
ALTER TABLE public.organizations ADD COLUMN custom_domain TEXT;