import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchMessages, parseRawPayload } from '@/lib/messages-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('start_date');
        const to = searchParams.get('end_date');

        // Fetch all email messages from public.messages
        const { messages } = await fetchMessages({
            channel: 'EMAIL',
            limit: 1000
        });

        // Also fetch customer email columns as fallback/supplement
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('id, created_at, eworks_created_on, email_1, email_2, email_reply, email_unsubscribed');

        let totalSent = 0;
        let totalReplies = 0;
        let totalUnsubscribed = 0;
        const dailyMap: Record<string, { date: string; sent: number; replies: number }> = {};

        // 1. Process public.messages
        messages.forEach(m => {
            const dateStr = m.sent_or_received_at || m.created_at;
            const dateKey = dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = { date: dateKey, sent: 0, replies: 0 };
            }

            if (m.direction === 'INBOUND' || (m.status && m.status.toLowerCase().includes('reply'))) {
                totalReplies++;
                dailyMap[dateKey].replies++;
            } else {
                totalSent++;
                dailyMap[dateKey].sent++;
            }

            const raw = parseRawPayload(m.raw_payload);
            if (raw.email_unsubscribed === true || raw.unsubscribed === true) {
                totalUnsubscribed++;
            }
        });

        // 2. Supplement from customers table if messages table count is small
        if (totalSent === 0 && customerRows && customerRows.length > 0) {
            customerRows.forEach((c: any) => {
                ['email_1', 'email_2'].forEach(col => {
                    if (c[col] && String(c[col]).trim() !== '') {
                        totalSent++;
                        const dateStr = c.created_at || c.eworks_created_on;
                        if (dateStr) {
                            const dateKey = new Date(dateStr).toISOString().split('T')[0];
                            if (!dailyMap[dateKey]) dailyMap[dateKey] = { date: dateKey, sent: 0, replies: 0 };
                            dailyMap[dateKey].sent++;
                        }
                    }
                });

                if (c.email_reply && String(c.email_reply).trim() !== '' && String(c.email_reply).toLowerCase() !== 'no') {
                    totalReplies++;
                }
                if (c.email_unsubscribed === true) {
                    totalUnsubscribed++;
                }
            });
        }

        const dailyHistory = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

        const tableStats = {
            messages: { name: 'Authoritative Email Messages', totalSent, totalReplies, totalUnsubscribed }
        };

        return NextResponse.json({
            totalSent: totalSent,
            totalReplies,
            totalUnsubscribed,
            tableStats,
            dailyHistory,
            messages
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
    } catch (error: any) {
        console.error('Email Analytics API Route Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
