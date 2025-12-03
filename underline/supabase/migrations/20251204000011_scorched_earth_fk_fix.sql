-- Scorched Earth V4: The Final Fix for User Deletion
-- This script iterates through EVERY table in the public schema.
-- It finds ANY foreign key that references 'auth.users'.
-- It drops the constraint and recreates it with ON DELETE CASCADE.

DO $$
DECLARE
    r RECORD;
    fk_info RECORD;
    cmd TEXT;
BEGIN
    -- Loop through all foreign keys in the public schema that reference auth.users
    FOR fk_info IN 
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            kcu.column_name, 
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND ccu.table_schema = 'auth'
          AND ccu.table_name = 'users'
          AND ccu.column_name = 'id'
    LOOP
        -- Log what we found (if debug_logs table exists)
        BEGIN
            INSERT INTO public.debug_logs (message, details) 
            VALUES ('Found blocking FK', jsonb_build_object('table', fk_info.table_name, 'constraint', fk_info.constraint_name));
        EXCEPTION WHEN OTHERS THEN
            -- Ignore logging errors
            NULL;
        END;

        -- Construct the ALTER TABLE command to drop the constraint
        cmd := 'ALTER TABLE public.' || quote_ident(fk_info.table_name) || ' DROP CONSTRAINT ' || quote_ident(fk_info.constraint_name);
        EXECUTE cmd;

        -- Construct the ALTER TABLE command to re-add the constraint with ON DELETE CASCADE
        -- Note: We default to CASCADE for everything to ensure deletion works. 
        -- For 'member' table's 'auth_id', we might want SET NULL, but CASCADE is also acceptable (deleting user deletes profile).
        -- Actually, for 'member', we usually want to keep the record but nullify auth_id (soft delete).
        -- But the user is asking for "Withdrawal", which usually implies full deletion or anonymization.
        -- Given the error is "Database error deleting user", we prioritize unblocking the deletion.
        -- If the app logic handles soft delete separately (setting auth_id to null BEFORE deleteUser), then SET NULL is better.
        -- But if deleteUser is called directly, CASCADE is the surest way to avoid errors.
        
        -- Let's use SET NULL for 'member' table specifically, and CASCADE for everything else.
        IF fk_info.table_name = 'member' THEN
             cmd := 'ALTER TABLE public.' || quote_ident(fk_info.table_name) || 
                   ' ADD CONSTRAINT ' || quote_ident(fk_info.constraint_name) || 
                   ' FOREIGN KEY (' || quote_ident(fk_info.column_name) || ') ' || 
                   ' REFERENCES auth.users(id) ON DELETE SET NULL';
        ELSE
             cmd := 'ALTER TABLE public.' || quote_ident(fk_info.table_name) || 
                   ' ADD CONSTRAINT ' || quote_ident(fk_info.constraint_name) || 
                   ' FOREIGN KEY (' || quote_ident(fk_info.column_name) || ') ' || 
                   ' REFERENCES auth.users(id) ON DELETE CASCADE';
        END IF;
        
        EXECUTE cmd;
        
    END LOOP;
END $$;
