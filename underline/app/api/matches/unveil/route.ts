import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Server-side Supabase client
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

/**
 * Unveil photos after match acceptance
 * POST /api/matches/unveil
 * 
 * Returns signed URLs for original photos of both matched users
 */
export async function POST(request: NextRequest) {
    try {


        const { matchId, requestingUserId } = await request.json();

        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (!matchId || !requestingUserId) {
            return NextResponse.json(
                { error: 'Match ID and User ID required' },
                { status: 400 }
            );
        }

        // 1. Verify match exists and is accepted
        const { data: match, error: matchError } = await supabaseAdmin
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .eq('status', 'accepted')
            .single();

        if (matchError || !match) {
            return NextResponse.json(
                { error: 'Match not found or not accepted' },
                { status: 404 }
            );
        }

        // 2. Verify requesting user is part of this match
        if (match.requester_id !== requestingUserId && match.receiver_id !== requestingUserId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // 3. Get both users' photo paths
        const { data: requesterProfile } = await supabaseAdmin
            .from('member')
            .select('photos')
            .eq('id', match.requester_id)
            .single();

        const { data: receiverProfile } = await supabaseAdmin
            .from('member')
            .select('photos')
            .eq('id', match.receiver_id)
            .single();

        if (!requesterProfile || !receiverProfile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            );
        }

        // 4. Generate signed URLs for original photos (100 years expiry - effectively unlimited)
        const expiresIn = 60 * 60 * 24 * 365 * 100; // 100 years

        // For requester
        const requesterPaths = (requesterProfile.photos || []).map((url: string) => {
            // Extract filename from blurred URL and convert to original filename
            const filename = url.split('/').pop()?.replace('blurred_', '') || '';
            return filename;
        });

        const { data: requesterSignedUrls, error: requesterSignedError } =
            await supabaseAdmin
                .storage
                .from('profile-photos-original')
                .createSignedUrls(requesterPaths, expiresIn);

        // For receiver
        const receiverPaths = (receiverProfile.photos || []).map((url: string) => {
            const filename = url.split('/').pop()?.replace('blurred_', '') || '';
            return filename;
        });

        const { data: receiverSignedUrls, error: receiverSignedError } =
            await supabaseAdmin
                .storage
                .from('profile-photos-original')
                .createSignedUrls(receiverPaths, expiresIn);

        if (requesterSignedError || receiverSignedError) {
            console.error('Signed URL error:', requesterSignedError || receiverSignedError);
            return NextResponse.json(
                { error: 'Failed to generate photo URLs' },
                { status: 500 }
            );
        }

        // 5. Return signed URLs
        return NextResponse.json({
            success: true,
            requesterPhotos: requesterSignedUrls?.map(item => item.signedUrl) || [],
            receiverPhotos: receiverSignedUrls?.map(item => item.signedUrl) || [],
            expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
        });

    } catch (error) {
        console.error('Unveil error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
