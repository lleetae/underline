
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMatchDelete() {
    console.log('Testing Match Deletion Cascade...');

    // 1. Create User
    const email = `test_match_del_${Date.now()}@example.com`;
    const { data: authData } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    });
    const userId = authData.user.id;

    // 2. Create Member
    const { data: member } = await supabase.from('member').insert({ auth_id: userId, nickname: 'MatchDelTest' }).select().single();

    // 3. Create Match Request
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
            amount: 500,
            status: 'test_match_del'
        })
        .select()
        .single();
    console.log(`Created Payment: ${payment.id}`);

    // 5. Delete Match Request
    console.log('Deleting Match Request...');
    await supabase.from('match_requests').delete().eq('id', matchReq.id);

    // 6. Check Payment
    const { data: checkPayment } = await supabase.from('payments').select('*').eq('id', payment.id).single();

    if (!checkPayment) {
        console.error('❌ FAILURE: Payment was DELETED when Match Request was deleted.');
    } else {
        console.log('✅ SUCCESS: Payment persisted.');
        console.log('Match ID in payment:', checkPayment.match_id); // Should be null
    }

    // Cleanup user
    await supabase.auth.admin.deleteUser(userId);
}

testMatchDelete();
