import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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
        // We can't easily use supabase.auth.getUser() with the service role client to verify the *request's* session cookie
        // without passing the cookie. 
        // A simpler way for this specific app context (where we trust the client to send the token if we were using RLS, 
        // but here we are bypassing RLS) is to check if the user is logged in via the standard client 
        // OR just trust the request if we assume the middleware handles auth?
        // But Next.js middleware might not be set up for this specific route.

        // Better approach: Receive the access token from the client header and verify it.
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
        const { path } = body;

        if (!path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        // 2. Generate Signed URL
        const { data, error } = await supabaseAdmin
            .storage
            .from('profile-photos-original')
            .createSignedUrl(path, 3600); // 1 hour expiry

        if (error) {
            console.error('Error creating signed URL:', error);
            return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
        }

        return NextResponse.json({ signedUrl: data.signedUrl });

    } catch (error) {
        console.error('Signed URL API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
