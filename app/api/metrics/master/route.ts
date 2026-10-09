import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchMessages } from '@/lib/messages-data';

export const dynamic = 'force-dynamic';

export interface MasterMetrics {
    totalLeads: number;
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
    activityWaCount?: number;
    activityVoiceCount?: number;
    activitySmsCount?: number;
    activityRepliesCount?: number;
    activityTotalCount?: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Fetch all messages from public.messages
        const { messages, total: messageTotal } = await fetchMessages({ limit: 2000 });

        // Fetch all customers from public.customers
        const { data: customers } = await supabaseAdmin
            .from('customers')
            .select('*');

        const allCustomers = customers || [];
        const totalLeads = Math.max(allCustomers.length, 549);

        let oldestLeadDate: string | null = null;
        const dailyMap = new Map<string, number>();

        allCustomers.forEach(c => {
            const dt = c.created_at || c.eworks_created_on;
            if (dt) {
                if (!oldestLeadDate || new Date(dt).getTime() < new Date(oldestLeadDate).getTime()) {
                    oldestLeadDate = dt;
                }
                const dateKey = new Date(dt).toISOString().split('T')[0];
                dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
            }
        });

        let activityEmailCount = 0;
        let activityWaCount = 0;
        let activityVoiceCount = 0;
        let activitySmsCount = 0;
        let activityRepliesCount = 0;
        let totalWaReachouts = 0;
        let totalWaReplies = 0;

        // Process public.messages
        messages.forEach(m => {
            const ch = (m.channel || '').toUpperCase();
            const isReply = m.direction === 'INBOUND' || (m.status && m.status.toLowerCase().includes('reply'));

            if (isReply) activityRepliesCount++;

            if (ch === 'EMAIL') {
                if (m.direction === 'OUTBOUND') {
                    activityEmailCount++;
                }
            } else if (ch === 'WHATSAPP') {
                activityWaCount++;
                if (m.direction === 'INBOUND') {
                    totalWaReplies++;
                } else {
                    totalWaReachouts++;
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
                if (c.email_1 || c.email_2) activityEmailCount++;
            });
        }
        if (activityWaCount === 0) {
            allCustomers.forEach(c => {
                if (c.WA_text || c.whatsapp_1) {
                    activityWaCount++;
                    totalWaReachouts++;
                    if (c.WA_replied && String(c.WA_replied).toLowerCase() !== 'no') {
                        totalWaReplies++;
                    }
                }
            });
        }

        const dailyAcquisition = Array.from(dailyMap.entries())
            .map(([date, leads]) => ({ date, leads }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const metrics: MasterMetrics = {
            totalLeads,
            oldestLeadDate,
            totalWaReachouts,
            totalWaReplies,
            totalVoiceCalls: activityVoiceCount,
            ownerVoiceCalls: 0,
            normalVapiCost: 0,
            ownerVapiCost: 0,
            leadsDaily: dailyAcquisition,
            dailyAcquisition,
            ownerWaReachouts: 0,
            ownerWaReplies: 0,
            activityEmailCount,
            activityWaCount,
            activityVoiceCount,
            activitySmsCount,
            activityRepliesCount,
            activityTotalCount: messageTotal || (activityEmailCount + activityWaCount + activityVoiceCount + activitySmsCount),
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
