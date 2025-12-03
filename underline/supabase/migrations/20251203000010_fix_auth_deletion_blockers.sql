-- Fix Auth User Deletion Blockers (Catch-All)
-- This migration finds ALL foreign keys referencing auth.users and fixes them.

DO $$
DECLARE
    r RECORD;
    sql_cmd TEXT;
BEGIN
    -- Loop through all FKs referencing auth.users
    FOR r IN 
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            kcu.column_name, 
            tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'users' 
          AND ccu.table_schema = 'auth'
    LOOP
        -- Logic based on table name
        IF r.table_name = 'member' THEN
            -- For member table: DROP the FK to allow soft delete (keep ID string)
            sql_cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                       ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
            RAISE NOTICE 'Dropping FK on member: %', sql_cmd;
            EXECUTE sql_cmd;

        ELSIF r.table_name = 'payments' THEN
            -- For payments table: Set to ON DELETE SET NULL to preserve history
            -- First drop, then recreate
            sql_cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                       ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
            EXECUTE sql_cmd;
            
            sql_cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                       ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) || 
                       ' FOREIGN KEY (' || quote_ident(r.column_name) || ') ' || 
                       ' REFERENCES auth.users(id) ON DELETE SET NULL';
            RAISE NOTICE 'Setting FK on payments to SET NULL: %', sql_cmd;
            EXECUTE sql_cmd;

        ELSE
            -- For all other tables (matches, notifications, etc.): Set to ON DELETE CASCADE
            -- This ensures the user can be deleted and related cleanup happens
            sql_cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                       ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
            EXECUTE sql_cmd;
            
            sql_cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                       ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) || 
                       ' FOREIGN KEY (' || quote_ident(r.column_name) || ') ' || 
                       ' REFERENCES auth.users(id) ON DELETE CASCADE';
            RAISE NOTICE 'Setting FK on % to CASCADE: %', r.table_name, sql_cmd;
            EXECUTE sql_cmd;
        END IF;
    END LOOP;
END $$;
