import { adminMessaging } from './firebase-admin';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, supabaseServiceKey);
}


export async function sendPushNotification(userId: string, title: string, body: string, link?: string) {
    try {
        const supabase = getSupabaseAdmin();

        // Get user's FCM token
        // userId passed here is likely the UUID from the members table (id) or auth_id?
        // In the app, we usually pass member.id (UUID).
        // Let's assume userId is member.id.
        const { data: user, error } = await supabase
            .from('member')
            .select('fcm_token')
            .eq('id', userId)
            .single();

        if (error || !user || !user.fcm_token) {
            console.log(`No FCM token found for user ${userId}`);
            return;
        }

        const message = {
            notification: {
                title,
                body,
            },
            data: {
                url: link || '/',
            },
            token: user.fcm_token,
        };

        if (!adminMessaging) {
            console.warn('Firebase Admin Messaging not initialized. Skipping notification.');
            return;
        }

        const response = await adminMessaging.send(message);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error: any) {
        console.error('Error sending message:', error);

        // Check for invalid token error codes
        if (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-argument') {
            console.log(`Removing invalid FCM token for user ${userId}`);
            const supabase = getSupabaseAdmin();
            await supabase
                .from('member')
                .update({ fcm_token: null })
                .eq('id', userId);
        }
    }
}
