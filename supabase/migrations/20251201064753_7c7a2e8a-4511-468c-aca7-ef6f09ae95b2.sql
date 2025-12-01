-- Explicitly set SECURITY INVOKER on the view to silence the linter
ALTER VIEW public.purchases_safe SET (security_invoker = on);