import { createClient } from '@supabase/supabase-js';

const url = "https://cnjdinmwpfqkbfarsbxv.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuamRpbm13cGZxa2JmYXJzYnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3MzUzNywiZXhwIjoyMTA1NjQ5NTM3fQ.5NwCB4j3dC313Pa1CDG6VXfL-bCYoYOql3KopWaHBAg";

const supabase = createClient(url, key);

async function testUnified() {
    console.log("=== Fetching all messages count by channel ===");
    const { data: messages, error: msgErr } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    console.log("Total messages:", messages?.length, "Error:", msgErr?.message || null);

    const emailMessages = (messages || []).filter(m => String(m.channel).toUpperCase() === 'EMAIL');
    const waMessages = (messages || []).filter(m => String(m.channel).toUpperCase() === 'WHATSAPP');
    const inboundReplies = (messages || []).filter(m => String(m.direction).toUpperCase() === 'INBOUND');

    console.log(`EMAIL messages: ${emailMessages.length}`);
    console.log(`WHATSAPP messages: ${waMessages.length}`);
    console.log(`INBOUND replies: ${inboundReplies.length}`);

    console.log("\n=== Fetching customers count ===");
    const { data: customers, error: custErr } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    console.log("Total customers:", customers?.length, "Error:", custErr?.message || null);

    const customersWithEmail = (customers || []).filter(c => c.has_email || (c.email && c.email.trim()));
    const customersWithPhone = (customers || []).filter(c => c.has_phone || (c.phone_e164 && c.phone_e164.trim()));
    const customersWithWpReply = (customers || []).filter(c => c.WA_replied || c.email_reply?.length > 0);

    console.log(`Customers with Email: ${customersWithEmail.length}`);
    console.log(`Customers with Phone: ${customersWithPhone.length}`);
    console.log(`Customers with WP/Email Reply flag: ${customersWithWpReply.length}`);

    if (emailMessages.length > 0) {
        console.log("\nSample EMAIL Message:", {
            id: emailMessages[0].id,
            subject: emailMessages[0].subject,
            direction: emailMessages[0].direction,
            sender: emailMessages[0].sender_address,
            recipient: emailMessages[0].recipient_address,
            sent_at: emailMessages[0].sent_or_received_at || emailMessages[0].created_at
        });
    }

    if (waMessages.length > 0) {
        console.log("\nSample WHATSAPP Message:", waMessages[0]);
    }
}

testUnified().catch(console.error);
