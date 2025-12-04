-- Force fix payments FK constraints to ON DELETE SET NULL
-- This ensures payment records are preserved when users are deleted.

DO $$
BEGIN
    -- 1. Drop existing constraints if they exist
    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_match_id_fkey;

    -- 2. Re-add user_id constraint with ON DELETE SET NULL
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;

    -- 3. Re-add match_id constraint with ON DELETE SET NULL
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_match_id_fkey
      FOREIGN KEY (match_id)
      REFERENCES public.match_requests(id)
      ON DELETE SET NULL;
      
END $$;
