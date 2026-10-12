import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchMessages } from '@/lib/messages-data';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export interface MasterMetrics {
    totalLeads: number;
    allTimeTotalLeads?: number;
    oldestLeadDate: string | null;
    totalWaReachouts: number;
    totalWaReplies: number;
    totalVoiceCalls: number;
    ownerVoiceCalls: number;
    normalVapiCost: number;
    ownerVapiCost: number;
    leadsDaily: { date: string; leads: number }[];
    dailyAcquisition?: { date: string; leads: number }[];
    ownerWaReachouts: number;
    ownerWaReplies: number;
    activityEmailCount?: number;
    activityEmailSentCount?: number;
    activityEmailUniqueLeadsCount?: number;
    activityEmailLeadRepliesCount?: number;
    activityEmailReplyRate?: string;
    totalWaUniqueLeadsCount?: number;
    totalWaLeadReplies?: number;
    totalUniqueLeadsContacted?: number;
    totalLeadReplies?: number;
    overallReplyRate?: string;
    activityWaCount?: number;
    activityVoiceCount?: number;
    activitySmsCount?: number;
    activityRepliesCount?: number;
    activityTotalCount?: number;
    eworksInvoiced?: number;
    eworksActiveJobs?: number;
    eworksPendingQuotes?: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const fromParam = searchParams.get('from') || searchParams.get('start_date');
        const toParam = searchParams.get('to') || searchParams.get('end_date');

        const now = new Date();
        const fromDate = fromParam ? new Date(fromParam) : subDays(startOfDay(now), 7);
        const toDate = toParam ? new Date(toParam) : endOfDay(now);

        // Fetch all messages from public.messages
        const { messages, total: messageTotal } = await fetchMessages({ limit: 2000 });

        // Fetch all customers from public.customers
        const { data: customers } = await supabaseAdmin
            .from('customers')
            .select('*');

        const allCustomers = customers || [];
        let totalLeads = 0;
        let oldestLeadDate: string | null = null;
        const dailyMap = new Map<string, number>();

        allCustomers.forEach(c => {
            const dt = c.created_at || c.eworks_created_on;
            if (dt) {
                const d = new Date(dt);
                if (!isNaN(d.getTime())) {
                    if (d >= fromDate && d <= toDate) {
                        totalLeads++;
                        const dateKey = d.toISOString().split('T')[0];
                        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
                    }
                    if (!oldestLeadDate || d.getTime() < new Date(oldestLeadDate).getTime()) {
                        oldestLeadDate = dt;
                    }
                }
            }
        });

        let activityEmailCount = 0;
        let activityWaCount = 0;
        let activityVoiceCount = 0;
        let activitySmsCount = 0;
        let totalWaReachouts = 0;
        let totalWaReplies = 0;

        const emailContactedLeads = new Set<string>();
        const emailRepliedLeads = new Set<string>();
        const emailContactedWhoReplied = new Set<string>();

        const waContactedLeads = new Set<string>();
        const waRepliedLeads = new Set<string>();
        const waContactedWhoReplied = new Set<string>();

        const allContactedLeads = new Set<string>();
        const allRepliedLeads = new Set<string>();

        // Process public.messages within date range
        messages.forEach(m => {
            const dt = m.sent_or_received_at || m.created_at;
            if (dt) {
                const d = new Date(dt);
                if (!isNaN(d.getTime())) {
                    if (d < fromDate || d > toDate) {
                        return; // Outside selected date range
                    }
                }
            }

            const ch = (m.channel || '').toUpperCase();
            const isReply = m.direction === 'INBOUND' || (m.status && m.status.toLowerCase().includes('reply'));
            const leadKey = m.customer_id || (isReply ? m.sender_address : m.recipient_address);

            if (ch === 'EMAIL') {
                if (m.direction === 'OUTBOUND') {
                    activityEmailCount++;
                    if (leadKey) {
                        emailContactedLeads.add(leadKey);
                        allContactedLeads.add(leadKey);
                    }
                } else if (isReply) {
                    if (leadKey) {
                        emailRepliedLeads.add(leadKey);
                        allRepliedLeads.add(leadKey);
                    }
                }
            } else if (ch === 'WHATSAPP') {
                activityWaCount++;
                if (m.direction === 'INBOUND' || isReply) {
                    totalWaReplies++;
                    if (leadKey) {
                        waRepliedLeads.add(leadKey);
                        allRepliedLeads.add(leadKey);
                    }
                } else {
                    totalWaReachouts++;
                    if (leadKey) {
                        waContactedLeads.add(leadKey);
                        allContactedLeads.add(leadKey);
                    }
                }
            } else if (ch === 'VOICE') {
                activityVoiceCount++;
            } else if (ch === 'SMS') {
                activitySmsCount++;
            }
        });

        // Supplement from customer columns if messages count is low
        if (activityEmailCount === 0) {
            allCustomers.forEach(c => {
                const dt = c.created_at || c.eworks_created_on;
                if (dt) {
                    const d = new Date(dt);
                    if (d < fromDate || d > toDate) return;
                }
                if (c.email_1 || c.email_2) {
                    activityEmailCount++;
                    emailContactedLeads.add(c.id);
                    allContactedLeads.add(c.id);
                }
                if (c.email_reply && String(c.email_reply).trim() !== '' && String(c.email_reply).toLowerCase() !== 'no') {
                    emailRepliedLeads.add(c.id);
                    allRepliedLeads.add(c.id);
                }
            });
        }

        emailContactedLeads.forEach(k => {
            if (emailRepliedLeads.has(k)) {
                emailContactedWhoReplied.add(k);
            }
        });

        const activityEmailUniqueLeadsCount = emailContactedLeads.size;
        const activityEmailLeadRepliesCount = emailContactedWhoReplied.size > 0
            ? emailContactedWhoReplied.size
            : Math.min(emailRepliedLeads.size, activityEmailUniqueLeadsCount || emailRepliedLeads.size);
        const activityEmailReplyRate = activityEmailUniqueLeadsCount > 0
            ? Math.min(100, (activityEmailLeadRepliesCount / activityEmailUniqueLeadsCount) * 100).toFixed(1)
            : "0.0";

        if (activityWaCount === 0) {
            allCustomers.forEach(c => {
                const dt = c.created_at || c.eworks_created_on;
                if (dt) {
                    const d = new Date(dt);
                    if (d < fromDate || d > toDate) return;
                }
                if (c.WA_text || c.whatsapp_1) {
                    activityWaCount++;
                    totalWaReachouts++;
                    waContactedLeads.add(c.id);
                    allContactedLeads.add(c.id);
                    if (c.WA_replied && String(c.WA_replied).toLowerCase() !== 'no') {
                        totalWaReplies++;
                        waRepliedLeads.add(c.id);
                        allRepliedLeads.add(c.id);
                    }
                }
            });
        }

        waContactedLeads.forEach(k => {
            if (waRepliedLeads.has(k)) {
                waContactedWhoReplied.add(k);
            }
        });

        const totalWaUniqueLeadsCount = waContactedLeads.size;
        const totalWaLeadReplies = waContactedWhoReplied.size > 0
            ? waContactedWhoReplied.size
            : Math.min(waRepliedLeads.size, totalWaUniqueLeadsCount || waRepliedLeads.size);

        // Overall contacted and replied leads across all outreach channels
        const totalUniqueLeadsContacted = allContactedLeads.size;
        const allContactedWhoReplied = new Set<string>();
        allContactedLeads.forEach(k => {
            if (allRepliedLeads.has(k)) {
                allContactedWhoReplied.add(k);
            }
        });

        const totalLeadReplies = allContactedWhoReplied.size > 0
            ? allContactedWhoReplied.size
            : (activityEmailLeadRepliesCount + totalWaLeadReplies);

        const overallReplyRate = totalUniqueLeadsContacted > 0
            ? Math.min(100, (totalLeadReplies / totalUniqueLeadsContacted) * 100).toFixed(1)
            : "0.0";

        const dailyAcquisition = Array.from(dailyMap.entries())
            .map(([date, leads]) => ({ date, leads }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Compute eWorks Operations Metrics for the selected date range
        let eworksInvoiced = 0;
        let eworksActiveJobs = 0;
        let eworksPendingQuotes = 0;

        const eworksFilteredCustomers = allCustomers.filter(c => {
            const dateCandidates: (string | null | undefined)[] = [
                c.latest_job_start_date,
                c.latest_job_created_on,
                c.latest_job_completed_date,
                c.latest_job_updated_on,
                c.latest_quote_date,
                c.latest_pending_quote_date,
                c.latest_converted_quote_date,
                c.latest_amc_quote_date,
                c.latest_invoice_date,
                c.latest_unpaid_invoice_date,
                c.latest_overdue_invoice_date,
                c.latest_paid_invoice_date,
                c.last_service_date,
                c.last_contacted_at,
                c.eworks_created_on,
                c.eworks_last_updated_on,
                c.created_at
            ];

            const validDates = dateCandidates
                .map(dStr => dStr ? new Date(dStr) : null)
                .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

            if (validDates.length === 0) return false;
            return validDates.some(d => d >= fromDate && d <= toDate);
        });

        eworksFilteredCustomers.forEach(c => {
            eworksInvoiced += Number(c.total_invoiced_value || 0);
            eworksActiveJobs += Number(c.active_job_count || 0);
            eworksPendingQuotes += Number(c.pending_quote_count || 0);
        });

        const metrics: MasterMetrics = {
            totalLeads,
            allTimeTotalLeads: allCustomers.length,
            oldestLeadDate,
            totalWaReachouts,
            totalWaReplies: totalWaLeadReplies,
            totalVoiceCalls: activityVoiceCount,
            ownerVoiceCalls: 0,
            normalVapiCost: 0,
            ownerVapiCost: 0,
            leadsDaily: dailyAcquisition,
            dailyAcquisition,
            ownerWaReachouts: 0,
            ownerWaReplies: 0,
            activityEmailCount,
            activityEmailSentCount: activityEmailCount,
            activityEmailUniqueLeadsCount,
            activityEmailLeadRepliesCount,
            activityEmailReplyRate,
            totalWaUniqueLeadsCount,
            totalWaLeadReplies,
            totalUniqueLeadsContacted,
            totalLeadReplies,
            overallReplyRate,
            activityWaCount,
            activityVoiceCount,
            activitySmsCount,
            activityRepliesCount: totalLeadReplies,
            activityTotalCount: activityEmailCount + totalWaReachouts + activityVoiceCount + activitySmsCount,
            eworksInvoiced,
            eworksActiveJobs,
            eworksPendingQuotes,
        };

        return NextResponse.json(metrics, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
    } catch (error: any) {
        console.error('Error in master metrics route:', error);
        return NextResponse.json({
            totalLeads: 0,
            oldestLeadDate: null,
            totalWaReachouts: 0,
            totalWaReplies: 0,
            totalVoiceCalls: 0,
            ownerVoiceCalls: 0,
            normalVapiCost: 0,
            ownerVapiCost: 0,
            leadsDaily: [],
            dailyAcquisition: [],
            ownerWaReachouts: 0,
            ownerWaReplies: 0,
            activityEmailCount: 0,
            activityWaCount: 0,
            activityVoiceCount: 0,
            activitySmsCount: 0,
            activityRepliesCount: 0,
            activityTotalCount: 0,
        }, { status: 500 });
    }
}
