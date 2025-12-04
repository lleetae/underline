
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecific() {
    console.log('Checking specific records...');

    // 1. Check the missing payment and its match
    const missingPaymentId = '8dd1b10c-a9b1-492a-b709-a62a73f57cbc';
    const missingMatchId = 'ffb155d4-0bab-4519-a55d-914fc5c8798d';

    const { data: missingPay } = await supabase.from('payments').select('*').eq('id', missingPaymentId).single();
    if (missingPay) console.log(`❓ Payment ${missingPaymentId} actually EXISTS!`);
    else console.log(`❌ Payment ${missingPaymentId} is indeed GONE.`);

    const { data: missingMatch } = await supabase.from('match_requests').select('*').eq('id', missingMatchId).single();
    if (missingMatch) console.log(`✅ Match Request ${missingMatchId} EXISTS.`);
    else console.log(`❌ Match Request ${missingMatchId} is ALSO GONE.`);

    // Check withdrawn member
    const withdrawnAuthId = 'f7efc23a-5034-414c-a9be-7fd6e49d6f0a';

    // Try to find by legacy_auth_id (if soft deleted correctly)
    const { data: softDeletedMember } = await supabase.from('member').select('*').eq('legacy_auth_id', withdrawnAuthId).single();

    if (softDeletedMember) {
        console.log(`✅ Withdrawn Member (Legacy ID: ${withdrawnAuthId}) EXISTS. ID: ${softDeletedMember.id}`);
    } else {
        console.log(`❌ Withdrawn Member (Legacy ID: ${withdrawnAuthId}) NOT FOUND via legacy_auth_id.`);

        // Try to find by auth_id (if NOT deleted)
        const { data: activeMember } = await supabase.from('member').select('*').eq('auth_id', withdrawnAuthId).single();
        if (activeMember) {
            console.log(`⚠️ Member still has active auth_id! ID: ${activeMember.id}`);
        } else {
            console.log(`❌ Member with auth_id ${withdrawnAuthId} is GONE.`);
        }
    }

    // Check member by nickname
    const nickname = 'ㅁㅅㅂㅊㅁㅅ';
    const { data: member } = await supabase.from('member').select('*').eq('nickname', nickname).single();
    if (member) {
        console.log(`✅ Member '${nickname}' EXISTS. ID: ${member.id}, AuthID: ${member.auth_id}`);
    } else {
        console.log(`❌ Member '${nickname}' is GONE.`);
    }

}

checkSpecific();
