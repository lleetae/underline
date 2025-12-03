-- RPC to attempt user deletion and return detailed error
CREATE OR REPLACE FUNCTION debug_delete_user(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    BEGIN
        DELETE FROM auth.users WHERE id = target_user_id;
        result := jsonb_build_object('success', true);
    EXCEPTION WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE,
            'constraint', quote_ident(COALESCE(sqlerrm, 'unknown'))
        );
    END;
    
    RETURN result;
END;
$$;
