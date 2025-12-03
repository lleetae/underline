import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function GET() {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Config error' });

    const { data, error } = await supabaseAdmin
        .from('member')
        .select('id')
        .limit(1)
        .single();

    return NextResponse.json({
        type: typeof data?.id,
        value: data?.id,
        isUuid: typeof data?.id === 'string' && data?.id.includes('-'),
        error
    });
}
