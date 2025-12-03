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

        // 4. Delete Member Record (Explicitly)
        // We delete the member record first. Since payments table has ON DELETE SET NULL (from migration 007),
        // payment records will be preserved but send_user_id/receive_user_id will become NULL.
        // This is the "pre-soft-delete" behavior the user requested to rollback to.
        if (member) {
            const { error: deleteMemberError } = await supabaseAdmin
                .from('member')
                .delete()
                .eq('id', member.id);

            if (deleteMemberError) {
                console.error("Error deleting member record:", deleteMemberError);
                // Continue to try deleting auth user, or return error?
                // If member deletion fails (e.g. other FKs), auth deletion might also fail or leave orphan data.
                // But let's log and proceed or return.
                return NextResponse.json({ error: `Failed to delete member record: ${deleteMemberError.message}` }, { status: 500 });
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
