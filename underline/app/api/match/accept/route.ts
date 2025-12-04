import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '../../../lib/notifications';

export const dynamic = 'force-dynamic';

// Server-side Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

export async function POST(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 1. Verify Session
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { requestId } = await request.json();



        if (!requestId) {
            return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
        }

        // 2. Fetch Match Request to verify ownership and get IDs
        const { data: matchRequest, error: matchError } = await supabaseAdmin
            .from('match_requests')
            .select('id, sender_id, receiver_id, status')
            .eq('id', requestId)
            .single();

        if (matchError || !matchRequest) {
            return NextResponse.json({ error: 'Match request not found' }, { status: 404 });
        }

        console.log(`Match Accept Request: ${requestId}`);
        console.log(`Match Request Data: Sender=${matchRequest.sender_id} (Type: ${typeof matchRequest.sender_id}), Receiver=${matchRequest.receiver_id} (Type: ${typeof matchRequest.receiver_id})`);

        // Verify that the current user is the receiver (only receiver can accept)
        // First get member id of current user
        const { data: currentMember, error: memberError } = await supabaseAdmin
            .from('member')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (memberError || !currentMember) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        console.log(`Current Member (Acceptor): ${currentMember.id} (Type: ${typeof currentMember.id})`);

        if (matchRequest.receiver_id !== currentMember.id) {
            return NextResponse.json({ error: 'Not authorized to accept this request' }, { status: 403 });
        }

        if (matchRequest.status !== 'pending') {
            return NextResponse.json({ error: 'Request is not pending' }, { status: 400 });
        }

        // 3. Fetch Kakao IDs for both parties
        const { data: sender, error: senderError } = await supabaseAdmin
            .from('member')
            .select('kakao_id')
            .eq('id', matchRequest.sender_id)
            .single();

        const { data: receiver, error: receiverError } = await supabaseAdmin
            .from('member')
            .select('kakao_id')
            .eq('id', matchRequest.receiver_id)
            .single();

        if (senderError || receiverError) {
            console.error("Error fetching kakao IDs:", senderError, receiverError);
            // Proceed even if error? No, we need the IDs.
            return NextResponse.json({ error: 'Failed to fetch contact info' }, { status: 500 });
        }

        // 4. Update Match Request with Status and Snapshots
        const { data: updatedMatch, error: updateError } = await supabaseAdmin
            .from('match_requests')
            .update({
                status: 'accepted',
                sender_kakao_id: sender?.kakao_id || null,
                receiver_kakao_id: receiver?.kakao_id || null
            })
            .eq('id', requestId)
            .select()
            .single();

        if (updateError) {
            console.error("Error updating match request:", updateError);
            return NextResponse.json({ error: 'Failed to accept match' }, { status: 500 });
        }

        // 5. Send Notification to the Sender of the request
        try {
            await sendPushNotification(
                matchRequest.sender_id,
                "매칭 성사!",
                "상대방이 매칭을 수락했습니다. 지금 연락처를 확인해보세요!",
                "/mailbox?tab=matched"
            );
        } catch (notificationError) {
            console.error("Failed to send push notification:", notificationError);
        }

        return NextResponse.json({ success: true, match: updatedMatch });

    } catch (error) {
        console.error("Match accept error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
