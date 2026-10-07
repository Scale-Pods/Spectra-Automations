import { createClient } from '@supabase/supabase-js';

const url = "https://cnjdinmwpfqkbfarsbxv.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuamRpbm13cGZxa2JmYXJzYnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3MzUzNywiZXhwIjoyMTA1NjQ5NTM3fQ.5NwCB4j3dC313Pa1CDG6VXfL-bCYoYOql3KopWaHBAg";

const supabase = createClient(url, key);

async function testRefactor() {
    console.log("=== Testing GET /api/leads logic ===");
    const [custRes, msgRes] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: false })
    ]);

    const customers = custRes.data || [];
    const messages = msgRes.data || [];

    console.log(`Retrieved ${customers.length} customers and ${messages.length} messages.`);

    const nr_wf = customers.map(c => ({
        ...c,
        "Lead ID": c.eworks_customer_id || c.id,
        "Name": c.full_name || c.customer_name || 'Customer',
        "Phone": c.phone_e164 || c.mobile_raw || c.telephone_raw || '',
        "Email": c.email || '',
        "Created At": c.created_at || c.eworks_created_on,
        "W.P_1": c.whatsapp_1 || c.WA_text || "Outreach Message",
        "1st_wa_ts": c.created_at,
        "WP_Replied_track": c.WA_replied || '',
        "Email_Replied": (c.email_reply && Array.isArray(c.email_reply) && c.email_reply.length > 0) ? "Replied" : null,
        whatsapp_count: (c.whatsapp_1 ? 1 : 0) + (c.whatsapp_2 ? 1 : 0) + (c.whatsapp_3 ? 1 : 0) + (c.whatsapp_4 ? 1 : 0) || 1,
        source_loop: c.sequence_channel ? `${c.sequence_channel.toUpperCase()} Sequence` : "eWorks Lead"
    }));

    const activity_leads = messages.map(m => {
        const isEmail = String(m.channel).toUpperCase() === 'EMAIL';
        const isWa = String(m.channel).toUpperCase() === 'WHATSAPP';
        const isReply = String(m.direction).toUpperCase() === 'INBOUND';

        return {
            ...m,
            _source_table: 'messages',
            lead_name: m.recipient_address || m.sender_address || 'Contact',
            lead_phone: isWa ? (m.recipient_address || m.sender_address || '') : '',
            lead_email: isEmail ? (m.recipient_address || m.sender_address || '') : '',
            channel: isEmail ? 'email' : (isWa ? 'whatsapp' : (m.channel || 'email').toLowerCase()),
            action_type: isReply ? 'reply' : (m.direction || 'outreach').toLowerCase(),
            status: m.status ? m.status.toLowerCase() : (isReply ? 'replied' : 'sent'),
            content: m.body_text || m.subject || '',
            note: m.body_text || '',
            created_at: m.sent_or_received_at || m.created_at,
            replied_at: isReply ? (m.sent_or_received_at || m.created_at) : null
        };
    });

    console.log("Mapped nr_wf length:", nr_wf.length);
    console.log("Mapped activity_leads length:", activity_leads.length);

    console.log("\n=== Sample Mapped Customer Lead ===", nr_wf[0]);
    console.log("\n=== Sample Mapped Activity Lead ===", activity_leads[0]);
}

testRefactor().catch(console.error);
