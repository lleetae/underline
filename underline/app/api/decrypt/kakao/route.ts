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

        // 2. Authorization Check (CRITICAL SECURITY FIX)
        // Ensure the requesting user is allowed to see this contact.
        // Logic: Find the member with this encrypted ID, then check if there is an unlocked match between them.

        const { data: targetMember, error: memberError } = await supabaseAdmin
            .from('member')
            .select('id')
            .eq('kakao_id', encryptedId)
            .single();

        if (memberError || !targetMember) {
            // If we can't find the member, we can't authorize. 
            // Don't reveal member existence error if possible, but distinct from decryption error.
            return NextResponse.json({ error: 'Invalid ID' }, { status: 404 });
        }

        const targetMemberId = targetMember.id;

        // Find if they have a match request record
        // Current user must be sender OR receiver, and target must be the OTHER one.
        // AND is_unlocked must be true.
        const { data: matchReq, error: matchError } = await supabaseAdmin
            .from('match_requests')
            .select('id, is_unlocked')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetMemberId}),and(sender_id.eq.${targetMemberId},receiver_id.eq.${user.id})`)
            .eq('is_unlocked', true)
            .maybeSingle();

        if (matchError) {
            console.error("Error checking match authorization:", matchError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!matchReq) {
            // Unauthorized: No unlocked match found between these two users
            console.warn(`User ${user.id} attempted to decrypt ID of ${targetMemberId} without unlocked match.`);
            return NextResponse.json({ error: 'Forbidden: You do not have permission to view this contact.' }, { status: 403 });
        }

        // 3. Decrypt using RPC
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
