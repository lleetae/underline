
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectReverse() {
    console.log('Inspecting tables referencing "payments"...');
    const { data, error } = await supabase.rpc('debug_get_referencing_constraints', { target_table: 'payments' });

    if (error) {
        console.error('Error fetching referencing constraints:', error);
    } else {
        console.table(data);
    }
}

inspectReverse();
