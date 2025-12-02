import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const { matchRequestId, payerMemberId } = await request.json();

        console.log(`TEST: Processing payment notification. MatchId: ${matchRequestId}, PayerId: ${payerMemberId}`);

        if (!matchRequestId || !payerMemberId) {
            return NextResponse.json({ error: 'Missing params' }, { status: 400 });
        }

        // Fetch match request to find sender and receiver
        const { data: matchRequest, error: matchError } = await supabaseAdmin
            .from('match_requests')
            .select('sender_id, receiver_id')
            .eq('id', matchRequestId)
            .single();

        if (matchError || !matchRequest) {
            console.error("TEST: Error fetching match request:", matchError);
            return NextResponse.json({ error: 'Match request not found' }, { status: 404 });
        }

        console.log(`TEST: Match Request found: sender=${matchRequest.sender_id}, receiver=${matchRequest.receiver_id}`);

        // Determine target user (the one who did NOT pay)
        const targetMemberId = matchRequest.sender_id === payerMemberId
            ? matchRequest.receiver_id
            : matchRequest.sender_id;

        console.log(`TEST: Target Member ID: ${targetMemberId}`);

        // Get target user's auth_id
        const { data: targetMember, error: targetError } = await supabaseAdmin
            .from('member')
            .select('auth_id')
            .eq('id', targetMemberId)
            .single();

        if (targetError || !targetMember) {
            console.error("TEST: Error fetching target member auth_id:", targetError);
            return NextResponse.json({ error: 'Target member not found' }, { status: 404 });
        }

        console.log(`TEST: Target Member Auth ID: ${targetMember.auth_id}`);

        // Insert notification
        console.log(`TEST: Inserting notification: user_id=${targetMember.auth_id}, sender_id=${payerMemberId}`);
        const { data: notification, error: insertError } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: targetMember.auth_id,
                type: 'contact_revealed',
                match_id: matchRequestId,
                sender_id: payerMemberId,
                is_read: false,
                metadata: {}
            })
            .select()
            .single();

        if (insertError) {
            console.error("TEST: Error inserting notification:", insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        console.log(`TEST: Notification sent successfully:`, notification);
        return NextResponse.json({ success: true, notification });

    } catch (error: any) {
        console.error("TEST: Internal error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
