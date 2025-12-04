
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUserRegion() {
    // 1. Get the latest applicant
    const { data: apps } = await supabase
        .from('dating_applications')
        .select('member_id')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!apps || apps.length === 0) {
        console.log("No applications found.");
        return;
    }

    const memberId = apps[0].member_id;
    console.log(`Checking Member ID: ${memberId}`);

    // 2. Get Member Region
    const { data: member } = await supabase
        .from('member')
        .select('sido, sigungu, nickname')
        .eq('id', memberId)
        .single();

    if (!member) {
        console.log("Member not found.");
        return;
    }

    console.log(`Member: ${member.nickname}`);
    console.log(`Region: ${member.sido} ${member.sigungu}`);

    // 3. Get Region Stats
    const { data: stats } = await supabase
        .from('region_stats')
        .select('*')
        .eq('sido', member.sido)
        .eq('sigungu', member.sigungu)
        .single();

    if (!stats) {
        console.log("No stats found for this region (Implies Closed/Empty).");
    } else {
        console.log("Region Stats:");
        console.log(`- Male Count: ${stats.male_count}`);
        console.log(`- Female Count: ${stats.female_count}`);

        const isClosed = stats.male_count < 1 || stats.female_count < 1;
        console.log(`Is Region Closed? ${isClosed ? 'YES' : 'NO'}`);
    }
}

checkUserRegion();
