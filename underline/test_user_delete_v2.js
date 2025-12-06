
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserDelete() {
    console.log('Testing User Deletion Cascade...');

    // 1. Create User
    const email = `test_user_del_${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true
    });
    if (authError) return console.error('Auth create failed', authError);
    const userId = authData.user.id;
    console.log(`Created User: ${userId}`);

    // 2. Create Payment directly linked to this user
    // We need a match_id, let's just pick any existing one or create a dummy one if possible.
    // To avoid match_id cascade issues interfering, let's try to create a payment with match_id = NULL if allowed, 
    // or create a dummy match that we DO NOT delete.

    // Create a dummy member for match
    const { data: member } = await supabase.from('member').insert({ auth_id: userId, nickname: 'UserDelTest' }).select().single();

    // Create a dummy match
    const { data: matchReq } = await supabase.from('match_requests').insert({
        sender_id: member.id,
        receiver_id: member.id, // self match for simplicity
        status: 'pending'
    }).select().single();

    const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
            user_id: userId,
            match_id: matchReq.id,
            amount: 19900,
            status: 'test_user_del'
        })
        .select()
        .single();

    if (paymentError) return console.error('Payment create failed', paymentError);
    console.log(`Created Payment: ${payment.id}`);

    // 3. Delete Auth User ONLY
    console.log('Deleting Auth User...');
    const { error: delError } = await supabase.auth.admin.deleteUser(userId);
    if (delError) console.error('Delete user failed', delError);

    // 4. Check Payment
    const { data: checkPayment } = await supabase.from('payments').select('*').eq('id', payment.id).single();

    if (!checkPayment) {
        console.error('❌ FAILURE: Payment was DELETED when User was deleted.');
    } else {
        console.log('✅ SUCCESS: Payment persisted.');
        console.log('User ID in payment:', checkPayment.user_id); // Should be null
    }
}

testUserDelete();
