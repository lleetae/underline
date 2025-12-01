const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPaymentStatus() {
    console.log('Checking match_requests...');
    const { data, error } = await supabase
        .from('match_requests')
        .select('id, sender_id, receiver_id, status, is_unlocked, payment_tid, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching match_requests:', error);
        return;
    }

    console.log('Recent Match Requests:');
    data.forEach(req => {
        console.log(`ID: ${req.id}, Status: ${req.status}, Unlocked: ${req.is_unlocked}, TID: ${req.payment_tid}`);
    });
}

checkPaymentStatus();
