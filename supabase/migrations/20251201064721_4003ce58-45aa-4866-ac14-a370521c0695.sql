-- Fix: Replace SECURITY DEFINER view with regular view that respects RLS
DROP VIEW IF EXISTS public.purchases_safe;

-- Create a regular view (defaults to SECURITY INVOKER)
-- This view inherits the RLS policies from the purchases table
CREATE VIEW public.purchases_safe AS
SELECT 
  id,
  user_id,
  course_id,
  amount,
  status,
  purchased_at
FROM public.purchases;

-- Grant access to authenticated users
GRANT SELECT ON public.purchases_safe TO authenticated;

COMMENT ON VIEW public.purchases_safe IS 'Safe view of purchases excluding sensitive payment IDs (stripe_payment_id, stripe_session_id). Inherits RLS from purchases table.';