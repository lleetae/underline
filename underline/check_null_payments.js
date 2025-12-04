
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNullPayments() {
    console.log('Checking for payments with NULL user_id...');

    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching payments:', error);
    } else {
        console.log(`Found ${data.length} payments with NULL user_id.`);
        console.table(data.map(p => ({
            id: p.id,
            amount: p.amount,
            created_at: p.created_at,
            match_id: p.match_id
        })));
    }
}

checkNullPayments();
