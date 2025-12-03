require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchLogs() {
    const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching logs:', error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

fetchLogs();
