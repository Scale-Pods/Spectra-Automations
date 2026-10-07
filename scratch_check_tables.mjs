import { createClient } from '@supabase/supabase-js';

const url = "https://cnjdinmwpfqkbfarsbxv.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuamRpbm13cGZxa2JmYXJzYnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3MzUzNywiZXhwIjoyMTA1NjQ5NTM3fQ.5NwCB4j3dC313Pa1CDG6VXfL-bCYoYOql3KopWaHBAg";

const supabase = createClient(url, key);

async function checkAllTables() {
    const candidates = [
        'customers',
        'leads',
        'master_leads',
        'fello_leads',
        'activity',
        'activities',
        'calls',
        'voice_calls',
        'messages',
        'whatsapp_messages',
        'email_messages',
        'emails',
        'sms_messages',
        'templates',
        'users',
        'profiles'
    ];

    for (const t of candidates) {
        const { data, error, count } = await supabase.from(t).select('*', { count: 'exact' }).limit(2);
        if (!error) {
            console.log(`FOUND TABLE: ${t} - count: ${count}, sample row keys:`, data && data.length > 0 ? Object.keys(data[0]) : []);
        } else {
            console.log(`NOT FOUND: ${t} (${error.message})`);
        }
    }
}

checkAllTables().catch(console.error);
