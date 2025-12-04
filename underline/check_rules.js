
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRules() {
    console.log('Checking rules for "payments"...');
    const { data: pRules, error: pError } = await supabase.rpc('debug_get_rules', { t_name: 'payments' });
    if (pError) console.error(pError);
    else console.table(pRules);

    console.log('Checking rules for "users" (auth)...');
    // Note: pg_rules view might not show auth schema rules easily if not in search path, 
    // but let's try passing 'users' and hope it finds it or we might need to adjust the function.
    // Actually the function filters by tablename. 'users' might be ambiguous.
    // Let's just check payments first.
}

checkRules();
