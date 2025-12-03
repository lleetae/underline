-- Scorched Earth V5: The Final Fix (All Schemas)
-- This script iterates through EVERY table in ALL schemas (except system ones).
-- It finds ANY foreign key that references 'auth.users'.
-- It drops the constraint and recreates it with ON DELETE CASCADE.

DO $$
DECLARE
    r RECORD;
    fk_info RECORD;
    cmd TEXT;
BEGIN
    -- Loop through all foreign keys in ALL schemas that reference auth.users
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
          AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'auth') -- Exclude system schemas
          AND ccu.table_schema = 'auth'
          AND ccu.table_name = 'users'
          AND ccu.column_name = 'id'
    LOOP
        -- Log what we found
        BEGIN
            INSERT INTO public.debug_logs (message, details) 
            VALUES ('Fixing Global FK', jsonb_build_object('schema', fk_info.table_schema, 'table', fk_info.table_name, 'constraint', fk_info.constraint_name));
        EXCEPTION WHEN OTHERS THEN NULL; END;

        -- Drop the constraint
        cmd := 'ALTER TABLE ' || quote_ident(fk_info.table_schema) || '.' || quote_ident(fk_info.table_name) || ' DROP CONSTRAINT ' || quote_ident(fk_info.constraint_name);
        EXECUTE cmd;

        -- Re-add with CASCADE (or SET NULL for member/payments/notifications sender)
        IF fk_info.table_name = 'member' OR fk_info.table_name = 'payments' OR (fk_info.table_name = 'notifications' AND fk_info.column_name = 'sender_id') THEN
             cmd := 'ALTER TABLE ' || quote_ident(fk_info.table_schema) || '.' || quote_ident(fk_info.table_name) || 
                   ' ADD CONSTRAINT ' || quote_ident(fk_info.constraint_name) || 
                   ' FOREIGN KEY (' || quote_ident(fk_info.column_name) || ') ' || 
                   ' REFERENCES auth.users(id) ON DELETE SET NULL';
        ELSE
             cmd := 'ALTER TABLE ' || quote_ident(fk_info.table_schema) || '.' || quote_ident(fk_info.table_name) || 
                   ' ADD CONSTRAINT ' || quote_ident(fk_info.constraint_name) || 
                   ' FOREIGN KEY (' || quote_ident(fk_info.column_name) || ') ' || 
                   ' REFERENCES auth.users(id) ON DELETE CASCADE';
        END IF;
        
        EXECUTE cmd;
        
    END LOOP;
END $$;
