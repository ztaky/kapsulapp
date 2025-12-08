-- Add custom_domain_status column to track verification state
ALTER TABLE public.organizations 
ADD COLUMN custom_domain_status TEXT DEFAULT NULL 
CHECK (custom_domain_status IN ('pending', 'verified', 'failed', NULL));

-- Add custom_domain_verified_at timestamp
ALTER TABLE public.organizations 
ADD COLUMN custom_domain_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;