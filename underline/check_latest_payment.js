
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFinalResult() {
    console.log('Checking latest payment...');

    // 1. Get the latest payment
    const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching payment:', error);
        return;
    }

    console.log('Latest Payment:', payment);
    console.log(`Payment ID: ${payment.id}`);

    const targetId = payment.id;

    console.log(`Checking Payment ${targetId}...`);

    // 2. Check if it exists (redundant but good for re-running)
    const { data: check, error: checkError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', targetId)
        .single();

    if (check) {
        console.log('✅ Payment SURVIVED! (Safety Net or Fix worked)');
        console.log('User ID:', check.user_id);
    } else {
        console.log('❌ Payment is GONE. (Safety Net FAILED)');
    }

    console.log('Checking Audit Logs...');
    const { data: logs } = await supabase
        .from('debug_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (logs && logs.length > 0) {
        console.table(logs.map(l => ({
            table: l.table_name,
            op: l.operation,
            time: l.created_at,
            id: l.old_data ? l.old_data.id : 'N/A'
        })));
    } else {
        console.log('No recent audit logs.');
    }
}

checkFinalResult();
