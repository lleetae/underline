const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

// Use service role key if possible to bypass RLS, otherwise anon key
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function debugData() {
    console.log('--- Debugging Data ---');

    // Check matches for user 163
    const { data: matches, error: matchError } = await supabase
        .from('match_requests')
        .select('*')
        .or(`sender_id.eq.163,receiver_id.eq.163`);

    if (matchError) {
        console.error("Error fetching matches:", matchError);
    } else {
        console.log("\n--- Matches for User 163 ---");
        matches.forEach(m => {
            console.log(`Match ID: ${m.id}, Sender: ${m.sender_id}, Receiver: ${m.receiver_id}, Status: '${m.status}'`);
        });
    }

    // Check Member 162
    const { data: member162, error: memberError } = await supabase
        .from('member')
        .select('*')
        .eq('id', 162)
        .single();

    if (memberError) {
        console.error("Error fetching member 162:", memberError);
    } else {
        console.log("\n--- Member 162 ---");
        console.log(member162);
    }
}

debugData();
