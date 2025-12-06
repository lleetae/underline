import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
    try {
        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const { matchId } = await request.json();

        // 1. Verify Authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = supabaseAdmin; // Use admin client for operations

        // 1. Get current user's member info
        const { data: member, error: memberError } = await supabase
            .from('member')
            .select('id, free_reveals_count')
            .eq('auth_id', user.id)
            .single();

        if (memberError || !member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        if ((member.free_reveals_count || 0) <= 0) {
            return NextResponse.json({ error: 'No free reveals available' }, { status: 400 });
        }

        // 3. Fetch match request details AND Verify Ownership
        const { data: matchData, error: matchError } = await supabase
            .from('match_requests')
            .select('sender_id, receiver_id, is_unlocked')
            .eq('id', matchId)
            .single();

        if (matchError || !matchData) {
            return NextResponse.json({ error: 'Match request not found' }, { status: 404 });
        }

        // Verify user is part of the match
        if (matchData.sender_id !== member.id && matchData.receiver_id !== member.id) {
            return NextResponse.json({ error: 'Unauthorized: You are not part of this match' }, { status: 403 });
        }

        // Verify not already unlocked
        if (matchData.is_unlocked) {
            return NextResponse.json({ error: 'Match is already unlocked' }, { status: 400 });
        }

        // 2. Deduct free reveal count (Now safe to deduct)
        const { error: updateError } = await supabase
            .from('member')
            .update({ free_reveals_count: member.free_reveals_count - 1 })
            .eq('id', member.id);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update reveal count' }, { status: 500 });
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
                user_id: user.id, // Use auth UUID
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
