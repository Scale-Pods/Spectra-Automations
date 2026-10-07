import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export interface WhatsappMetrics {
    totalReachouts: number;
    totalReplies: number;
    replyRate: number;
    dailyTrend: { date: string; reachouts: number; replies: number }[];
    ownerReachouts: number;
    ownerReplies: number;
}

function checkIsNonEmpty(val: any): boolean {
    if (val === null || val === undefined) return false;
    const str = String(val).trim();
    return str !== '' && str !== '[]' && str !== 'null' && str !== 'undefined';
}

function checkIsReplied(val: any): boolean {
    if (val === null || val === undefined) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    const str = String(val).trim().toLowerCase();
    return str !== '' && str !== '[]' && str !== 'no' && str !== 'false' && str !== 'null' && str !== 'undefined';
}

export async function GET(request: NextRequest) {
    try {
        const { data: customers } = await supabaseAdmin
            .from('customers')
            .select('*');

        let totalReachouts = 0;
        let totalReplies = 0;
        const dailyMap: Record<string, { reachouts: number; replies: number }> = {};

        (customers || []).forEach(c => {
            const hasReachout = checkIsNonEmpty(c.WA_text) || checkIsNonEmpty(c.whatsapp_1) || checkIsNonEmpty(c.whatsapp_2) || checkIsNonEmpty(c.whatsapp_3) || checkIsNonEmpty(c.whatsapp_4);
            const isReplied = checkIsReplied(c.WA_replied);

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

        const dailyTrend = Object.entries(dailyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, vals]) => ({ date, ...vals }));

        const replyRate = totalReachouts > 0 ? Math.round((totalReplies / totalReachouts) * 100) / 100 : 0;

        return NextResponse.json({
            totalReachouts,
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