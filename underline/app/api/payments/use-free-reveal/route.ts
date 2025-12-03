import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { matchId } = await request.json();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get current user's member info
        const { data: member, error: memberError } = await supabase
            .from('member')
            .select('id, free_reveals_count')
            .eq('auth_id', session.user.id)
            .single();

        if (memberError || !member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        if ((member.free_reveals_count || 0) <= 0) {
            return NextResponse.json({ error: 'No free reveals available' }, { status: 400 });
        }

        // 2. Deduct free reveal count
        const { error: updateError } = await supabase
            .from('member')
            .update({ free_reveals_count: member.free_reveals_count - 1 })
            .eq('id', member.id);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update reveal count' }, { status: 500 });
        }

        // 3. Fetch match request details
        const { data: matchData, error: matchError } = await supabase
            .from('match_requests')
            .select('sender_id, receiver_id')
            .eq('id', matchId)
            .single();

        if (matchError || !matchData) {
            return NextResponse.json({ error: 'Match request not found' }, { status: 404 });
        }

        // 4. Update match request to unlocked
        const { error: matchUpdateError } = await supabase
            .from('match_requests')
            .update({
                is_unlocked: true,
                payment_tid: `free_${Date.now()}`
            })
            .eq('id', matchId);

        if (matchUpdateError) {
            return NextResponse.json({ error: 'Failed to unlock match' }, { status: 500 });
        }

        // 5. Insert into payments table
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                send_user_id: matchData.sender_id,
                receive_user_id: matchData.receiver_id,
                match_id: matchId,
                amount: 0,
                status: 'completed',
                payment_method: 'free_reveal',
                transaction_id: `free_${matchId}_${member.id}_${Date.now()}`,
                completed_at: new Date().toISOString()
            });

        if (paymentError) {
            console.error("Failed to record free payment:", paymentError);
            // We already unlocked and deducted, so maybe just log error.
        }

        // 6. Send notification (Contact Revealed)
        // Identify target (the other person)
        const targetUserId = matchData.sender_id === member.id ? matchData.receiver_id : matchData.sender_id;

        // Get target's auth_id for notification
        const { data: targetMember } = await supabase
            .from('member')
            .select('auth_id')
            .eq('id', targetUserId)
            .single();

        if (targetMember) {
            await supabase
                .from('notifications')
                .insert({
                    user_id: targetMember.auth_id,
                    type: 'contact_revealed',
                    match_id: matchId,
                    sender_id: member.id,
                    is_read: false,
                    metadata: {}
                });
        }

        return NextResponse.json({ success: true, remaining: member.free_reveals_count - 1 });

    } catch (error) {
        console.error('Error processing free reveal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
