const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
    console.log('Setting up Supabase Storage...');

    // 1. Create Private Bucket: profile-photos-original
    const { data: privateBucket, error: privateError } = await supabase
        .storage
        .createBucket('profile-photos-original', {
            public: false,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/*']
        });

    if (privateError) {
        if (privateError.message.includes('already exists')) {
            console.log('✅ Bucket "profile-photos-original" already exists');
        } else {
            console.error('❌ Failed to create "profile-photos-original":', privateError.message);
        }
    } else {
        console.log('✅ Created bucket "profile-photos-original" (Private)');
    }

    // 2. Create Public Bucket: profile-photos-blurred
    const { data: publicBucket, error: publicError } = await supabase
        .storage
        .createBucket('profile-photos-blurred', {
            public: true,
            fileSizeLimit: 2097152, // 2MB
            allowedMimeTypes: ['image/*']
        });

    if (publicError) {
        if (publicError.message.includes('already exists')) {
            console.log('✅ Bucket "profile-photos-blurred" already exists');
        } else {
            console.error('❌ Failed to create "profile-photos-blurred":', publicError.message);
        }
    } else {
        console.log('✅ Created bucket "profile-photos-blurred" (Public)');
    }

    console.log('\nStorage setup complete!');
}

setupStorage();
