import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length > 0) env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: customers } = await supabase.from('customers').select('*');
    console.log('Customers count:', customers.length);

    const replied = customers.filter(c => {
        if (!c.email_reply) return false;
        const str = JSON.stringify(c.email_reply);
        return str !== '[]' && str !== 'null' && str !== '""' && str !== '{}';
    });

    console.log('Replied count:', replied.length);
    replied.forEach(c => {
        console.log('Replied customer:', {
            id: c.id,
            name: c.full_name,
            email: c.email,
            email_reply: c.email_reply,
            created_at: c.created_at,
            eworks_created_on: c.eworks_created_on
        });
    });
}
check();
