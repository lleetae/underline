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

        // 1.5 Manual Cascade: Delete dependent records to avoid FK blocking
        // Notifications
        await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
        await supabaseAdmin.from('notifications').delete().eq('sender_id', userId);

        // Payments
        await supabaseAdmin.from('payments').delete().eq('user_id', userId);

        // Matches
        await supabaseAdmin.from('matches').delete().eq('requester_id', userId);
        await supabaseAdmin.from('matches').delete().eq('receiver_id', userId);

        // Dating Applications
        // Try both column names just in case
        await supabaseAdmin.from('dating_applications').delete().eq('user_id', userId);
        // If auth_id exists in schema, it might be used
        // We can't easily check schema here, but we can try delete. 
        // If column doesn't exist, it throws error. We should wrap in try/catch or ignore.
        // Actually, supabase-js ignores invalid columns in filter? No, it throws.
        // Let's assume user_id based on previous migrations. 
        // But wait, nuclear_fk_fix_v3 checked for auth_id too.
        // Let's try to delete by auth_id if user_id delete didn't cover it?
        // Safe bet: The previous migrations ensured user_id or auth_id FKs are CASCADE.
        // So manual delete might not be strictly necessary if FKs are fixed.
        // But if FKs are NOT fixed (e.g. migration failed silently), this helps.

        // 4. Soft Delete Member Record
        if (member) {
            const randomSuffix = Math.random().toString(36).substring(2, 8); // Generate a random suffix for uniqueness
            const { error: updateMemberError } = await supabaseAdmin
                .from('member')
                .update({
                    nickname: '알수없음',
                    bio: '',
                    birth_date: '1900-01-01',
                    kakao_id: `deleted_${member.id}_${randomSuffix}`, // Ensure uniqueness
                    photo_urls_original: [],
                    photo_urls_blurred: [],
                    photos: [],
                    referrer_auth_id: null,
                    legacy_auth_id: member.auth_id, // Save the original UUID
                    auth_id: null, // Unlink to allow deletion (FK safe)
                    fcm_token: null // Clear push token
                })
                .eq('id', member.id);

            if (updateMemberError) {
                console.error("Error soft deleting member record:", updateMemberError);
                return NextResponse.json({ error: `Failed to soft delete member record: ${updateMemberError.message}` }, { status: 500 });
            }
        }

        // 2. Delete auth user via Debug RPC to get exact error
        const { data: deleteResult, error: rpcError } = await supabaseAdmin.rpc('debug_delete_user', { target_user_id: userId });

        if (rpcError) {
            console.error('RPC Error deleting user:', rpcError);
            throw new Error(`RPC Error: ${rpcError.message}`);
        }

        if (deleteResult && !deleteResult.success) {
            console.error('Database Error deleting user:', deleteResult);
            throw new Error(`Database Error: ${deleteResult.error} (State: ${deleteResult.detail})`);
        }

        /*
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) {
          console.error('Error deleting auth user:', deleteError);
          throw new Error(`Failed to delete auth user: ${deleteError.message}`);
        }
        */

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Withdrawal error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
