import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchMessages, parseRawPayload } from '@/lib/messages-data';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';
import { getCachedData, setCachedData } from '@/lib/cache-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fromParam = searchParams.get('start_date') || searchParams.get('from');
        const toParam = searchParams.get('end_date') || searchParams.get('to');

        const now = new Date();
        const fromDate = fromParam ? startOfDay(new Date(fromParam)) : startOfDay(subDays(now, 7));
        const toDate = toParam ? endOfDay(new Date(toParam)) : endOfDay(now);

        const cacheKey = `email-analytics:${fromDate.toISOString()}:${toDate.toISOString()}`;
        const cached = getCachedData<any>(cacheKey);
        if (cached) {
            return NextResponse.json(cached, {
                headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
            });
        }

        // 1. Try Supabase Postgres RPC first
        try {
            const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_email_dashboard_metrics', {
                p_from: fromDate.toISOString(),
                p_to: toDate.toISOString()
            });
            if (!rpcError && rpcData && typeof rpcData === 'object' && 'totalEmailSent' in rpcData) {
                setCachedData(cacheKey, rpcData);
                return NextResponse.json(rpcData, {
                    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
                });
            }
        } catch {
            // Fall through to fallback
        }

        // Fetch email messages from public.messages within date range
        const { messages: rawMessages } = await fetchMessages({
            channel: 'EMAIL',
            from: fromDate,
            to: toDate,
            limit: 2000
        });

        // Filter strictly within date range
        const messages = rawMessages.filter(m => {
            const dt = m.sent_or_received_at || m.created_at;
            if (!dt) return false;
            const d = new Date(dt);
            return !isNaN(d.getTime()) && d >= fromDate && d <= toDate;
        });

        // Also fetch customer email columns as fallback/supplement
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('id, created_at, eworks_created_on, email_1, email_2, email_reply, email_unsubscribed');

        let totalSent = 0;
        let totalReplies = 0;
        let totalUnsubscribed = 0;
        const contactedLeads = new Set<string>();
        const repliedLeads = new Set<string>();
        const contactedWhoReplied = new Set<string>();

        // Initialize dailyMap for every day in the selected interval
        const dailyMap: Record<string, { date: string; sent: number; replies: number }> = {};
        try {
            const days = eachDayOfInterval({ start: fromDate, end: toDate });
            days.forEach(d => {
                const dateKey = format(d, 'yyyy-MM-dd');
                dailyMap[dateKey] = { date: dateKey, sent: 0, replies: 0 };
            });
        } catch {
            // In case interval is reversed or invalid, fallback to empty object
        }

        // 1. Process public.messages
        messages.forEach(m => {
            const dateStr = m.sent_or_received_at || m.created_at;
            const dateKey = dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';

            if (dateKey && !dailyMap[dateKey]) {
                dailyMap[dateKey] = { date: dateKey, sent: 0, replies: 0 };
            }

            const isReply = m.direction === 'INBOUND' || (m.status && m.status.toLowerCase().includes('reply'));
            const leadKey = m.customer_id || (isReply ? m.sender_address : m.recipient_address);

            if (isReply) {
                totalReplies++;
                if (dateKey) dailyMap[dateKey].replies++;
                if (leadKey) repliedLeads.add(leadKey);
            } else {
                totalSent++;
                if (dateKey) dailyMap[dateKey].sent++;
                if (leadKey) contactedLeads.add(leadKey);
            }

            const raw = parseRawPayload(m.raw_payload);
            if (raw.email_unsubscribed === true || raw.unsubscribed === true) {
                totalUnsubscribed++;
            }
        });

        // Track contacted leads who replied
        contactedLeads.forEach(id => {
            if (repliedLeads.has(id)) {
                contactedWhoReplied.add(id);
            }
        });

        // 2. Supplement from customers table if messages table count is small
        if (totalSent === 0 && customerRows && customerRows.length > 0) {
            customerRows.forEach((c: any) => {
                const dateStr = c.created_at || c.eworks_created_on;
                if (!dateStr) return;
                const d = new Date(dateStr);
                if (isNaN(d.getTime()) || d < fromDate || d > toDate) return;

                let sentCount = 0;
                ['email_1', 'email_2'].forEach(col => {
                    if (c[col] && String(c[col]).trim() !== '') {
                        sentCount++;
                        totalSent++;
                        const dateKey = d.toISOString().split('T')[0];
                        if (!dailyMap[dateKey]) dailyMap[dateKey] = { date: dateKey, sent: 0, replies: 0 };
                        dailyMap[dateKey].sent++;
                    }
                });

                if (sentCount > 0) {
                    contactedLeads.add(c.id);
                }

                if (c.email_reply && String(c.email_reply).trim() !== '' && String(c.email_reply).toLowerCase() !== 'no') {
                    totalReplies++;
                    repliedLeads.add(c.id);
                    if (sentCount > 0) {
                        contactedWhoReplied.add(c.id);
                    }
                }
                if (c.email_unsubscribed === true) {
                    totalUnsubscribed++;
                }
            });
        }

        const totalUniqueLeadContacted = contactedLeads.size;
        const totalLeadReplies = contactedWhoReplied.size > 0
            ? contactedWhoReplied.size
            : Math.min(repliedLeads.size, totalUniqueLeadContacted || repliedLeads.size);
        const replyRate = totalUniqueLeadContacted > 0
            ? Math.min(100, (totalLeadReplies / totalUniqueLeadContacted) * 100).toFixed(1)
            : "0.0";

        const dailyHistory = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

        const tableStats = {
            messages: {
                name: 'Authoritative Email Messages',
                totalEmailSent: totalSent,
                totalSent,
                totalUniqueLeadContacted,
                totalLeadReplies,
                totalReplies,
                totalUnsubscribed
            }
        };

        const responsePayload = {
            totalEmailSent: totalSent,
            totalSent: totalSent,
            totalUniqueLeadContacted,
            totalLeadReplies,
            replyRate,
            responseRate: replyRate,
            totalReplies,
            totalUnsubscribed,
            tableStats,
            dailyHistory,
            messages
        };

        setCachedData(cacheKey, responsePayload);

        return NextResponse.json(responsePayload, {
            headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
        });
    } catch (error: any) {
        console.error('Email Analytics API Route Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
