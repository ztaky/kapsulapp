-- Add paypal_email column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS paypal_email text;