-- =====================================================
-- Weekly Batch Logic Functions
-- Underline Dating App - Matching Period Management
-- =====================================================

-- Function: Check if current time is in matching period
-- Returns: true if Friday or Saturday (KST timezone)
CREATE OR REPLACE FUNCTION is_matching_period()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Extract day of week from current time in KST (Asia/Seoul)
  -- DOW: 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  RETURN EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Asia/Seoul')) IN (5, 6);
END;
$$;

-- Test the function
-- SELECT is_matching_period();

-- =====================================================

-- Function: Weekly reset (runs every Sunday)
-- Expires old pending matches and cleans up data
CREATE OR REPLACE FUNCTION weekly_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Expire pending matches older than 7 days
  UPDATE matches
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '7 days';
  
  -- 2. Log the reset for monitoring
  RAISE NOTICE 'Weekly reset completed at %', NOW();
  
  -- 3. Optional: Archive old data
  -- INSERT INTO matches_archive SELECT * FROM matches WHERE status = 'expired' AND updated_at < NOW() - INTERVAL '30 days';
  -- DELETE FROM matches WHERE status = 'expired' AND updated_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Test the function (run manually)
-- SELECT weekly_reset();

-- =====================================================

-- Schedule weekly reset using pg_cron
-- Runs every Sunday at 00:00 UTC (09:00 KST)
-- Note: pg_cron extension must be enabled first

-- Enable pg_cron (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job
SELECT cron.schedule(
  'weekly-matching-reset',           -- job name
  '0 0 * * 0',                       -- Every Sunday at 00:00 UTC (09:00 KST)
  $$SELECT weekly_reset();$$         -- SQL to execute
);

-- View scheduled jobs
-- SELECT * FROM cron.job;

-- Unschedule if needed (for development)
-- SELECT cron.unschedule('weekly-matching-reset');

-- =====================================================

-- Update RLS Policy: Restrict profile viewing to matching period
-- Drop existing policy first
DROP POLICY IF EXISTS "Users can view matching profiles" ON member;

-- Create new policy with matching period check
CREATE POLICY "Users can view matching profiles"
ON member
FOR SELECT
USING (
  -- Users can always view their own profile
  auth.uid() = id
  OR
  -- Can view others' profiles only during matching period (Fri-Sat)
  is_matching_period()
);

-- =====================================================

-- Verification Queries

-- 1. Check if functions exist
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('is_matching_period', 'weekly_reset');

-- 2. Check RLS policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'member'
  AND policyname = 'Users can view matching profiles';

-- 3. Test matching period (should return true on Fri/Sat)
SELECT is_matching_period() as is_matching_now;

-- 4. Check cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  command
FROM cron.job
WHERE jobname = 'weekly-matching-reset';

-- =====================================================
-- NOTES
-- =====================================================

/*
TIMEZONE NOTES:
- Supabase uses UTC by default
- Korea is UTC+9
- Sunday 00:00 UTC = Sunday 09:00 KST
- This means reset happens Sunday morning in Korea time

MATCHING PERIOD:
- Registration: Sun-Thu (users can apply)
- Matching Active: Fri-Sat (users can browse and send requests)
- Reset: Sunday 00:00 UTC (cleanup expired matches)

TESTING:
- To test during non-matching period, temporarily modify is_matching_period()
- To manually trigger reset: SELECT weekly_reset();
- To check what day it is: SELECT EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Asia/Seoul'));

CRON JOB MANAGEMENT:
- View all jobs: SELECT * FROM cron.job;
- View job history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
- Unschedule: SELECT cron.unschedule('weekly-matching-reset');

SECURITY:
- weekly_reset() uses SECURITY DEFINER to run with elevated privileges
- Only the scheduled cron job should call this function
- RLS policies enforce user-level restrictions
*/
