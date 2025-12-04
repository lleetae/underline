
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectAuth() {
    console.log('Inspecting triggers for "auth.users" table...');
    const { data, error } = await supabase.rpc('debug_get_auth_triggers');

    if (error) {
        console.error('Error fetching auth triggers:', error);
    } else {
        console.table(data);
    }
}

inspectAuth();
