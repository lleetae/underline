
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    const { data, error } = await supabase
        .from('member')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching member:', error);
    } else {
        console.log('Member columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data found');
        if (data && data.length > 0) {
            console.log('Sample data:', data[0]);
        }
    }
}

inspectSchema();
