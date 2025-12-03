-- Re-implement Soft Delete & Fix Payment Constraints

-- 1. Enable Soft Delete on Member Table
-- Add legacy_auth_id to store the ID of deleted users
ALTER TABLE public.member 
ADD COLUMN IF NOT EXISTS legacy_auth_id TEXT;

-- Make auth_id nullable to allow unlinking from auth.users without deleting the member record
ALTER TABLE public.member 
ALTER COLUMN auth_id DROP NOT NULL;

-- Index for looking up by legacy ID
CREATE INDEX IF NOT EXISTS idx_member_legacy_auth_id ON public.member(legacy_auth_id);


-- 2. Fix Payments Table Constraints (Safety Net)
-- Ensure match_id is nullable (so it doesn't error if match is deleted, though we try to keep it)
ALTER TABLE public.payments ALTER COLUMN match_id DROP NOT NULL;

-- Ensure payments_match_id_fkey is ON DELETE SET NULL
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop existing FK if exists to recreate it correctly
    FOR r IN SELECT constraint_name 
             FROM information_schema.table_constraints 
             WHERE table_name = 'payments' 
             AND constraint_name = 'payments_match_id_fkey'
    LOOP
        EXECUTE 'ALTER TABLE public.payments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_match_id_fkey
  FOREIGN KEY (match_id)
  REFERENCES public.match_requests(id)
  ON DELETE SET NULL;
