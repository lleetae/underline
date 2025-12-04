
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('Inspecting triggers for "payments" table...');
    const { data: paymentsTriggers, error: pError } = await supabase.rpc('debug_get_triggers', { t_name: 'payments' });

    if (pError) {
        console.error('Error fetching payments triggers:', pError);
    } else {
        console.table(paymentsTriggers);
    }

    console.log('Inspecting triggers for "match_requests" table...');
    const { data: matchTriggers, error: mError } = await supabase.rpc('debug_get_triggers', { t_name: 'match_requests' });

    if (mError) {
        console.error('Error fetching match_requests triggers:', mError);
    } else {
        console.table(matchTriggers);
    }
}

inspect();
