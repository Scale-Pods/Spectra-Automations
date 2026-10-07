import { createClient } from '@supabase/supabase-js';

const url = "https://cnjdinmwpfqkbfarsbxv.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuamRpbm13cGZxa2JmYXJzYnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3MzUzNywiZXhwIjoyMTA1NjQ5NTM3fQ.5NwCB4j3dC313Pa1CDG6VXfL-bCYoYOql3KopWaHBAg";

const supabase = createClient(url, key);

async function inspectSchema() {
    console.log("=== Checking messages table ===");
    const { data: msgSample, error: msgErr } = await supabase.from('messages').select('*').limit(5);
    console.log("Messages sample:", msgSample);

    console.log("\n=== Checking channels in messages ===");
    const { data: channels, error: chanErr } = await supabase.from('messages').select('channel, direction, status, provider');
    if (channels) {
        const chanCounts = {};
        const dirCounts = {};
        const statusCounts = {};
        channels.forEach(m => {
            chanCounts[m.channel] = (chanCounts[m.channel] || 0) + 1;
            dirCounts[m.direction] = (dirCounts[m.direction] || 0) + 1;
            statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
        });
        console.log("Message Channels:", chanCounts);
        console.log("Message Directions:", dirCounts);
        console.log("Message Statuses:", statusCounts);
    }

    console.log("\n=== Checking customers sample with WA / Email data ===");
    const { data: custWa } = await supabase.from('customers')
        .select('id, full_name, email, phone_e164, sequence_channel, sequence_step, whatsapp_1, email_1, WA_replied, email_reply')
        .or('whatsapp_1.not.is.null,email_1.not.is.null,WA_replied.not.is.null')
        .limit(5);
    console.log("Customers with WA/Email:", custWa);
}

inspectSchema().catch(console.error);
