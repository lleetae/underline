-- Diagnostic V3: Log ALL Triggers in Public Schema
DELETE FROM public.debug_logs;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            event_object_table,
            trigger_name, 
            event_manipulation, 
            action_statement
        FROM information_schema.triggers
        WHERE event_object_schema IN ('public', 'storage')
    LOOP
        INSERT INTO public.debug_logs (message, details) 
        VALUES ('Public Trigger Found', jsonb_build_object(
            'table', r.event_object_table,
            'trigger', r.trigger_name, 
            'event', r.event_manipulation
        ));
    END LOOP;
END $$;
