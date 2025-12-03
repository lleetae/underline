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

        // 1. Verify Session
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = user.id;

        // 2. Fetch Member Data (to get photos)
        const { data: member, error: memberError } = await supabaseAdmin
            .from('member')
            .select('id, auth_id, photo_urls_original, photo_urls_blurred, photos')
            .eq('auth_id', userId)
            .single();

        if (memberError && memberError.code !== 'PGRST116') { // Ignore if not found (already deleted?)
            console.error("Error fetching member:", memberError);
        }

        // 3. Delete Photos from Storage
        if (member) {
            const originalPhotos = member.photo_urls_original || [];
            const blurredPhotos = member.photo_urls_blurred || member.photos || [];

            // Helper to extract path from URL
            const getPathFromUrl = (url: string, bucket: string) => {
                try {
                    const urlObj = new URL(url);
                    const pathParts = urlObj.pathname.split(`/${bucket}/`);
                    return pathParts.length > 1 ? pathParts[1] : null;
                } catch (e) {
                    return null;
                }
            };

            const originalPaths = originalPhotos.map((url: string) => getPathFromUrl(url, 'profile-photos-original')).filter(Boolean);
            const blurredPaths = blurredPhotos.map((url: string) => getPathFromUrl(url, 'profile-photos-blurred')).filter(Boolean);

            if (originalPaths.length > 0) {
                await supabaseAdmin.storage.from('profile-photos-original').remove(originalPaths);
            }
            if (blurredPaths.length > 0) {
                await supabaseAdmin.storage.from('profile-photos-blurred').remove(blurredPaths);
            }
        }

        // 4. Soft Delete Member Record
        if (member) {
            const randomSuffix = Math.random().toString(36).substring(2, 8); // Generate a random suffix for uniqueness
            const { error: updateMemberError } = await supabaseAdmin
                .from('member')
                .update({
                    nickname: '알수없음',
                    bio: '',
                    location: 'unknown',
                    birth_date: '1900-01-01',
                    kakao_id: `deleted_${member.id}_${randomSuffix}`, // Ensure uniqueness
                    photo_urls_original: [],
                    photo_urls_blurred: [],
                    photos: [],
                    referrer_auth_id: null,
                    legacy_auth_id: member.auth_id, // Save the original UUID
                    auth_id: null // Unlink to allow deletion (FK safe)
                })
                .eq('id', member.id);

            if (updateMemberError) {
                console.error("Error soft deleting member record:", updateMemberError);
                return NextResponse.json({ error: `Failed to soft delete member record: ${updateMemberError.message}` }, { status: 500 });
            }
        }

        // 5. Delete Auth User
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteUserError) {
            console.error("Error deleting auth user:", deleteUserError);
            return NextResponse.json({ error: `Failed to delete auth user: ${deleteUserError.message}` }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Withdrawal error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
