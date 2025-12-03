import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server-side Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Custom fetch to bypass Next.js cache
const customFetch = (url: any, options: any) => {
    return fetch(url, { ...options, cache: 'no-store' });
};

const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            fetch: customFetch
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

        const memberId = Number(memberData.id); // Ensure number type

        // Fetch matches where current user is sender OR receiver
        // NOTE: Split into two queries to avoid OR filter issues in production
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

        if (sentMatchesResult.error) {
            console.error("Error fetching sent matches:", sentMatchesResult.error);
        }
        if (receivedMatchesResult.error) {
            console.error("Error fetching received matches:", receivedMatchesResult.error);
        }

        const sentMatches = sentMatchesResult.data || [];
        const receivedMatches = receivedMatchesResult.data || [];

        // Combine and sort by created_at desc
        const matchesData = [...sentMatches, ...receivedMatches].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // 4. Batch Fetch Partner Data
        // Extract all unique partner IDs
        const partnerIds = [...new Set(matchesData.map((match: any) =>
            match.sender_id === memberId ? match.receiver_id : match.sender_id
        ))];

        let partnersMap = new Map();
        if (partnerIds.length > 0) {
            const { data: partnersData, error: partnersError } = await supabaseAdmin
                .from('member')
                .select('id, nickname, age, birth_date, sido, sigungu, photo_url, photos, auth_id')
                .in('id', partnerIds);

            if (partnersError) {
                console.error("Error fetching partners batch:", partnersError);
            } else {
                partnersData?.forEach(p => partnersMap.set(p.id, p));
            }
        }

        // 5. Format Data using fetched partners
        const formattedMatches = matchesData.map((match: any) => {
            const isSender = match.sender_id === memberId;
            const partnerId = isSender ? match.receiver_id : match.sender_id;

            const partner = partnersMap.get(partnerId);

            if (!partner) {
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
            const getLocationText = (p: any) => {
                if (p.sido && p.sigungu) {
                    return `${p.sido} ${p.sigungu}`;
                }
                const locationMap: { [key: string]: string } = {
                    seoul: "서울", busan: "부산", incheon: "인천", daegu: "대구",
                    daejeon: "대전", gwangju: "광주", other: "기타"
                };
                return locationMap[p.location] || p.location;
            };

            return {
                id: match.id,
                profileId: partner.id.toString(),
                userImage: photos[0] || "",
                nickname: isWithdrawn ? "알수없음 (탈퇴)" : partner.nickname,
                age: age,
                location: getLocationText(partner),
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

        return NextResponse.json({
            matches: validMatches,
            version: "v_batch_optimized_1"
        });

    } catch (error: any) {
        console.error('Matches API error:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error',
            version: "v_batch_optimized_1"
        }, { status: 500 });
    }
}
