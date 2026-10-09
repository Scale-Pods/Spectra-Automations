import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchMessages } from '@/lib/messages-data';

export const dynamic = 'force-dynamic';

export interface WhatsappMetrics {
    totalReachouts: number;
    totalReplies: number;
    replyRate: number;
    dailyTrend: { date: string; reachouts: number; replies: number }[];
    ownerReachouts: number;
    ownerReplies: number;
}

export async function GET(request: NextRequest) {
    try {
        // Fetch WhatsApp messages from public.messages table
        const { messages } = await fetchMessages({
            channel: 'WHATSAPP',
            limit: 1000
        });

        // Also fetch customer table for fallback/supplement
        const { data: customers } = await supabaseAdmin
            .from('customers')
            .select('*');

        let totalReachouts = 0;
        let totalReplies = 0;
        const dailyMap: Record<string, { reachouts: number; replies: number }> = {};

        // 1. Process public.messages
        messages.forEach(m => {
            const dt = m.sent_or_received_at || m.created_at;
            const dayKey = dt ? new Date(dt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
            if (!dailyMap[dayKey]) dailyMap[dayKey] = { reachouts: 0, replies: 0 };

            if (m.direction === 'INBOUND' || (m.status && m.status.toLowerCase().includes('reply'))) {
                totalReplies++;
                dailyMap[dayKey].replies++;
            } else {
                totalReachouts++;
                dailyMap[dayKey].reachouts++;
            }
        });

        // 2. Supplement from customers table if messages table count is small
        if (totalReachouts === 0 && customers && customers.length > 0) {
            customers.forEach(c => {
                const hasReachout = c.WA_text || c.whatsapp_1 || c.whatsapp_2;
                const isReplied = c.WA_replied && String(c.WA_replied).toLowerCase() !== 'no';

                if (hasReachout) totalReachouts++;
                if (isReplied) totalReplies++;

                const dt = c.last_contacted_at || c.created_at || c.eworks_created_on;
                if (dt) {
                    const dayKey = new Date(dt).toISOString().slice(0, 10);
                    if (!dailyMap[dayKey]) dailyMap[dayKey] = { reachouts: 0, replies: 0 };
                    if (hasReachout) dailyMap[dayKey].reachouts++;
                    if (isReplied) dailyMap[dayKey].replies++;
                }
            });
        }

        const dailyTrend = Object.entries(dailyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, vals]) => ({ date, ...vals }));

        const replyRate = totalReachouts > 0 ? Math.round((totalReplies / totalReachouts) * 100) / 100 : 0;

        return NextResponse.json({
            totalReachouts: totalReachouts,
            totalReplies,
            replyRate,
            dailyTrend,
            ownerReachouts: 0,
            ownerReplies: 0,
        } satisfies WhatsappMetrics, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
    } catch (error) {
        console.error('Error in whatsapp metrics route:', error);
        const empty: WhatsappMetrics = {
            totalReachouts: 0, totalReplies: 0, replyRate: 0,
            dailyTrend: [], ownerReachouts: 0, ownerReplies: 0,
        };
        return NextResponse.json(empty, { status: 500 });
    }
}