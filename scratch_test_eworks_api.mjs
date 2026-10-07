import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnjdinmwpfqkbfarsbxv.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuamRpbm13cGZxa2JmYXJzYnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA3MzUzNywiZXhwIjoyMTA1NjQ5NTM3fQ.5NwCB4j3dC313Pa1CDG6VXfL-bCYoYOql3KopWaHBAg';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function test() {
    console.time('Fetch metrics');
    const { data: allCustomers, error } = await supabase
        .from('customers')
        .select(`
            id,
            active_job_count,
            completed_job_count,
            total_job_count,
            pending_quote_count,
            total_quote_count,
            total_invoiced_value,
            total_received_value,
            total_outstanding_balance,
            has_amc,
            has_pending_quote,
            has_unpaid_invoice,
            has_overdue_invoice,
            decision_status
        `);

    if (error) {
        console.error('Error fetching customers:', error);
        return;
    }

    console.timeEnd('Fetch metrics');
    console.log('Total customers fetched:', allCustomers.length);

    let totalInvoiced = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let activeJobs = 0;
    let completedJobs = 0;
    let totalJobs = 0;
    let pendingQuotes = 0;
    let totalQuotes = 0;
    let amcCount = 0;
    let pendingQuoteCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;
    let retentionReadyCount = 0;

    allCustomers.forEach(c => {
        totalInvoiced += Number(c.total_invoiced_value || 0);
        totalReceived += Number(c.total_received_value || 0);
        totalOutstanding += Number(c.total_outstanding_balance || 0);
        activeJobs += Number(c.active_job_count || 0);
        completedJobs += Number(c.completed_job_count || 0);
        totalJobs += Number(c.total_job_count || 0);
        pendingQuotes += Number(c.pending_quote_count || 0);
        totalQuotes += Number(c.total_quote_count || 0);
        if (c.has_amc) amcCount++;
        if (c.has_pending_quote) pendingQuoteCount++;
        if (c.has_unpaid_invoice || c.has_overdue_invoice) unpaidCount++;
        if (c.has_overdue_invoice) overdueCount++;
        if (c.decision_status === 'READY') retentionReadyCount++;
    });

    console.log('--- Real Metrics Summary ---');
    console.log('Total Customers:', allCustomers.length);
    console.log('Total Invoiced:', totalInvoiced);
    console.log('Total Received:', totalReceived);
    console.log('Total Outstanding:', totalOutstanding);
    console.log('Active Jobs:', activeJobs);
    console.log('Completed Jobs:', completedJobs);
    console.log('Pending Quotes:', pendingQuotes);
    console.log('AMC Customers:', amcCount);
    console.log('Retention Ready:', retentionReadyCount);
}

test();
