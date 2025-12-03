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

        // Fetch last 10 contact_revealed notifications
        const { data: notifications, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('type', 'contact_revealed')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            return NextResponse.json({ error }, { status: 500 });
        }

        // Also fetch the current user to compare
        const authHeader = request.headers.get('Authorization');
        let currentUser = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            currentUser = user;
        }

        return NextResponse.json({
            message: "Last 10 contact_revealed notifications",
            currentUser: currentUser ? { id: currentUser.id, email: currentUser.email } : "No Auth Token Provided",
            notifications
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
