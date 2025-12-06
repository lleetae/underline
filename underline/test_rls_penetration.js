
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runPenetrationTest() {
    console.log("🔒 Starting RLS Penetration Test...");
    console.log("Target: Member Table");
    console.log("Using: PUBLIC ANON KEY (Simulating Client Access)");

    // Test 1: Data Dump Attempt
    console.log("\n[Test 1] Attempting to dump all user data (SELECT * FROM member)...");
    const { data: dumpData, error: dumpError } = await supabase
        .from('member')
        .select('id, nickname, kakao_id, phone_number')
        .limit(10);

    if (dumpError) {
        console.log("✅ Blocked by RLS (Error returned):", dumpError.message);
    } else if (!dumpData || dumpData.length === 0) {
        console.log("✅ Blocked by RLS (No data returned). Safe.");
    } else {
        console.log("❌ WARNING: Data Leaked! RLS is failing.");
        console.log("Leaked Data:", dumpData);
    }

    // Test 2: Unauthorized Update Attempt
    // We need a target ID. Let's try to find one first (if Test 1 failed) or use a random UUID.
    const targetId = 1; // Integer ID

    console.log(`\n[Test 2] Attempting to modify user ${targetId} (UPDATE nickname)...`);
    const { data: updateData, error: updateError } = await supabase
        .from('member')
        .update({ nickname: 'Hacked_By_Anon' })
        .eq('id', targetId)
        .select();

    if (updateError) {
        console.log("✅ Blocked by RLS (Error returned):", updateError.message);
    } else if (!updateData || updateData.length === 0) {
        console.log("✅ Blocked by RLS (No rows updated). Safe.");
    } else {
        console.log("❌ WARNING: Update Succeeded! RLS is failing.");
    }

    console.log("\n---------------------------------------------------");
    console.log("Report Summary:");
    const leaked = (dumpData && dumpData.length > 0);
    const modified = (updateData && updateData.length > 0);

    // Test 3: Attempt to decrypt leaked ID
    if (dumpData && dumpData.length > 0) {
        const victim = dumpData.find(u => u.kakao_id && u.kakao_id.length > 20);
        if (victim) {
            console.log(`\n[Test 3] Attempting to decrypt stolen ID for user ${victim.nickname}...`);
            const { data: decrypted, error: rpcError } = await supabase.rpc('decrypt_kakao_id', {
                encrypted_text: victim.kakao_id
            });

            if (rpcError) {
                console.log("✅ Blocked by RPC Permissions:", rpcError.message);
            } else {
                console.log("❌ CRITICAL: Decryption RPC is PUBLIC! Result:", decrypted);
            }
        }
    }
}

runPenetrationTest();
