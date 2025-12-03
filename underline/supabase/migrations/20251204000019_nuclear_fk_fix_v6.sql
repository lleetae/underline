-- Nuclear Option V6: The Ultimate Fix for Withdrawal Error
-- This script iterates through ALL tables in the 'public' schema.
-- It finds ANY foreign key that references 'auth.users'.
-- It drops the constraint and recreates it with ON DELETE CASCADE (or SET NULL for specific cases).

DO $$
DECLARE
    r RECORD;
    cmd TEXT;
BEGIN
    -- Loop through all foreign keys in 'public' schema that reference auth.users
    FOR r IN 
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
          AND tc.table_schema = 'public' -- Only check public schema
          AND ccu.table_schema = 'auth'
          AND ccu.table_name = 'users'
          AND ccu.column_name = 'id'
    LOOP
        -- Drop the constraint
        cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        EXECUTE cmd;

        -- Re-add with CASCADE or SET NULL
        -- Special cases for SET NULL
        IF r.table_name = 'member' AND r.column_name = 'auth_id' THEN
             cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                   ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) || 
                   ' FOREIGN KEY (' || quote_ident(r.column_name) || ') ' || 
                   ' REFERENCES auth.users(id) ON DELETE SET NULL';
                   
        ELSIF r.table_name = 'notifications' AND r.column_name = 'sender_id' THEN
             cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                   ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) || 
                   ' FOREIGN KEY (' || quote_ident(r.column_name) || ') ' || 
                   ' REFERENCES auth.users(id) ON DELETE SET NULL';

        ELSIF r.table_name = 'payments' AND r.column_name = 'user_id' THEN
             cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                   ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) || 
                   ' FOREIGN KEY (' || quote_ident(r.column_name) || ') ' || 
                   ' REFERENCES auth.users(id) ON DELETE SET NULL';
                   
        ELSIF r.table_name = 'payment_history' AND r.column_name = 'user_id' THEN
             cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                   ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) || 
                   ' FOREIGN KEY (' || quote_ident(r.column_name) || ') ' || 
                   ' REFERENCES auth.users(id) ON DELETE SET NULL';

        ELSE
             -- Default to CASCADE for everything else (matches, dating_applications, member_books, etc.)
             cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                   ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) || 
                   ' FOREIGN KEY (' || quote_ident(r.column_name) || ') ' || 
                   ' REFERENCES auth.users(id) ON DELETE CASCADE';
        END IF;
        
        EXECUTE cmd;
        
    END LOOP;
END $$;
