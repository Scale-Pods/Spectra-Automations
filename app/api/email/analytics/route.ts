import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function checkIsNonEmpty(val: any): boolean {
    if (val === null || val === undefined) return false;
    const str = String(val).trim();
    return str !== '' && str !== '[]' && str !== 'null' && str !== 'undefined';
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('start_date');
        const to = searchParams.get('end_date');

        // Check customers table for email columns
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('id, created_at, eworks_created_on, email_1, email_1_status, email_2, email_2_status, email_3, email_3_status, email_4, email_4_status, email_reply, email_unsubscribed');

        let totalSent = 0;
        let totalReplies = 0;
        let totalUnsubscribed = 0;
        const dailyMap: Record<string, { date: string; sent: number; replies: number }> = {};

        function checkIsReplied(val: any): boolean {
            if (val === null || val === undefined) return false;
            if (Array.isArray(val)) return val.length > 0;
            if (typeof val === 'object') return Object.keys(val).length > 0;
            const str = String(val).trim().toLowerCase();
            return str !== '' && str !== '[]' && str !== 'no' && str !== 'false' && str !== 'null' && str !== 'undefined';
        }

        (customerRows || []).forEach((c: any) => {
            ['email_1', 'email_2', 'email_3', 'email_4'].forEach(col => {
                if (checkIsNonEmpty(c[col])) {
                    totalSent++;
                    const dateStr = c.created_at || c.eworks_created_on;
                    if (dateStr) {
                        const dateKey = new Date(dateStr).toISOString().split('T')[0];
                        if (!dailyMap[dateKey]) {
                            dailyMap[dateKey] = { date: dateKey, sent: 0, replies: 0 };
                        }
                        dailyMap[dateKey].sent++;
                    }
                }
            });

            if (checkIsReplied(c.email_reply)) {
                totalReplies++;
                const dateStr = c.created_at || c.eworks_created_on;
                if (dateStr) {
                    const dateKey = new Date(dateStr).toISOString().split('T')[0];
                    if (!dailyMap[dateKey]) {
                        dailyMap[dateKey] = { date: dateKey, sent: 0, replies: 0 };
                    }
                    dailyMap[dateKey].replies++;
                }
            }

            if (c.email_unsubscribed === true) {
                totalUnsubscribed++;
            }
        });

        const dailyHistory = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

        const tableStats = {
            customers: { name: 'Live Customer Emails', totalSent, totalReplies, totalUnsubscribed }
        };

        return NextResponse.json({
            totalSent,
            totalReplies,
            totalUnsubscribed,
            tableStats,
            dailyHistory,
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });

    } catch (error: any) {
        console.error('Analytics API Route Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}


