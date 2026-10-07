import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnjdinmwpfqkbfarsbxv.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuamRpbm13cGZxa2JmYXJzYnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3MzUzNywiZXhwIjoyMTA1NjQ5NTM3fQ.5NwCB4j3dC313Pa1CDG6VXfL-bCYoYOql3KopWaHBAg';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
    const { data, count, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .limit(10);
    
    if (error) {
        console.error('Error fetching customers:', error);
    } else {
        console.log('Customer count:', count);
        console.log('First customer sample:', JSON.stringify(data?.[0], null, 2));
    }
}

test();
