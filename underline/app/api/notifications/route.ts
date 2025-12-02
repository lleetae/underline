import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
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

export async function GET(request: NextRequest) {
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

        // 2. Parse query parameters
        const searchParams = request.nextUrl.searchParams;

        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const unreadOnly = searchParams.get('unread_only') === 'true';

        // 3. Build query
        let query = supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data: notificationsData, error } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        // Manually fetch sender details
        let notifications = [];
        if (notificationsData && notificationsData.length > 0) {
            const senderIds = Array.from(new Set(notificationsData.map(n => n.sender_id).filter(id => id !== null)));

            let sendersMap: Record<string, any> = {};
            if (senderIds.length > 0) {
                const { data: senders, error: sendersError } = await supabaseAdmin
                    .from('member')
                    .select('id, nickname, photo_urls_blurred')
                    .in('id', senderIds);

                if (!sendersError && senders) {
                    sendersMap = senders.reduce((acc, sender) => {
                        acc[sender.id] = sender;
                        return acc;
                    }, {} as Record<string, any>);
                }
            }

            notifications = notificationsData.map(n => ({
                ...n,
                sender: n.sender_id ? sendersMap[n.sender_id] : null
            }));
        }

        // 4. Get unread count
        const { count: unreadCount } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        return NextResponse.json({
            notifications: notifications || [],
            unreadCount: unreadCount || 0,
            hasMore: (notifications?.length || 0) === limit
        });

    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
