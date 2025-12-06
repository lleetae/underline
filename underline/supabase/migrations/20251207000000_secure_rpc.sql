-- CRITICAL SECURITY FIX
-- Revoke execution permission from public roles for the sensitive decryption function
-- This prevents clients (Anon/Authenticated) from calling this function directly.

REVOKE EXECUTE ON FUNCTION decrypt_kakao_id(text) FROM public;
REVOKE EXECUTE ON FUNCTION decrypt_kakao_id(text) FROM anon;
REVOKE EXECUTE ON FUNCTION decrypt_kakao_id(text) FROM authenticated;

-- Only allow service_role (Server-side Admin) to execute it
GRANT EXECUTE ON FUNCTION decrypt_kakao_id(text) TO service_role;
