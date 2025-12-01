import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        const { notificationId, markAllAsRead } = body;

        if (markAllAsRead) {
            // Mark all notifications as read
            const { error } = await supabaseAdmin
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) {
                console.error('Error marking all as read:', error);
                return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: 'All notifications marked as read' });
        }

        if (!notificationId) {
            return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
        }

        // Mark single notification as read
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', user.id); // Ensure user owns this notification

        if (error) {
            console.error('Error marking notification as read:', error);
            return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Mark as read API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
