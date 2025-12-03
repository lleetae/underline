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

        // 1. Fetch by TYPE (Known to work based on previous logs)
        const { data: allByType, error: typeError } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('type', 'contact_revealed')
            .order('created_at', { ascending: false })
            .limit(20);

        // 2. Find the target row in-memory
        const targetRow = allByType?.find((n: any) => n.id === targetNotifId) ||
            allByType?.find((n: any) => n.user_id === targetUserId);

        // 3. Analyze the mismatch
        let analysis = "Target row not found in 'allByType' list.";
        if (targetRow) {
            const dbId = targetRow.user_id;
            const match = dbId === targetUserId;
            analysis = `Found Row! DB UserID: '${dbId}' vs Target: '${targetUserId}'. Strict Match: ${match}.`;

            if (!match) {
                analysis += `\nLengths: DB=${dbId.length}, Target=${targetUserId.length}`;
                const dbCodes = dbId.split('').map((c: string) => c.charCodeAt(0));
                const targetCodes = targetUserId.split('').map((c: string) => c.charCodeAt(0));
                analysis += `\nDB Codes: [${dbCodes.join(',')}]`;
                analysis += `\nTarget Codes: [${targetCodes.join(',')}]`;
            }
        }

        // 4. Test Query with Hardcoded ID (Again, to confirm failure)
        const { data: queryResult, error: queryError } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', targetUserId);

        return NextResponse.json({
            message: "ID Mismatch Analysis",
            targetUserId,
            foundInTypeQuery: !!targetRow,
            typeQueryError: typeError,
            analysis,
            queryTest: {
                count: queryResult?.length,
                firstItem: queryResult?.[0],
                error: queryError
            },
            allByType: allByType || []
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
