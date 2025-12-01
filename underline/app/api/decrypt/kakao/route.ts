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

        const { encryptedId } = await request.json();

        if (!encryptedId) {
            return NextResponse.json({ error: 'Encrypted ID is required' }, { status: 400 });
        }

        // 2. Decrypt using RPC
        const { data, error } = await supabaseAdmin.rpc('decrypt_kakao_id', {
            encrypted_text: encryptedId
        });

        if (error) {
            console.error('Decryption error:', error);
            return NextResponse.json({ error: 'Decryption failed' }, { status: 500 });
        }

        return NextResponse.json({ decryptedId: data });

    } catch (error) {
        console.error('Decryption API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
