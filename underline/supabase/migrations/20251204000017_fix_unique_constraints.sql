-- Fix Unique Constraints to allow multiple NULLs
-- If member.auth_id is UNIQUE, and we have multiple soft-deleted members (auth_id=NULL),
-- a standard UNIQUE constraint *should* allow it, but a partial index is safer and guarantees it.

DO $$
BEGIN
    -- 1. Fix member table
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'member_auth_id_key') THEN
        ALTER TABLE public.member DROP CONSTRAINT member_auth_id_key;
    END IF;
    
    -- Drop index if it exists (constraint creates an index)
    DROP INDEX IF EXISTS member_auth_id_key;
    
    -- Create Partial Unique Index
    CREATE UNIQUE INDEX member_auth_id_key ON public.member(auth_id) WHERE auth_id IS NOT NULL;


    -- 2. Fix dating_applications table (if it has auth_id unique constraint)
    -- We need to check if auth_id exists first
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_applications' AND column_name = 'auth_id') THEN
        
        -- Check for unique constraint (name might vary, so we look for any unique constraint on auth_id)
        -- Actually, let's just try to drop known names or generic approach.
        -- Assuming 'dating_applications_auth_id_key'
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dating_applications_auth_id_key') THEN
            ALTER TABLE public.dating_applications DROP CONSTRAINT dating_applications_auth_id_key;
        END IF;
        
        DROP INDEX IF EXISTS dating_applications_auth_id_key;
        
        CREATE UNIQUE INDEX IF NOT EXISTS dating_applications_auth_id_key ON public.dating_applications(auth_id) WHERE auth_id IS NOT NULL;
    END IF;

END $$;
