import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnjdinmwpfqkbfarsbxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuamRpbm13cGZxa2JmYXJzYnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3MzUzNywiZXhwIjoyMTA1NjQ5NTM3fQ.5NwCB4j3dC313Pa1CDG6VXfL-bCYoYOql3KopWaHBAg';

const supabase = createClient(supabaseUrl, supabaseKey);

function checkIsNonEmpty(val) {
    if (val === null || val === undefined) return false;
    const str = String(val).trim();
    return str !== '' && str !== '[]' && str !== 'null' && str !== 'undefined';
}

function checkIsReplied(val) {
    if (val === null || val === undefined) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    const str = String(val).trim().toLowerCase();
    return str !== '' && str !== '[]' && str !== 'no' && str !== 'false' && str !== 'null' && str !== 'undefined';
}

async function main() {
    const { data: customers } = await supabase.from('customers').select('*');

    let totalLeads = customers.length;
    let emailSentCount = 0; // customer rows with non-empty email_1..email_4
    let totalEmailStepsCount = 0; // count of non-empty email_1..4 columns
    let waReachoutsCount = 0; // customer rows with non-empty WA_text / whatsapp_1

    let emailRepliesCount = 0; // customer rows with non-empty email_reply
    let waRepliesCount = 0; // customer rows with non-empty WA_replied

    customers.forEach(c => {
        let custEmailSteps = 0;
        ['email_1', 'email_2', 'email_3', 'email_4'].forEach(col => {
            if (checkIsNonEmpty(c[col])) custEmailSteps++;
        });
        if (custEmailSteps > 0) {
            emailSentCount++;
            totalEmailStepsCount += custEmailSteps;
        }

        if (checkIsNonEmpty(c.WA_text) || checkIsNonEmpty(c.whatsapp_1) || checkIsNonEmpty(c.whatsapp_2)) {
            waReachoutsCount++;
        }

        if (checkIsReplied(c.email_reply)) {
            emailRepliesCount++;
        }

        if (checkIsReplied(c.WA_replied)) {
            waRepliesCount++;
        }
    });

    console.log("=== CUSTOMER TABLE EXACT METRICS ===");
    console.log("Total Leads:", totalLeads);
    console.log("Emails Sent (Customer Rows with email_1..4):", emailSentCount);
    console.log("Emails Sent (Total Non-Empty Email Columns):", totalEmailStepsCount);
    console.log("WhatsApp Reachouts (Customer Rows with WA_text/whatsapp_1..2):", waReachoutsCount);
    console.log("Email Replies (non-empty email_reply):", emailRepliesCount);
    console.log("WhatsApp Replies (non-empty WA_replied):", waRepliesCount);
    console.log("Total Replies (Email Replies + WA Replies):", emailRepliesCount + waRepliesCount);
}

main();
