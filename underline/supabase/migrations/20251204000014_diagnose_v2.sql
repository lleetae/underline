-- Diagnostic V2: Triggers, Schemas, and Constraints
-- Clearing logs first
DELETE FROM public.debug_logs;

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. List all Schemas
    FOR r IN SELECT schema_name FROM information_schema.schemata
    LOOP
        INSERT INTO public.debug_logs (message, details) VALUES ('Schema Found', jsonb_build_object('name', r.schema_name));
    END LOOP;

    -- 2. List Triggers on auth.users (if visible)
    FOR r IN 
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_schema = 'auth' AND event_object_table = 'users'
    LOOP
        INSERT INTO public.debug_logs (message, details) 
        VALUES ('Trigger on auth.users', jsonb_build_object('name', r.trigger_name, 'event', r.event_manipulation));
    END LOOP;

    -- 3. Check member table constraints specifically
    FOR r IN 
        SELECT conname, contype, confdeltype
        FROM pg_constraint
        WHERE conrelid = 'public.member'::regclass
    LOOP
        INSERT INTO public.debug_logs (message, details) 
        VALUES ('Constraint on member', jsonb_build_object('name', r.conname, 'type', r.contype, 'delete_action', r.confdeltype));
    END LOOP;

    -- 4. Check for any other table referencing auth.users in ANY schema
    FOR r IN 
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_schema = 'auth'
          AND ccu.table_name = 'users'
    LOOP
         INSERT INTO public.debug_logs (message, details) 
         VALUES ('Global FK Reference', jsonb_build_object('schema', r.table_schema, 'table', r.table_name, 'constraint', r.constraint_name));
    END LOOP;

END $$;
