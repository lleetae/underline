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

export async function GET(request: NextRequest) {
    try {
        const startTime = Date.now();
        console.log('[API] Request started');

        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 1. Verify Authentication
        const authStart = Date.now();
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        console.log(`[API] Auth check took: ${Date.now() - authStart}ms`);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get member_id from member table
        const memberStart = Date.now();
        const { data: memberData, error: memberError } = await supabaseAdmin
            .from('member')
            .select('id')
            .eq('auth_id', user.id)
            .single();
        console.log(`[API] Member lookup took: ${Date.now() - memberStart}ms`);

        if (memberError || !memberData) {
            console.error("Member not found for user:", user.id);
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        const memberId = Number(memberData.id); // Ensure number type
        console.log(`[API] Fetching matches for memberId: ${memberId} (Type: ${typeof memberId})`);
        console.log(`[API] Service Key Prefix: ${supabaseServiceKey?.substring(0, 5)}...`);

        // DEBUG: Check specific match for member 63
        const match63Id = '9aaf2960-4293-4a7f-84cd-4d5dd1298a50';
        const { data: match63 } = await supabaseAdmin
            .from('match_requests')
            .select('*')
            .eq('id', match63Id)
            .single();
        console.log(`[API] DEBUG Match 63 Check (${match63Id}):`, match63 ? "Found" : "Not Found", match63);

        // DEBUG: Check count without status filter
        const { count: totalSent } = await supabaseAdmin
            .from('match_requests')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', memberId);
        console.log(`[API] DEBUG Total Sent (no status filter): ${totalSent}`);

        // DEBUG: Specific check for the exact match ID user provided
        const targetMatchId = 'c5abba53-14e9-4f0f-b340-6a380cf7e106';
        const { data: exactMatch } = await supabaseAdmin
            .from('match_requests')
            .select('*')
            .eq('id', targetMatchId)
            .single();
        console.log(`[API] DEBUG Exact Match Check (${targetMatchId}):`, exactMatch ? "Found" : "Not Found");

        // DEBUG: Specific check for 52 <-> 57
        if (memberId === 52 || memberId === 57) {
            const partnerId = memberId === 52 ? 57 : 52;
            const { data: specificMatch, error: specificError } = await supabaseAdmin
                .from('match_requests')
                .select('*')
                .or(`and(sender_id.eq.${memberId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${memberId})`);

            if (specificError) {
                console.error(`[API] DEBUG 52-57 check error:`, specificError);
            }
            console.log(`[API] DEBUG 52-57 check: Found ${specificMatch?.length} records.`, specificMatch);
        }

        // Fetch matches where current user is sender OR receiver
        // NOTE: Split into two queries to avoid OR filter issues in production
        const queryStart = Date.now();
        console.log(`[API] Querying sent matches for sender_id=${memberId}...`);
        console.log(`[API] Querying received matches for receiver_id=${memberId}...`);

        const [sentMatchesResult, receivedMatchesResult] = await Promise.all([
            supabaseAdmin
                .from('match_requests')
                .select('*')
                .eq('sender_id', memberId)
                .eq('status', 'accepted'),
            supabaseAdmin
                .from('match_requests')
                .select('*')
                .eq('receiver_id', memberId)
                .eq('status', 'accepted')
        ]);
        console.log(`[API] Match queries took: ${Date.now() - queryStart}ms`);

        if (sentMatchesResult.error) {
            console.error("Error fetching sent matches:", sentMatchesResult.error);
        }
        if (receivedMatchesResult.error) {
            console.error("Error fetching received matches:", receivedMatchesResult.error);
        }

        const sentMatches = sentMatchesResult.data || [];
        const receivedMatches = receivedMatchesResult.data || [];

        console.log(`[API] Sent matches found: ${sentMatches.length}`);
        console.log(`[API] Received matches found: ${receivedMatches.length}`);

        // Combine and sort by created_at desc
        const matchesData = [...sentMatches, ...receivedMatches].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        console.log(`[API] Raw matches found (accepted): ${matchesData?.length}`);

        // 4. Batch Fetch Partner Data
        const partnerStart = Date.now();
        // Extract all unique partner IDs
        const partnerIds = [...new Set(matchesData.map((match: any) =>
            match.sender_id === memberId ? match.receiver_id : match.sender_id
        ))];

        let partnersMap = new Map();
        if (partnerIds.length > 0) {
            const { data: partnersData, error: partnersError } = await supabaseAdmin
                .from('member')
                .select('id, nickname, age, birth_date, location, photo_url, photos, auth_id')
                .in('id', partnerIds);

            if (partnersError) {
                console.error("Error fetching partners batch:", partnersError);
            } else {
                partnersData?.forEach(p => partnersMap.set(p.id, p));
            }
        }
        console.log(`[API] Partner batch fetch took: ${Date.now() - partnerStart}ms`);

        // 5. Format Data using fetched partners
        const formattedMatches = matchesData.map((match: any) => {
            const isSender = match.sender_id === memberId;
            const partnerId = isSender ? match.receiver_id : match.sender_id;

            const partner = partnersMap.get(partnerId);

            if (!partner) {
                console.error(`[API] SKIP match ${match.id}: Partner ${partnerId} not found in batch.`);
                return null; // Skip this match if partner not found
            }

            const isWithdrawn = partner.auth_id === null;
            const partnerKakaoId = isSender ? match.receiver_kakao_id : match.sender_kakao_id;

            // Helper to get original photo URL
            const getOriginalPhotoUrl = (url: string) => {
                if (!url) return "";
                if (url.includes("profile-photos-blurred")) {
                    return url.replace("profile-photos-blurred", "profile-photos-original").replace("blurred_", "");
                }
                return url;
            };

            // Handle photos
            let photos = partner.photos && partner.photos.length > 0
                ? partner.photos
                : (partner.photo_url ? [partner.photo_url] : []);

            // Transform to original URLs for matches
            photos = photos.map((p: string) => getOriginalPhotoUrl(p));

            // Handle age
            const age = partner.age || (partner.birth_date
                ? new Date().getFullYear() - parseInt(partner.birth_date.substring(0, 4))
                : 0);

            // Helper for location
            const getLocationText = (location: string) => {
                const locationMap: { [key: string]: string } = {
                    seoul: "서울", busan: "부산", incheon: "인천", daegu: "대구",
                    daejeon: "대전", gwangju: "광주", other: "기타"
                };
                return locationMap[location] || location;
            };

            return {
                id: match.id,
                profileId: partner.id.toString(),
                userImage: photos[0] || "",
                nickname: isWithdrawn ? "알수없음 (탈퇴)" : partner.nickname,
                age: age,
                location: getLocationText(partner.location),
                bookTitle: match.letter ? (match.letter.length > 20 ? match.letter.substring(0, 20) + "..." : match.letter) : "매칭된 책",
                isUnlocked: match.is_unlocked || false,
                contactId: "kakao_id_placeholder",
                isBlurred: false,
                isWithdrawn: isWithdrawn,
                partnerKakaoId: partnerKakaoId
            };
        });

        // Filter out nulls (failed fetches)
        const validMatches = formattedMatches.filter(m => m !== null);

        const totalTime = Date.now() - startTime;
        console.log(`[API] Total execution time: ${totalTime}ms`);

        return NextResponse.json({
            matches: validMatches,
            version: "v_perf_debug_1",
            debug: {
                totalTime,
                authTime: Date.now() - authStart, // approximate
                queryTime: Date.now() - queryStart // approximate
            }
        });

    } catch (error: any) {
        console.error('Matches API error:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error',
            version: "v_perf_debug_1"
        }, { status: 500 });
    }
}
