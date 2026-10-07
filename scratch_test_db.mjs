import { createClient } from '@supabase/supabase-js';

const url = "https://cnjdinmwpfqkbfarsbxv.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuamRpbm13cGZxa2JmYXJzYnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3MzUzNywiZXhwIjoyMTA1NjQ5NTM3fQ.5NwCB4j3dC313Pa1CDG6VXfL-bCYoYOql3KopWaHBAg";

const supabase = createClient(url, key);

async function test() {
    console.log("--- Checking customers table ---");
    const { count: custCount, error: custErr } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    console.log("Customers count:", custCount, "Error:", custErr?.message || null);

    console.log("--- Checking master_leads table ---");
    const { count: masterCount, error: masterErr } = await supabase.from('master_leads').select('*', { count: 'exact', head: true });
    console.log("master_leads count:", masterCount, "Error:", masterErr?.message || null);

    console.log("--- Checking fello_leads table ---");
    const { count: felloCount, error: felloErr } = await supabase.from('fello_leads').select('*', { count: 'exact', head: true });
    console.log("fello_leads count:", felloCount, "Error:", felloErr?.message || null);

    console.log("--- Checking activity tables ---");
    for (const table of ['fello_activity', 'aspen_activity', 'naples_activity', 'old_activity']) {
        const { count, error, data } = await supabase.from(table).select('*').limit(5);
        console.log(`Table ${table}: count=${count}, dataLen=${data?.length}, error=${error?.message || null}`);
        if (data && data.length > 0) {
            console.log(`Sample row from ${table}:`, Object.keys(data[0]), "created_at:", data[0].created_at);
        }
    }

    console.log("--- Checking lead tables ---");
    for (const table of ['naples_leads', 'aspen_leads', 'old_leads']) {
        const { count, error, data } = await supabase.from(table).select('*').limit(5);
        console.log(`Table ${table}: count=${count}, dataLen=${data?.length}, error=${error?.message || null}`);
        if (data && data.length > 0) {
            console.log(`Sample row from ${table}:`, Object.keys(data[0]));
        }
    }
}

test().catch(console.error);
