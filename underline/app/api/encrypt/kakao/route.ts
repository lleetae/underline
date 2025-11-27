import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Encrypt Kakao ID using Supabase RPC
 * This calls the database function created in supabase-security-setup.sql
 */
export async function POST(request: NextRequest) {
    try {
        const { kakaoId } = await request.json();

        if (!kakaoId) {
            return NextResponse.json(
                { error: 'Kakao ID is required' },
                { status: 400 }
            );
        }

        // Call Supabase RPC function to encrypt
        const { data, error } = await supabaseAdmin.rpc('encrypt_kakao_id', {
            kakao_id: kakaoId
        });

        if (error) {
            console.error('Encryption error:', error);
            return NextResponse.json(
                { error: '암호화 중 오류가 발생했습니다' },
                { status: 500 }
            );
        }

        return NextResponse.json({ encryptedId: data });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다' },
            { status: 500 }
        );
    }
}
