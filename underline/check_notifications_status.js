require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotifications() {
    console.log('--- Checking Notifications Table ---');

    // 1. Count total notifications
    const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error('Error counting notifications:', countError);
    else console.log(`Total Notifications: ${count}`);

    // 2. List recent notifications
    const { data: recent, error: listError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (listError) console.error('Error listing notifications:', listError);
    else {
        console.log('Recent Notifications:');
        console.log(JSON.stringify(recent, null, 2));
    }

    // 3. Check specific sender
    const senderId = 'd5188c3b-bd9b-4d1d-944c-8c48f52cb56a';
    const { data: sender, error: senderError } = await supabase
        .from('member')
        .select('*')
        .eq('auth_id', senderId)
        .single();

    if (senderError) console.error('Error fetching sender:', senderError);
    else console.log('Sender Details:', JSON.stringify(sender, null, 2));

    // 3. Check for orphaned notifications (invalid user_id)
    // We can't easily join auth.users via JS client, but we can check if user_id is null if schema allows

    console.log('\n--- Checking Triggers ---');
    // We can't check triggers via JS client easily, but we can check if data is being inserted.
}

checkNotifications();
