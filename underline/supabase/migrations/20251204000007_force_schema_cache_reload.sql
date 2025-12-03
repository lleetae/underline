-- Force PostgREST Schema Cache Reload
-- The 'location' column exists but is not found in cache.
-- Reloading the config should fix this.

NOTIFY pgrst, 'reload config';

-- Also adding a comment to the table as a backup DDL trigger
COMMENT ON TABLE public.member IS 'Member profiles (Schema Cache Reloaded)';
