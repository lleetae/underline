
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(request: NextRequest) {
    try {
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

        const body = await request.json();
        const { type, targetUserId, targetMemberId, matchId } = body;

        if (!type || !['match_request', 'match_accepted', 'contact_revealed'].includes(type)) {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        if ((!targetUserId && !targetMemberId) || !matchId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let recipientId = targetUserId;

        // If targetMemberId is provided, look up the auth_id (UUID)
        if (targetMemberId && !recipientId) {
            const { data: memberData, error: memberError } = await supabaseAdmin
                .from('member')
                .select('auth_id')
                .eq('id', targetMemberId)
                .single();

            if (memberError || !memberData) {
                console.error('Error finding member for notification:', memberError);
                return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
            }
            recipientId = memberData.auth_id;
        }

        // 2. Create notification
        const { data: notification, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: recipientId, // The user receiving the notification
                type: type,
                match_id: matchId,
                sender_id: user.id, // The user triggering the notification (current user)
                is_read: false,
                metadata: {}
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            notification
        });

    } catch (error) {
        console.error('Create notification API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
