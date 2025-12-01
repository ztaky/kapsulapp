-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the process-email-sequences function to run every hour
SELECT cron.schedule(
  'process-email-sequences-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mwnrbccqteqslzbdrnuw.supabase.co/functions/v1/process-email-sequences',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bnJiY2NxdGVxc2x6YmRybnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTM1MzksImV4cCI6MjA3OTcyOTUzOX0.utYECATCAQwOJXzGBx4ptqDiJGBUg0CQ8nb4OE_xIb0"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);