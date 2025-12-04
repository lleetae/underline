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

    // 2. List recent notifications with ID details
    const { data: recent, error: listError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (listError) console.error('Error listing notifications:', listError);
    else {
        console.log('Recent Notifications:');
        for (const n of recent) {
            console.log(`\n[Notification] ID: ${n.id}, Type: ${n.type}`);
            console.log(`  - user_id (Recipient): ${n.user_id}`);
            console.log(`  - sender_id: ${n.sender_id}`);

            // Check if this user_id exists in member table as auth_id
            const { data: member, error: memberError } = await supabase
                .from('member')
                .select('id, nickname, auth_id')
                .eq('auth_id', n.user_id)
                .single();

            if (member) {
                console.log(`  - Mapped to Member: ${member.nickname} (ID: ${member.id})`);
            } else {
                console.log(`  - WARNING: No Member found with auth_id = ${n.user_id}`);
            }
        }
    }

    console.log('\n--- Checking Triggers ---');
    // We will check triggers via SQL tool next
}

checkNotifications();
