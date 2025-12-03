-- Fix payments_match_id_fkey to allow match_requests deletion
-- The error "update or delete on table match_requests violates foreign key constraint payments_match_id_fkey on table payments"
-- indicates that this FK is currently RESTRICT or NO ACTION. We need it to be SET NULL.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Drop the specific constraint causing the error
    FOR r IN SELECT constraint_name 
             FROM information_schema.table_constraints 
             WHERE table_name = 'payments' 
             AND constraint_name = 'payments_match_id_fkey'
    LOOP
        EXECUTE 'ALTER TABLE public.payments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    
    -- 2. Also drop any other FK on match_id just in case
    FOR r IN SELECT constraint_name 
             FROM information_schema.table_constraints 
             WHERE table_name = 'payments' AND constraint_type = 'FOREIGN KEY'
             AND constraint_name LIKE '%match_id%'
             AND constraint_name != 'payments_match_id_fkey' -- Already handled
    LOOP
        EXECUTE 'ALTER TABLE public.payments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 3. Recreate with ON DELETE SET NULL
ALTER TABLE public.payments
  ADD CONSTRAINT payments_match_id_fkey
  FOREIGN KEY (match_id)
  REFERENCES public.match_requests(id)
  ON DELETE SET NULL;
