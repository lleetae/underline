#!/bin/bash
source .env.local

echo "URL: $NEXT_PUBLIC_SUPABASE_URL"
# User ID from the debug info
USER_ID="de48de06-6b78-4ff6-af4d-b435ddd4af56"

curl -v -G \
  --data-urlencode "user_id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/notifications"
