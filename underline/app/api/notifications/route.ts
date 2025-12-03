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
    // Force Vercel Deploy Trigger
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

        console.log(`Fetching notifications for Auth User ID: ${user.id}`);

        // 2. Parse query parameters
        const searchParams = request.nextUrl.searchParams;

        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const unreadOnly = searchParams.get('unread_only') === 'true';

        // 3. Build query
        // 3. Build query (Fetch ALL and paginate in memory to bypass potential DB range issues)
        let query = supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', user.id);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data: allData, error } = await query;

        let notificationsData = allData || [];

        // In-memory Sort
        notificationsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // In-memory Pagination
        const start = offset;
        const end = offset + limit;
        notificationsData = notificationsData.slice(start, end);

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        console.log(`Found ${notificationsData?.length || 0} raw notifications`);
        if (notificationsData?.length > 0) {
            console.log("First notification sample:", JSON.stringify(notificationsData[0], null, 2));
        }

        // Manually fetch sender details
        let notifications = [];
        if (notificationsData && notificationsData.length > 0) {
            try {
                // Filter out null AND undefined
                const senderIds = Array.from(new Set(notificationsData.map(n => n.sender_id).filter(id => id != null)));
                console.log(`Fetching details for sender IDs: ${senderIds.join(', ')}`);



                let sendersMap: Record<string, any> = {};
                if (senderIds.length > 0) {
                    const { data: senders, error: sendersError } = await supabaseAdmin
                        .from('member')
                        .select('id, nickname, photo_urls_blurred')
                        .in('id', senderIds);

                    if (sendersError) {
                        console.error("Error fetching senders:", sendersError);
                    }

                    if (!sendersError && senders) {
                        console.log(`Fetched ${senders.length} senders`);
                        sendersMap = senders.reduce((acc, sender) => {
                            acc[sender.id] = sender;
                            return acc;
                        }, {} as Record<string, any>);
                    }
                }

                notifications = notificationsData.map(n => {
                    // Robust lookup: try both raw value and string value
                    const senderId = n.sender_id;
                    let sender = senderId ? sendersMap[senderId] : null;

                    if (!sender && senderId) {
                        sender = sendersMap[String(senderId)];
                    }

                    if (!sender && senderId) {
                        console.warn(`Sender details not found for sender_id: ${senderId} (Type: ${typeof senderId})`);
                    }
                    return {
                        ...n,
                        sender
                    };
                });
            } catch (err) {
                console.error("Critical error processing sender details:", err);
                // Fallback: return notifications without sender details rather than failing
                notifications = notificationsData.map(n => ({ ...n, sender: null }));
            }
        }

        // 4. Get unread count
        const { count: unreadCount } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        // Fallback Debug Query (No range, no order)
        let fallbackCount = 0;
        if ((notificationsData?.length || 0) === 0) {
            const { count } = await supabaseAdmin
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            fallbackCount = count || 0;
        }

        return NextResponse.json({
            notifications: notifications || [],
            unreadCount: unreadCount || 0,
            hasMore: (notifications?.length || 0) === limit,
            debugInfo: {
                queriedUserId: user.id,
                userIdLength: user.id.length,
                rawCount: notificationsData?.length || 0,
                fallbackCount,
                hardcodedCheck: await (async () => {
                    const { count } = await supabaseAdmin
                        .from('notifications')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', 'de48de06-6b78-4ff6-af4d-b435ddd4af56');
                    return count;
                })(),
                memberCheck: await (async () => {
                    const { data } = await supabaseAdmin.from('member').select('id').eq('auth_id', user.id).single();
                    return !!data;
                })(),
                totalNotificationsCheck: await (async () => {
                    const { count } = await supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true });
                    return count;
                })(),
                latestNotificationsDump: await (async () => {
                    const { data } = await supabaseAdmin
                        .from('notifications')
                        .select('id, user_id, type, created_at')
                        .order('created_at', { ascending: false })
                        .limit(5);

                    // Add char code inspection to the dump
                    return data?.map((n: any) => ({
                        ...n,
                        user_id_codes: n.user_id?.split('').map((c: string) => c.charCodeAt(0)),
                        id_codes: n.id?.split('').map((c: string) => c.charCodeAt(0))
                    }));

                })(),
                specificRowInspection: await (async () => {
                    const targetId = '0457a739-cf2f-4c69-be6b-a9423c125561';

                    // Test 1: Select ONLY id with EQ filter
                    const { data: dataIdOnly, error: errorIdOnly } = await supabaseAdmin
                        .from('notifications')
                        .select('id')
                        .eq('id', targetId);

                    // Test 2: Select ALL with LIMIT 1 (No filter)
                    const { data: dataAllNoFilter, error: errorAllNoFilter } = await supabaseAdmin
                        .from('notifications')
                        .select('*')
                        .limit(1);

                    // Test 3: Select ALL with EQ filter (The original failing query)
                    const { data: dataAllEq, error: errorAllEq } = await supabaseAdmin
                        .from('notifications')
                        .select('*')
                        .eq('id', targetId);

                    return {
                        targetId,
                        test1_IdOnly_Eq: { count: dataIdOnly?.length, first: dataIdOnly?.[0], error: errorIdOnly },
                        test2_All_NoFilter: { count: dataAllNoFilter?.length, first: dataAllNoFilter?.[0], error: errorAllNoFilter },
                        test3_All_Eq: { count: dataAllEq?.length, first: dataAllEq?.[0], error: errorAllEq }
                    };
                })(),
                maskedUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
                envCheck: !!supabaseServiceKey,
                queryError: error,
                params: { limit, offset, unreadOnly }
            }
        });

    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
