-- Diagnostic: Log ALL Foreign Keys referencing auth.users
-- This will help us find the hidden blocker.

DO $$
DECLARE
    fk_info RECORD;
BEGIN
    -- Clear old logs
    DELETE FROM public.debug_logs;

    -- Find all FKs referencing auth.users in ANY schema
    FOR fk_info IN 
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name,
            rc.delete_rule
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.referential_constraints AS rc
              ON tc.constraint_name = rc.constraint_name
              AND tc.constraint_schema = rc.constraint_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_schema = 'auth'
          AND ccu.table_name = 'users'
    LOOP
        -- Log it
        INSERT INTO public.debug_logs (message, details) 
        VALUES (
            'FK Reference Found', 
            jsonb_build_object(
                'schema', fk_info.table_schema,
                'table', fk_info.table_name, 
                'constraint', fk_info.constraint_name,
                'delete_rule', fk_info.delete_rule
            )
        );
    END LOOP;
END $$;
