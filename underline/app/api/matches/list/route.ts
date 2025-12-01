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

        const userId = user.id;

        // 2. Fetch Member ID
        const { data: memberData, error: memberError } = await supabaseAdmin
            .from('member')
            .select('id')
            .eq('auth_id', userId)
            .single();

        if (memberError || !memberData) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        const memberId = memberData.id;

        // 3. Fetch Matches (Accepted Requests)
        // We fetch matches where the user is either sender or receiver
        const { data: matchesData, error: matchesError } = await supabaseAdmin
            .from('match_requests')
            .select(`
        id,
        sender_id,
        receiver_id,
        status,
        letter,
        created_at,
        sender_kakao_id,
        receiver_kakao_id,
        is_unlocked,
        sender:member!sender_id (id, nickname, age, birth_date, location, photo_url, photos, auth_id),
        receiver:member!receiver_id (id, nickname, age, birth_date, location, photo_url, photos, auth_id)
      `)
            .or(`sender_id.eq.${memberId},receiver_id.eq.${memberId}`)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false });

        if (matchesError) {
            console.error('Error fetching matches:', matchesError);
            return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
        }

        // 4. Format Data
        const formattedMatches = matchesData.map((match: any) => {
            const isSender = match.sender_id === memberId;
            const partner = isSender ? match.receiver : match.sender;
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

        return NextResponse.json({ matches: formattedMatches });

    } catch (error) {
        console.error('Matches API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
