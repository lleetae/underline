import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/app/lib/notifications';

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get member id from auth_id
        const { data: member, error: memberError } = await supabaseAdmin
            .from('member')
            .select('id, fcm_token')
            .eq('auth_id', user.id)
            .single();

        if (memberError || !member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        if (!member.fcm_token) {
            return NextResponse.json({ error: 'No FCM token found for this user. Please refresh the page to save the token.' }, { status: 400 });
        }

        console.log(`Sending test notification to member ${member.id} (FCM: ${member.fcm_token})`);

        const response = await sendPushNotification(
            member.id,
            "테스트 알림",
            "이것은 테스트 푸시 알림입니다!",
            "/"
        );

        return NextResponse.json({ success: true, response });
    } catch (error: any) {
        console.error("Error sending test notification:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
