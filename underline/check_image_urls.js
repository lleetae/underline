require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkImages() {
    const { data, error } = await supabase.from('reviews').select('image_url').limit(5);
    if (error) console.error(error);
    else console.log(data);
}

checkImages();
