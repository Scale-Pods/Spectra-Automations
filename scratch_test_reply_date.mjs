import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length > 0) env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const { data: customers } = await supabase.from('customers').select('*');
    const repliedLeads = customers.filter(c => {
        if (!c.email_reply) return false;
        const str = JSON.stringify(c.email_reply);
        return str !== '[]' && str !== 'null' && str !== '""' && str !== '{}';
    });

    console.log('Found replied customer count:', repliedLeads.length);
    repliedLeads.forEach(c => {
        let replyDate = null;
        if (Array.isArray(c.email_reply)) {
            c.email_reply.forEach(r => {
                const dStr = r.received_at || r.sent_at || r.created_at;
                if (dStr) {
                    const d = new Date(dStr);
                    if (!isNaN(d.getTime())) replyDate = d;
                }
            });
        }
        if (!replyDate && (c.updated_at || c.created_at)) {
            replyDate = new Date(c.updated_at || c.created_at);
        }
        console.log('Customer:', c.full_name, 'Parsed replyDate:', replyDate ? replyDate.toISOString() : 'None');
        
        const fromD = new Date('2026-09-30T00:00:00.000Z');
        const toD = new Date('2026-10-07T23:59:59.999Z');
        const inRange = replyDate && replyDate >= fromD && replyDate <= toD;
        console.log('Is in range Sep 30 - Oct 07?', inRange);
    });
}
test();
