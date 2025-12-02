const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMember() {
    console.log('Checking member 74...');
    const { data, error } = await supabase
        .from('member')
        .select('*')
        .eq('id', 74)
        .single();

    if (error) {
        console.error('Error fetching member:', error);
    } else {
        console.log('Member 74:', JSON.stringify(data, null, 2));
    }
}

checkMember();
