
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLatestApplication() {
    console.log('Checking latest dating applications...');

    const { data, error } = await supabase
        .from('dating_applications')
        .select(`
      id,
      member_id,
      status,
      created_at,
      member:member_id (nickname)
    `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching applications:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No applications found.');
        return;
    }

    console.log('Latest 5 Applications:');
    data.forEach(app => {
        console.log(`- ID: ${app.id}`);
        console.log(`  Member: ${app.member?.nickname || 'Unknown'} (${app.member_id})`);
        console.log(`  Status: ${app.status}`);
        console.log(`  Created At: ${app.created_at}`);

        const createdAt = new Date(app.created_at);
        const now = new Date();
        const isFuture = createdAt > now;
        console.log(`  Is Future Date? ${isFuture ? 'YES (Next Week Batch)' : 'NO (Current/Past Batch)'}`);
        console.log('---');
    });
}

checkLatestApplication();
