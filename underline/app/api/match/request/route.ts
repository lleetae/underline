import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendPushNotification } from '../../../lib/notifications';

export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { receiverId, letter } = await request.json();

        if (!receiverId || !letter) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (letter.length > 500) {
            return NextResponse.json({ error: 'Letter too long (max 500 chars)' }, { status: 400 });
        }

        // Get sender's member id
        const { data: senderData, error: senderError } = await supabaseAdmin
            .from('member')
            .select('id, nickname')
            .eq('auth_id', user.id)
            .single();

        if (senderError || !senderData) {
            return NextResponse.json({ error: 'Sender profile not found' }, { status: 404 });
        }

        // Insert into match_requests table
        const { data: matchRequest, error: insertError } = await supabaseAdmin
            .from('match_requests')
            .insert({
                sender_id: senderData.id,
                receiver_id: receiverId,
                letter: letter,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting match request:', insertError);
            return NextResponse.json({ error: 'Failed to create match request' }, { status: 500 });
        }

        // Send Push Notification
        try {
            await sendPushNotification(
                receiverId,
                "새로운 매칭 신청",
                "새로운 매칭 신청이 도착했습니다!",
                `/mailbox` // Deep link to mailbox
            );
        } catch (notificationError) {
            console.error("Failed to send push notification:", notificationError);
            // Don't fail the request if notification fails
        }

        return NextResponse.json({ success: true, matchRequest });
    } catch (error) {
        console.error('Error processing match request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
