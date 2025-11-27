const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedApplications() {
    console.log("Fetching members...");
    const { data: members, error: fetchError } = await supabase.from('member').select('id, nickname');

    if (fetchError) {
        console.error('Error fetching members:', fetchError);
        return;
    }

    console.log(`Found ${members.length} members.`);

    for (const member of members) {
        console.log(`Applying for member: ${member.nickname} (${member.id})`);
        const { error: insertError } = await supabase
            .from('dating_applications')
            .upsert({ member_id: member.id }, { onConflict: 'member_id' });

        if (insertError) {
            console.error(`Error applying for ${member.nickname}:`, insertError);
        } else {
            console.log(`Successfully applied for ${member.nickname}`);
        }
    }
    console.log("Seeding complete.");
}

seedApplications();
