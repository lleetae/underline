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

/**
 * Test endpoint to create sample notifications
 * DO NOT USE IN PRODUCTION
 */
export async function POST(request: NextRequest) {
    try {
        // Only allow in development
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
        }

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
        const { type } = body;

        if (!type || !['match_request', 'match_accepted', 'contact_revealed'].includes(type)) {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        // Get a random member to use as sender (excluding current user)
        const { data: randomMember } = await supabaseAdmin
            .from('member')
            .select('id, nickname')
            .neq('id', user.id)
            .limit(1)
            .single();

        // Create a test match
        const { data: testMatch } = await supabaseAdmin
            .from('matches')
            .insert({
                requester_id: user.id,
                receiver_id: user.id,
                status: type === 'match_accepted' ? 'accepted' : 'pending'
            })
            .select()
            .single();

        // Create test notification
        const { data: notification, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: user.id,
                type: type,
                match_id: testMatch?.id,
                sender_id: randomMember?.id || null,
                is_read: false,
                metadata: {
                    test: true,
                    created_by: 'test_endpoint'
                }
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating test notification:', error);
            return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            notification,
            message: `Test ${type} notification created!`
        });

    } catch (error) {
        console.error('Test notification API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
