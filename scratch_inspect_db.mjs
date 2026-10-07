import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length > 0) env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: customers, error } = await supabase.from('customers').select('*');
    if (error) { console.error(error); return; }
    console.log('Total customer rows in DB:', customers.length);

    let emailSentStepCount = 0;
    const emailSentLeads = [];
    const emailReplyLeads = [];
    let emailUnsubCount = 0;

    let waSentStepCount = 0;
    const waSentLeads = [];
    const waReplyLeads = [];

    customers.forEach(c => {
        let hasEmailSent = false;
        ['email_1', 'email_2', 'email_3', 'email_4'].forEach(col => {
            if (c[col] && String(c[col]).trim() !== '' && String(c[col]).trim() !== 'null') {
                emailSentStepCount++;
                hasEmailSent = true;
            }
        });
        if (hasEmailSent) emailSentLeads.push(c);

        if (c.email_reply && String(JSON.stringify(c.email_reply)) !== '[]' && String(JSON.stringify(c.email_reply)) !== 'null') {
            emailReplyLeads.push(c);
        }

        if (c.email_unsubscribed === true) {
            emailUnsubCount++;
        }

        let hasWaSent = false;
        if (c.WA_text && String(c.WA_text).trim() !== '' && String(c.WA_text).trim() !== 'null') {
            waSentStepCount++;
            hasWaSent = true;
        }
        ['whatsapp_1', 'whatsapp_2', 'whatsapp_3', 'whatsapp_4'].forEach(col => {
            if (c[col] && String(c[col]).trim() !== '' && String(c[col]).trim() !== 'null') {
                waSentStepCount++;
                hasWaSent = true;
            }
        });

        if (hasWaSent) {
            waSentLeads.push(c);
        }

        if (c.WA_replied && String(c.WA_replied).trim() !== '' && String(c.WA_replied).toLowerCase() !== 'no' && String(c.WA_replied).toLowerCase() !== 'false' && String(c.WA_replied).toLowerCase() !== 'null') {
            waReplyLeads.push(c);
        }
    });

    console.log('\n=== EMAIL METRICS FROM CUSTOMERS TABLE ===');
    console.log('Total Email Steps Sent (email_1..4):', emailSentStepCount);
    console.log('Unique Leads with Email Sent:', emailSentLeads.length);
    console.log('Leads with Email Reply:', emailReplyLeads.length);
    console.log('Email Unsubscribed:', emailUnsubCount);

    console.log('\n=== WHATSAPP METRICS FROM CUSTOMERS TABLE ===');
    console.log('Unique Msg Sent (leads with WA_text/whatsapp_1..4):', waSentLeads.length);
    console.log('Total WhatsApp Messages Sent (steps):', waSentStepCount);
    console.log('WhatsApp Replies:', waReplyLeads.length);

    console.log('\n=== LEADS WITH EMAIL SENT ===');
    emailSentLeads.forEach(l => console.log(`- ${l.full_name} (${l.email}): email_1=${l.email_1}`));

    console.log('\n=== LEADS WITH WHATSAPP SENT ===');
    waSentLeads.forEach(l => console.log(`- ${l.full_name} (${l.phone_e164}): WA_text=${l.WA_text}`));

    console.log('\n=== LEADS WITH WHATSAPP REPLIED ===');
    waReplyLeads.forEach(l => console.log(`- ${l.full_name} (${l.phone_e164}): WA_replied=${l.WA_replied}`));

    console.log('\n=== LEADS WITH EMAIL REPLIED ===');
    emailReplyLeads.forEach(l => console.log(`- ${l.full_name} (${l.email})`));
}
run();
