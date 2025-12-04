
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectMatches() {
    console.log('Inspecting constraints for "matches" table...');
    const { data: constraints, error: cError } = await supabase.rpc('debug_get_constraints', { t_name: 'matches' });
    if (cError) console.error(cError);
    else console.table(constraints);

    console.log('Inspecting triggers for "matches" table...');
    const { data: triggers, error: tError } = await supabase.rpc('debug_get_triggers', { t_name: 'matches' });
    if (tError) console.error(tError);
    else console.table(triggers);
}

inspectMatches();
