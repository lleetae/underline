
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFullScenario() {
    console.log('Testing Full Withdrawal Scenario...');

    // 1. Create User
    const email = `test_full_${Date.now()}@example.com`;
    const { data: authData } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    });
    const userId = authData.user.id;
    console.log(`Created User: ${userId}`);

    // 2. Create Member (Simulate app behavior)
    const { data: member } = await supabase.from('member').insert({ auth_id: userId, nickname: 'FullTest' }).select().single();
    console.log(`Created Member: ${member.id}`);

    // 3. Create Match Request (Self match)
    const { data: matchReq } = await supabase.from('match_requests').insert({
        sender_id: member.id,
        receiver_id: member.id,
        status: 'pending'
    }).select().single();
    console.log(`Created Match Request: ${matchReq.id}`);

    // 4. Create Payment
    const { data: payment } = await supabase
        .from('payments')
        .insert({
            user_id: userId,
            match_id: matchReq.id,
            amount: 9900,
            status: 'completed'
        })
        .select()
        .single();
    console.log(`Created Payment: ${payment.id}`);

    // 5. Simulate Withdrawal API Logic
    console.log('Simulating Withdrawal API...');

    // 5a. Soft Delete Member
    const { error: updateError } = await supabase
        .from('member')
        .update({
            auth_id: null,
            legacy_auth_id: userId,
            nickname: 'Unknown',
            gender: null,
            birth_year: null,
            introduction: null,
            mbti: null,
            height: null,
            religion: null,
            smoking: null,
            drinking: null,
            job: null,
            school: null,
            major: null,
            image_urls: [],
            ideal_type: null,
            interests: [],
            contact_kakao_id: null,
            contact_phone: null,
            is_profile_completed: false,
            is_onboarding_completed: false
        })
        .eq('auth_id', userId);

    if (updateError) console.error('Member update failed', updateError);
    else console.log('Member soft-deleted.');

    // 5b. Delete Auth User
    const { error: delError } = await supabase.auth.admin.deleteUser(userId);
    if (delError) console.error('Auth delete failed', delError);
    else console.log('Auth user deleted.');

    // 6. Verification
    console.log('Verifying...');

    // Check Payment
    const { data: checkPayment } = await supabase.from('payments').select('*').eq('id', payment.id).single();
    if (!checkPayment) {
        console.error('❌ FAILURE: Payment was DELETED.');
    } else {
        console.log('✅ SUCCESS: Payment persisted.');
        console.log('Payment User ID:', checkPayment.user_id); // Should be null
        console.log('Payment Match ID:', checkPayment.match_id); // Should be preserved
    }

    // Check Match Request
    const { data: checkMatch } = await supabase.from('match_requests').select('*').eq('id', matchReq.id).single();
    if (!checkMatch) {
        console.log('⚠️ Match Request was DELETED.');
    } else {
        console.log('✅ Match Request persisted.');
    }

    // Check Member
    const { data: checkMember } = await supabase.from('member').select('*').eq('id', member.id).single();
    if (!checkMember) {
        console.log('⚠️ Member was DELETED.');
    } else {
        console.log('✅ Member persisted (Soft Deleted).');
        console.log('Member Auth ID:', checkMember.auth_id); // Should be null
    }
}

testFullScenario();
