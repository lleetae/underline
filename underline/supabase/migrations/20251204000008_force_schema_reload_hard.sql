-- Force Hard Schema Cache Reload
-- The previous NOTIFY might not have worked.
-- Modifying the table structure forces PostgREST to refresh.

ALTER TABLE public.member ADD COLUMN IF NOT EXISTS _cache_buster text;
ALTER TABLE public.member DROP COLUMN IF EXISTS _cache_buster;

NOTIFY pgrst, 'reload config';
