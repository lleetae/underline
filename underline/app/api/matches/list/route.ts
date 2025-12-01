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
        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 1. Verify Authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }



        // Get member_id from member table
        const { data: memberData, error: memberError } = await supabaseAdmin
            .from('member')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (memberError || !memberData) {
            console.error("Member not found for user:", user.id);
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        const memberId = memberData.id;
        console.log(`[API] Fetching matches for memberId: ${memberId}`);

        // DEBUG: Specific check for 52 <-> 57
        if (memberId === 52 || memberId === 57) {
            const partnerId = memberId === 52 ? 57 : 52;
            const { data: specificMatch, error: specificError } = await supabaseAdmin
                .from('match_requests')
                .select('*')
                .or(`and(sender_id.eq.${memberId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${memberId})`);
            console.log(`[API] DEBUG 52-57 check: Found ${specificMatch?.length} records.`, specificMatch);
        }

        // Fetch matches where current user is sender OR receiver
        // NOTE: We are avoiding JOINs here because they were causing issues even when data existed.
        const { data: matchesData, error: matchesError } = await supabaseAdmin
            .from('match_requests')
            .select(`
                id, sender_id, receiver_id, status, letter, created_at,
                sender_kakao_id, receiver_kakao_id, is_unlocked
            `)
            .or(`sender_id.eq.${memberId},receiver_id.eq.${memberId}`)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false });

        if (matchesError) {
            console.error("Error fetching matches:", matchesError);
            return NextResponse.json({ error: matchesError.message }, { status: 500 });
        }

        console.log(`[API] Raw matches found (accepted): ${matchesData?.length}`);

        // 4. Format Data with Manual Member Fetching
        const formattedMatches = await Promise.all(matchesData.map(async (match: any) => {
            const isSender = match.sender_id === memberId;
            const partnerId = isSender ? match.receiver_id : match.sender_id;

            // Fetch partner data manually
            const { data: partner, error: partnerError } = await supabaseAdmin
                .from('member')
                .select('id, nickname, age, birth_date, location, photo_url, photos, auth_id')
                .eq('id', partnerId)
                .single();

            if (partnerError || !partner) {
                console.error(`Failed to fetch partner ${partnerId} for match ${match.id}`);
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
        }));

        // Filter out nulls (failed fetches)
        const validMatches = formattedMatches.filter(m => m !== null);

        return NextResponse.json({ matches: validMatches });

    } catch (error) {
        console.error('Matches API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
