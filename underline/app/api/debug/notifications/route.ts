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

export async function GET(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch raw notifications
        const { data: notifications, error: notifError } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (notifError) {
            return NextResponse.json({ error: notifError }, { status: 500 });
        }

        // Fetch members for sender_ids
        const senderIds = Array.from(new Set(notifications.map((n: any) => n.sender_id).filter((id: any) => id !== null)));

        const { data: members, error: memberError } = await supabaseAdmin
            .from('member')
            .select('id, nickname, auth_id')
            .in('id', senderIds);

        return NextResponse.json({
            user_id: user.id,
            notifications,
            members,
            senderIds,
            memberError
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
