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
            .select('id, photo_urls_original, photo_urls_blurred, photos')
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

        // 4. Delete Data from Tables
        // Note: If you have ON DELETE CASCADE set up in your DB, deleting the member might suffice.
        // But to be safe and explicit, we delete related data first or rely on member deletion if cascaded.
        // Assuming 'member' table deletion cascades to 'member_books', 'dating_applications'.
        // 'match_requests' might need manual handling if not cascaded or if referenced by others.

        // Let's try deleting the member record directly. 
        // If there are foreign key constraints without cascade, this will fail, so we might need to delete children first.
        // Based on typical setups, let's attempt explicit deletion for safety.

        if (member) {
            // 4. Anonymize Member Data (Soft Delete)
            // We retain member_books, dating_applications, match_requests for behavioral data.
            // We anonymize PII in the member table.

            const randomSuffix = crypto.randomUUID().split('-')[0]; // Short random string

            const { error: updateError } = await supabaseAdmin
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
                    referrer_auth_id: null, // Clear referrer
                    // auth_id: null // KEEP auth_id to preserve history! (Migration 20251203000008 drops FK)
                })
                .eq('id', member.id);

            if (updateError) {
                console.error("Error anonymizing member record:", updateError);
                return NextResponse.json({ error: 'Failed to anonymize member record' }, { status: 500 });
            }
        }

        // 5. Delete Auth User
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteUserError) {
            console.error("Error deleting auth user:", deleteUserError);
            return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Withdrawal error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
