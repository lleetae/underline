
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function reproduceStrict() {
    console.log('Reproducing Strict Scenario...');

    // 1. Create User
    const email = `strict_test_${Date.now()}@example.com`;
    const { data: authData } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    });
    const userId = authData.user.id;
    console.log(`Created User: ${userId}`);

    // 2. Create Member
    const { data: member } = await supabase.from('member').insert({
        auth_id: userId,
        nickname: 'StrictTest',
        // Add other fields to match user's likely state if needed
    }).select().single();
    console.log(`Created Member: ${member.id}`);

    // 3. Create Match Request
    const { data: matchReq } = await supabase.from('match_requests').insert({
        sender_id: member.id,
        receiver_id: member.id, // Self match
        status: 'accepted' // Maybe accepted?
    }).select().single();
    console.log(`Created Match Request: ${matchReq.id}`);

    // 4. Create Payment (Exact match to user's data)
    const { data: payment } = await supabase
        .from('payments')
        .insert({
            user_id: userId,
            match_id: matchReq.id,
            amount: 19900,
            status: 'completed', // CRITICAL
            payment_method: 'card'
        })
        .select()
        .single();
    console.log(`Created Payment: ${payment.id}`);

    // 5. Simulate Withdrawal API (Exact Logic)
    console.log('Simulating Withdrawal...');

    // 5a. Soft Delete Member
    await supabase
        .from('member')
        .update({
            nickname: '알수없음',
            auth_id: null,
            legacy_auth_id: userId
        })
        .eq('auth_id', userId);
    console.log('Member soft-deleted.');

    // 5b. Delete Auth User
    await supabase.auth.admin.deleteUser(userId);
    console.log('Auth user deleted.');

    // 6. Verify
    const { data: checkPayment } = await supabase.from('payments').select('*').eq('id', payment.id).single();

    if (!checkPayment) {
        console.error('❌ FAILURE: Payment was DELETED.');
    } else {
        console.log('✅ SUCCESS: Payment persisted.');
        console.log('User ID:', checkPayment.user_id);
    }
}

reproduceStrict();
