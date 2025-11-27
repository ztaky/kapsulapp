-- Add webhook_url column to organizations for outgoing webhooks (Zapier/Make)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS webhook_url text;

-- Add webhook_events column to track which events to send
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS webhook_events text[] DEFAULT ARRAY['new_student', 'new_purchase']::text[];