const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('Checking notifications table...');
    const { error: tableError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);

    if (tableError) {
        console.error('Error checking notifications table:', tableError);
    } else {
        console.log('Notifications table exists.');
    }

    console.log('\nChecking triggers...');
    // We can't directly check triggers via JS client easily without running SQL.
    // But we can try to insert a dummy match request and see if a notification is created.
    // However, that might be risky.
    // Instead, let's just check if the table exists and relies on the user to apply migration if needed.
    // Or we can use the `rpc` call if we have a function to check metadata, but we probably don't.

    // Let's check if there are any notifications
    const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .limit(5);

    if (notifError) {
        console.log("Could not fetch notifications:", notifError.message);
    } else {
        console.log("Fetched recent notifications:", notifications);
    }
}

checkSchema();
