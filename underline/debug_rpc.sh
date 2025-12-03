#!/bin/bash
source .env.local

echo "Calling RPC debug_count_user_notifs..."
USER_ID="de48de06-6b78-4ff6-af4d-b435ddd4af56"

curl -v -X POST \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"target_user_id\": \"$USER_ID\"}" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/debug_count_user_notifs"
