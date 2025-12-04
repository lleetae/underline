import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from auth header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch notifications (without join first)
        console.log(`[API] Fetching notifications for user: ${user.id}`);
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        console.log(`[API] Raw notifications found: ${notifications?.length || 0}`);
        if (notifications && notifications.length > 0) {
            console.log('[API] First notification:', JSON.stringify(notifications[0], null, 2));
        }

        if (error) {
            console.error('[API] Error fetching notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        if (!notifications || notifications.length === 0) {
            return NextResponse.json({ notifications: [], unreadCount: 0 });
        }

        // 2. Collect unique sender_ids (which are auth_ids)
        const senderAuthIds = [...new Set(notifications
            .map(n => n.sender_id)
            .filter(id => id) // filter out nulls
        )];

        // 3. Fetch member details for these senders
        let senderMap = new Map();
        if (senderAuthIds.length > 0) {
            const { data: members, error: membersError } = await supabase
                .from('member')
                .select('id, nickname, photo_urls_blurred, auth_id')
                .in('auth_id', senderAuthIds);

            if (!membersError && members) {
                members.forEach(m => {
                    senderMap.set(m.auth_id, m);
                });
            }
        }

        // 4. Attach sender details to notifications
        const enrichedNotifications = notifications.map(n => ({
            ...n,
            sender: n.sender_id ? senderMap.get(n.sender_id) || null : null
        }));

        // Count unread
        const unreadCount = notifications.filter(n => !n.is_read).length;

        return NextResponse.json({
            notifications: enrichedNotifications,
            unreadCount
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
