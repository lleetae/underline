require('dotenv').config({ path: '.env.local' });

console.log('--- Checking Environment Variables ---');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'MISSING');

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Service Key Length:', process.env.SUPABASE_SERVICE_ROLE_KEY.length);
}
