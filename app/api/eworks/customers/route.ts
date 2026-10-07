import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.max(1, parseInt(searchParams.get('limit') || '5', 10));
        const search = (searchParams.get('search') || '').trim().toLowerCase();
        const category = searchParams.get('category') || 'all';

        // 1. Fetch all customer records from Supabase public.customers table
        const { data: allCustomers, error } = await supabaseAdmin
            .from('customers')
            .select('*')
            .order('eworks_last_updated_on', { ascending: false, nullsFirst: false });

        if (error) {
            console.error('Error fetching eWorks customers from Supabase:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const customers = allCustomers || [];

        // 2. Compute Global Real Metrics from live database rows
        let totalInvoiced = 0;
        let totalReceived = 0;
        let totalOutstanding = 0;
        let activeJobs = 0;
        let completedJobs = 0;
        let totalJobs = 0;
        let pendingQuotes = 0;
        let totalQuotes = 0;
        let amcCustomers = 0;
        let retentionReady = 0;
        let unpaidInvoices = 0;
        let overdueInvoices = 0;

        // Service Category breakdown counters
        const serviceCategoryMap: Record<string, { count: number; revenue: number }> = {};

        customers.forEach(c => {
            totalInvoiced += Number(c.total_invoiced_value || 0);
            totalReceived += Number(c.total_received_value || 0);
            totalOutstanding += Number(c.total_outstanding_balance || 0);
            activeJobs += Number(c.active_job_count || 0);
            completedJobs += Number(c.completed_job_count || 0);
            totalJobs += Number(c.total_job_count || 0);
            pendingQuotes += Number(c.pending_quote_count || 0);
            totalQuotes += Number(c.total_quote_count || 0);

            if (c.has_amc) amcCustomers++;
            if (c.decision_status === 'READY') retentionReady++;
            if (c.has_unpaid_invoice || c.has_overdue_invoice) unpaidInvoices++;
            if (c.has_overdue_invoice) overdueInvoices++;

            const cat = c.latest_quoted_service_category || 'General Service';
            if (!serviceCategoryMap[cat]) {
                serviceCategoryMap[cat] = { count: 0, revenue: 0 };
            }
            serviceCategoryMap[cat].count += Number(c.total_job_count || 1);
            serviceCategoryMap[cat].revenue += Number(c.total_invoiced_value || 0);
        });

        // Format service categories array for pie charts
        const categoryColors: Record<string, string> = {
            'AC Service': '#3b82f6',
            'Cleaning': '#06b6d4',
            'Plumbing': '#0284c7',
            'Electrical': '#8b5cf6',
            'Carpentry': '#f59e0b',
            'General Service': '#10b981'
        };

        const serviceCategories = Object.entries(serviceCategoryMap)
            .map(([name, stat]) => ({
                name,
                count: stat.count,
                revenue: stat.revenue,
                color: categoryColors[name] || '#6366f1'
            }))
            .sort((a, b) => b.count - a.count);

        // 3. Compute Real Filter Counts across categories
        const filterCounts = {
            all: customers.length,
            active_jobs: customers.filter(c => Number(c.active_job_count || 0) > 0).length,
            pending_quotes: customers.filter(c => Boolean(c.has_pending_quote)).length,
            unpaid_invoices: customers.filter(c => Boolean(c.has_unpaid_invoice) || Boolean(c.has_overdue_invoice)).length,
            amc: customers.filter(c => Boolean(c.has_amc)).length,
            retention_ready: customers.filter(c => c.decision_status === 'READY').length
        };

        // 4. Apply Filters (search & category)
        const filteredCustomers = customers.filter(c => {
            // Search filter
            if (search) {
                const fullName = String(c.full_name || '').toLowerCase();
                const custName = String(c.customer_name || '').toLowerCase();
                const email = String(c.email || '').toLowerCase();
                const phone = String(c.phone_e164 || c.mobile_raw || '').toLowerCase();
                const eworksId = String(c.eworks_customer_id || '').toLowerCase();
                const quoteRef = String(c.latest_quote_ref || '').toLowerCase();
                const invoiceRef = String(c.latest_invoice_ref || '').toLowerCase();

                const matchesSearch =
                    fullName.includes(search) ||
                    custName.includes(search) ||
                    email.includes(search) ||
                    phone.includes(search) ||
                    eworksId.includes(search) ||
                    quoteRef.includes(search) ||
                    invoiceRef.includes(search);

                if (!matchesSearch) return false;
            }

            // Category filter
            if (category === 'active_jobs') return Number(c.active_job_count || 0) > 0;
            if (category === 'pending_quotes') return Boolean(c.has_pending_quote);
            if (category === 'unpaid_invoices') return Boolean(c.has_unpaid_invoice) || Boolean(c.has_overdue_invoice);
            if (category === 'amc') return Boolean(c.has_amc);
            if (category === 'retention_ready') return c.decision_status === 'READY';

            return true;
        });

        // 5. Paginate filtered customers
        const startIndex = (page - 1) * limit;
        const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + limit);

        // Normalize JSON fields like active_jobs / service_history for response
        const processedCustomers = paginatedCustomers.map(c => {
            let activeJobsArr = [];
            if (c.active_jobs) {
                if (typeof c.active_jobs === 'string') {
                    try {
                        activeJobsArr = JSON.parse(c.active_jobs);
                    } catch {
                        activeJobsArr = [];
                    }
                } else if (Array.isArray(c.active_jobs)) {
                    activeJobsArr = c.active_jobs;
                }
            }

            let serviceHistArr = null;
            if (c.service_history) {
                if (typeof c.service_history === 'string') {
                    try {
                        serviceHistArr = JSON.parse(c.service_history);
                    } catch {
                        serviceHistArr = null;
                    }
                } else if (Array.isArray(c.service_history)) {
                    serviceHistArr = c.service_history;
                }
            }

            return {
                ...c,
                active_jobs: activeJobsArr,
                service_history: serviceHistArr
            };
        });

        return NextResponse.json({
            customers: processedCustomers,
            pagination: {
                total: filteredCustomers.length,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(filteredCustomers.length / limit))
            },
            metrics: {
                totalCustomers: customers.length,
                totalInvoiced,
                totalReceived,
                totalOutstanding,
                activeJobs,
                completedJobs,
                totalJobs,
                pendingQuotes,
                totalQuotes,
                amcCustomers,
                retentionReady,
                unpaidInvoices,
                overdueInvoices,
                serviceCategories
            },
            filterCounts
        });

    } catch (err: any) {
        console.error('Unhandled error in eWorks customers API:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
