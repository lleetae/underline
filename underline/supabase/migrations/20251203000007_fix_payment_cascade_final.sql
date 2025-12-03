-- Fix payment history deletion (Final Attempt)
-- Explicitly drop and recreate all FKs with ON DELETE SET NULL

-- 1. Ensure columns are nullable
ALTER TABLE public.payments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN match_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN send_user_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN receive_user_id DROP NOT NULL;

-- 2. Drop ALL foreign keys on payments table to be sure
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT constraint_name 
             FROM information_schema.table_constraints 
             WHERE table_name = 'payments' AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE public.payments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 3. Recreate Foreign Keys with ON DELETE SET NULL

-- user_id -> auth.users
ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- match_id -> match_requests
ALTER TABLE public.payments
  ADD CONSTRAINT payments_match_id_fkey
  FOREIGN KEY (match_id)
  REFERENCES public.match_requests(id)
  ON DELETE SET NULL;

-- send_user_id -> member
ALTER TABLE public.payments
  ADD CONSTRAINT payments_send_user_id_fkey
  FOREIGN KEY (send_user_id)
  REFERENCES public.member(id)
  ON DELETE SET NULL;

-- receive_user_id -> member
ALTER TABLE public.payments
  ADD CONSTRAINT payments_receive_user_id_fkey
  FOREIGN KEY (receive_user_id)
  REFERENCES public.member(id)
  ON DELETE SET NULL;
