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

    // 3. Check logged-in user details
    const loggedInUserId = '60dc0cb0-0206-4912-aa69-d07bfb119dcc';
    console.log(`\n--- Checking Logged-in User (${loggedInUserId}) ---`);
    const { data: loggedInMember, error: loggedInError } = await supabase
        .from('member')
        .select('id, nickname, auth_id')
        .eq('auth_id', loggedInUserId)
        .single();

    if (loggedInError) console.error('Error fetching logged-in member:', loggedInError);
    else console.log('Logged-in Member:', JSON.stringify(loggedInMember, null, 2));

    // 4. Create RPC function for debugging (Commented out as we are using JS workaround)
    // console.log('\n--- Creating RPC Function ---');
    // const { error: rpcError } = await supabase.rpc('create_debug_function', {});

    // Since we can't easily run raw SQL via supabase-js client without a helper,
    // we will try to use the 'rpc' interface if we had a sql-runner function, but we don't.
    // Wait, we can use the 'pg' library if available, but it's not.

    // Alternative: We will assume the user can run the migration or we try to debug why the API fails.
    // Let's try to debug the API failure by logging the exact query error in the API.

    // Actually, let's revert to the API and log the 'error' object fully.
}

checkNotifications();
