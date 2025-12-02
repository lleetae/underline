
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    console.log('Fetching reviews...');
    const { data, error } = await supabase
        .from('reviews')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! Count:', data?.length);
        console.log('First item:', data?.[0]);
    }
}

testFetch();
