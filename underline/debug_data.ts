
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role if available for bypass RLS

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

// Use service role key if possible to bypass RLS, otherwise anon key
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function debugData() {
    console.log('--- Debugging Data ---');

    // 1. Fetch all members
    const { data: members, error: memberError } = await supabase
        .from('member')
        .select('id, nickname, gender, sido, sigungu, auth_id, member_books(id)');

    if (memberError) {
        console.error('Error fetching members:', memberError);
        return;
    }

    console.log(`Total Members: ${members.length}`);
    members.forEach(m => {
        console.log(`Member: ${m.nickname} (${m.gender}) - ${m.sido} ${m.sigungu} [ID: ${m.id}]`);
    });

    // 2. Fetch active dating applications
    const { data: apps, error: appError } = await supabase
        .from('dating_applications')
        .select('id, member_id, status, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (appError) {
        console.error('Error fetching applications:', appError);
        return;
    }

    console.log(`\nTotal Active Applications: ${apps.length}`);
    apps.forEach(a => {
        const member = members.find(m => m.id === a.member_id);
        console.log(`App: Member ${member?.nickname} (${member?.gender}) - Created: ${a.created_at}`);
    });

    // 3. Check for potential matches
    // Group by Sido Group
    const REGION_GROUPS: Record<string, string[]> = {
        metropolitan: ["서울특별시", "인천광역시", "경기도"],
        chungcheong: ["대전광역시", "충청북도", "충청남도", "세종특별자치시"],
        gangwon: ["강원특별자치도"],
        gyeongbuk: ["경상북도", "대구광역시"],
        gyeongnam: ["경상남도", "울산광역시", "부산광역시"],
        jeonbuk: ["전북특별자치도"],
        jeonnam: ["전라남도", "광주광역시"],
        jeju: ["제주특별자치도"]
    };

    const getGroup = (sido: string) => {
        for (const [key, sidos] of Object.entries(REGION_GROUPS)) {
            if (sidos.includes(sido)) return key;
        }
        return 'other';
    };

    const appsWithMember = apps.map(a => {
        const member = members.find(m => m.id === a.member_id);
        return { ...a, member, group: member ? getGroup(member.sido) : 'unknown' };
    });

    console.log('\n--- Potential Matches by Group ---');
    const groups = ['metropolitan'];

    groups.forEach(group => {
        const groupApps = appsWithMember.filter(a => a.group === group);
        const males = groupApps.filter(a => a.member?.gender === 'male');
        const females = groupApps.filter(a => a.member?.gender === 'female');

        console.log(`Group: ${group}`);
        console.log(`  Males: ${males.length}`);
        males.forEach(m => console.log(`    - ${m.member?.nickname} (ID: ${m.member?.id}, Sido: '${m.member?.sido}', AuthID: ${m.member?.auth_id}, Books: ${m.member?.member_books?.length || 0})`));
        console.log(`  Females: ${females.length}`);
        females.forEach(f => console.log(`    - ${f.member?.nickname} (ID: ${f.member?.id}, Sido: '${f.member?.sido}', AuthID: ${f.member?.auth_id}, Books: ${f.member?.member_books?.length || 0})`));
    });

    // FIX: Restore AuthID for user 152 if missing
    const { error: updateError } = await supabase
        .from('member')
        .update({ auth_id: 'de48de06-6b78-4ff6-af4d-b435ddd4af56' }) // Use previous known ID or new one
        .eq('id', 152)
        .is('auth_id', null);

    if (updateError) {
        console.error("Error updating user 152:", updateError);
    } else {
        console.log("Attempted to restore AuthID for user 152 (if it was null).");
    }

    // Check matches for user 163
    const { data: matches, error: matchError } = await supabase
        .from('match_requests')
        .select('*')
        .or(`sender_id.eq.163,receiver_id.eq.163`);

    if (matchError) {
        console.error("Error fetching matches:", matchError);
    } else {
        console.log("\n--- Matches for User 163 ---");
        matches.forEach(m => {
            console.log(`Match ID: ${m.id}, Sender: ${m.sender_id}, Receiver: ${m.receiver_id}, Status: '${m.status}'`);
        });
    }
}

debugData();
