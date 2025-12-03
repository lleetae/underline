-- Preserve payment history when users or matches are deleted
-- Change Foreign Key constraints from CASCADE to SET NULL

-- 1. Make columns nullable if they aren't already
ALTER TABLE public.payments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN match_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN send_user_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN receive_user_id DROP NOT NULL;

-- 2. Drop existing constraints (trying common names)
-- We use a DO block to find and drop constraints dynamically to be safe
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop FK for user_id
    FOR r IN SELECT constraint_name FROM information_schema.table_constraints 
             WHERE table_name = 'payments' AND constraint_type = 'FOREIGN KEY' 
             AND constraint_name LIKE '%user_id%'
    LOOP
        EXECUTE 'ALTER TABLE public.payments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    -- Drop FK for match_id
    FOR r IN SELECT constraint_name FROM information_schema.table_constraints 
             WHERE table_name = 'payments' AND constraint_type = 'FOREIGN KEY' 
             AND constraint_name LIKE '%match_id%'
    LOOP
        EXECUTE 'ALTER TABLE public.payments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 3. Re-add constraints with ON DELETE SET NULL

-- user_id references auth.users
ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- match_id references match_requests (based on current usage)
-- Note: If match_requests is deleted, we still want to keep the payment record
ALTER TABLE public.payments
  ADD CONSTRAINT payments_match_id_fkey
  FOREIGN KEY (match_id)
  REFERENCES public.match_requests(id)
  ON DELETE SET NULL;

-- send_user_id references member
ALTER TABLE public.payments
  ADD CONSTRAINT payments_send_user_id_fkey
  FOREIGN KEY (send_user_id)
  REFERENCES public.member(id)
  ON DELETE SET NULL;

-- receive_user_id references member
ALTER TABLE public.payments
  ADD CONSTRAINT payments_receive_user_id_fkey
  FOREIGN KEY (receive_user_id)
  REFERENCES public.member(id)
  ON DELETE SET NULL;
