import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

export async function GET() {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Hardcoded target for debugging based on user logs
        const targetUserId = '6831764f-40ab-4e67-ad41-43f717f526df';
        const targetNotifId = '1dc1d2c8-6cda-4ac8-9166-5dc59665358f';

        // 1. Check Table Schema (Skipping RPC as it might be complex, just fetching one row)
        const { data: sampleRow, error: schemaError } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .limit(1);

        // 2. Fetch specific notification by ID
        const { data: specificNotif, error: specificError } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('id', targetNotifId)
            .single();

        // 3. Test Query with Hardcoded ID
        const { data: queryResult, error: queryError } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', targetUserId);

        // 4. Strict Comparison
        let comparison = "Not performed";
        if (specificNotif) {
            const dbUserId = specificNotif.user_id;
            const isMatch = dbUserId === targetUserId;
            comparison = `DB UserID: '${dbUserId}' vs Target: '${targetUserId}'. Match: ${isMatch}. Lengths: ${dbUserId?.length} vs ${targetUserId.length}`;

            // Check for hidden characters
            if (!isMatch && dbUserId) {
                const dbCodes = dbUserId.split('').map((c: string) => c.charCodeAt(0));
                const targetCodes = targetUserId.split('').map((c: string) => c.charCodeAt(0));
                comparison += `\nCodes: DB=[${dbCodes.join(',')}], Target=[${targetCodes.join(',')}]`;
            }
        }

        return NextResponse.json({
            message: "Deep Inspection Results",
            targetUserId,
            targetNotifId,
            specificNotification: {
                found: !!specificNotif,
                data: specificNotif,
                error: specificError
            },
            queryTest: {
                count: queryResult?.length,
                firstItem: queryResult?.[0],
                error: queryError
            },
            comparison
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
