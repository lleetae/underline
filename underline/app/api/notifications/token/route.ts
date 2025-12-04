import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Verify Session
        const authHeader = request.headers.get('Authorization');
        // If called from client, it might not have Authorization header if we didn't send it.
        // Wait, the fetch in NotificationPermissionRequest didn't send Authorization header?
        // It just sent body. 
        // We need to fix the frontend to send the session token if we want to verify it here.
        // OR we can use the cookie-based client if we can find where it is.
        // But since I can't find the cookie client, I will use the header approach and update frontend too.

        // Actually, let's check if the request has cookies. Next.js App Router handles cookies.
        // But without the helper, verifying cookies is hard.
        // Let's stick to the pattern in withdraw/route.ts which expects a Bearer token.
        // I need to update the frontend to send the token.

        // Wait, getting the session token in the client component (NotificationPermissionRequest) requires useSession or similar.
        // If I don't want to complicate the frontend, I can try to rely on cookies if I can initialize a client with cookies.
        // But I don't have the helper.

        // Alternative: Just assume the user is logged in if I can get the user from the request cookies using a standard library?
        // No, verifying the JWT is best.

        // Let's look at how other simple APIs do it. 
        // app/api/check-nickname/route.ts?

        // For now, I will implement the header check here, and then I MUST update the frontend to send the token.
        // But wait, NotificationPermissionRequest is a client component. I can use `supabase.auth.getSession()` to get the token.

        // Let's proceed with header verification here.

        if (!authHeader) {
            // Fallback: try to get from cookie? No, let's enforce header for security.
            // Actually, if I can't easily change frontend to send token right now (need to import supabase client there too),
            // maybe I should look for the cookie helper again.
            // It MUST be somewhere.
            // I'll search for "createServerClient" or "createBrowserClient".
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { token: fcmToken } = await request.json();

        const { error } = await supabaseAdmin
            .from("member")
            .update({ fcm_token: fcmToken })
            .eq("auth_id", user.id);
        // Wait, members.id is UUID? Yes.
        // But sometimes auth_id is used.
        // Let's check schema. members table usually has id as UUID and auth_id as UUID.
        // In `withdraw/route.ts`: `eq('auth_id', userId)` where userId is user.id.
        // So I should use `eq('auth_id', user.id)`.

        if (error) {
            console.error("Error saving FCM token:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
