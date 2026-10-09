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

        const fromParam = searchParams.get('from') || searchParams.get('start_date');
        const toParam = searchParams.get('to') || searchParams.get('end_date');

        let fromDate: Date | null = fromParam ? new Date(fromParam) : null;
        let toDate: Date | null = toParam ? new Date(toParam) : null;

        if (fromDate && isNaN(fromDate.getTime())) fromDate = null;
        if (toDate && isNaN(toDate.getTime())) toDate = null;

        if (fromDate && toDate) {
            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(23, 59, 59, 999);
        }

        // 1. Fetch all customer records from Supabase public.customers table
        const { data: allCustomers, error } = await supabaseAdmin
            .from('customers')
            .select('*')
            .order('eworks_last_updated_on', { ascending: false, nullsFirst: false });

        if (error) {
            console.error('Error fetching eWorks customers from Supabase:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        let customers = allCustomers || [];

        // Apply Date Range Filter if set
        if (fromDate && toDate) {
            const filteredByDate = customers.filter(c => {
                const dateCandidates = [
                    c.eworks_last_updated_on,
                    c.last_contacted_at,
                    c.latest_job_start_date,
                    c.eworks_created_on,
                    c.created_at,
                    c.updated_at,
                    c.latest_quote_date,
                    c.latest_job_created_on
                ];

                return dateCandidates.some(dStr => {
                    if (!dStr) return false;
                    const d = new Date(dStr);
                    if (isNaN(d.getTime())) return false;
                    return d >= fromDate! && d <= toDate!;
                });
            });

            if (filteredByDate.length > 0) {
                customers = filteredByDate;
            }
        }

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

        // Highlight insight counters
        let highestUnpaidCustomer = { name: 'N/A', id: 'N/A', amount: 0 };
        let largestInvoiceCustomer = { name: 'N/A', id: 'N/A', amount: 0 };
        let highestJobVolumeCustomer = { name: 'N/A', id: 'N/A', count: 0 };
        let oldestJobRecord = { name: 'N/A', date: 'N/A', title: 'N/A' };

        let maxUnpaid = -1;
        let maxInvoiced = -1;
        let maxJobs = -1;
        let earliestDate: Date | null = null;

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

            const name = c.full_name || c.customer_name || `Customer #${c.eworks_customer_id || c.id}`;
            const custId = c.eworks_customer_id ? `ID #${c.eworks_customer_id}` : `ID #${c.id}`;

            // Highest Unpaid Balance
            const unpaid = Number(c.total_outstanding_balance || 0);
            if (unpaid > maxUnpaid) {
                maxUnpaid = unpaid;
                highestUnpaidCustomer = { name, id: custId, amount: unpaid };
            }

            // Largest Invoiced Value
            const invoiced = Number(c.total_invoiced_value || 0);
            if (invoiced > maxInvoiced) {
                maxInvoiced = invoiced;
                largestInvoiceCustomer = { name, id: custId, amount: invoiced };
            }

            // Highest Job Volume
            const jobCount = Number(c.total_job_count || 0);
            if (jobCount > maxJobs) {
                maxJobs = jobCount;
                highestJobVolumeCustomer = { name, id: custId, count: jobCount };
            }

            // Oldest Job Created / Record
            const jobDateRaw = c.latest_job_start_date || c.eworks_created_on || c.created_at;
            if (jobDateRaw) {
                const d = new Date(jobDateRaw);
                if (!isNaN(d.getTime())) {
                    if (!earliestDate || d.getTime() < earliestDate.getTime()) {
                        earliestDate = d;
                        oldestJobRecord = {
                            name,
                            date: d.toISOString(),
                            title: c.latest_quoted_service_category || 'Service Job'
                        };
                    }
                }
            }
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
                serviceCategories,
                highlights: {
                    highestUnpaidCustomer,
                    largestInvoiceCustomer,
                    highestJobVolumeCustomer,
                    oldestJobRecord
                }
            },
            filterCounts
        });

    } catch (err: any) {
        console.error('Unhandled error in eWorks customers API:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
