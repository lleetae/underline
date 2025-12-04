
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('Inspecting constraints for "payments" table...');
    const { data: paymentsConstraints, error: pError } = await supabase.rpc('debug_get_constraints', { t_name: 'payments' });

    if (pError) {
        console.error('Error fetching payments constraints:', pError);
    } else {
        console.table(paymentsConstraints);
    }

    console.log('Inspecting constraints for "member" table...');
    const { data: memberConstraints, error: memError } = await supabase.rpc('debug_get_constraints', { t_name: 'member' });

    if (memError) {
        console.error('Error fetching member constraints:', memError);
    } else {
        console.table(memberConstraints);
    }

    console.log('Inspecting constraints for "match_requests" table...');
    const { data: matchConstraints, error: mError } = await supabase.rpc('debug_get_constraints', { t_name: 'match_requests' });

    if (mError) {
        console.error('Error fetching match_requests constraints:', mError);
    } else {
        console.table(matchConstraints);
    }
}

inspect();
