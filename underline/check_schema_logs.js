
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchemaAndLogs() {
    console.log('Checking "payments" columns...');
    const { data: cols, error: cError } = await supabase.rpc('debug_get_columns', { t_name: 'payments' });
    if (cError) console.error(cError);
    else console.table(cols);

    console.log('Checking Audit Logs (for any recent deletions)...');
    const { data: logs, error: lError } = await supabase.from('debug_audit_logs').select('*').order('created_at', { ascending: false });
    if (lError) console.error(lError);
    else {
        if (logs.length === 0) console.log('No deletion logs found yet.');
        else console.table(logs);
    }
}

checkSchemaAndLogs();
