-- Migration: 007_cron_close_lot.sql
-- Schedules the close-lot Edge Function via pg_cron every 15 seconds.
-- Requires the pg_cron extension (enabled by default on Supabase Pro).
-- On Supabase Free, use the Scheduled Functions feature in the dashboard instead.

-- Enable pg_cron (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant pg_cron usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule: call the close-lot function every 15 seconds.
-- pg_cron minimum granularity is 1 minute, so we chain 4 calls offset by 15s.
-- Each calls net.http_post() directly to the Edge Function URL.

SELECT cron.schedule(
  'close-lot-0s',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://kvuexwjppbxarukftvqo.supabase.co/functions/v1/close-lot',
      headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

SELECT cron.schedule(
  'close-lot-15s',
  '* * * * *',
  $$
    SELECT pg_sleep(15);
    SELECT net.http_post(
      url := 'https://kvuexwjppbxarukftvqo.supabase.co/functions/v1/close-lot',
      headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

SELECT cron.schedule(
  'close-lot-30s',
  '* * * * *',
  $$
    SELECT pg_sleep(30);
    SELECT net.http_post(
      url := 'https://kvuexwjppbxarukftvqo.supabase.co/functions/v1/close-lot',
      headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

SELECT cron.schedule(
  'close-lot-45s',
  '* * * * *',
  $$
    SELECT pg_sleep(45);
    SELECT net.http_post(
      url := 'https://kvuexwjppbxarukftvqo.supabase.co/functions/v1/close-lot',
      headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

-- Verify scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule:
-- SELECT cron.unschedule('close-lot-0s');
-- SELECT cron.unschedule('close-lot-15s');
-- SELECT cron.unschedule('close-lot-30s');
-- SELECT cron.unschedule('close-lot-45s');
