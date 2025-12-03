-- Drop Foreign Key on member.auth_id to allow keeping the ID string even if auth.users record is deleted
-- This supports "Soft Delete" where we anonymize the member record but keep the ID for history.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find and drop the FK constraint on auth_id
    FOR r IN SELECT constraint_name 
             FROM information_schema.table_constraints 
             WHERE table_name = 'member' AND constraint_type = 'FOREIGN KEY' 
             AND constraint_name LIKE '%auth_id%' -- Usually member_auth_id_fkey
    LOOP
        EXECUTE 'ALTER TABLE public.member DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Optional: Add an index on auth_id if it was relying on the FK index (though FK doesn't imply index in PG, it's good practice)
CREATE INDEX IF NOT EXISTS idx_member_auth_id ON public.member(auth_id);
