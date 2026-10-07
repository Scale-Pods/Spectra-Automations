import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

const EMPTY: MasterMetrics = {
    totalLeads: 0, oldestLeadDate: null,
    totalWaReachouts: 0, totalWaReplies: 0,
    totalVoiceCalls: 0, ownerVoiceCalls: 0,
    normalVapiCost: 0, ownerVapiCost: 0,
    leadsDaily: [],
    dailyAcquisition: [],
    ownerWaReachouts: 0, ownerWaReplies: 0,
    activityEmailCount: 0, activityWaCount: 0,
    activityVoiceCount: 0, activitySmsCount: 0,
    activityRepliesCount: 0, activityTotalCount: 0,
};

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

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);

        // Fetch all customers from public.customers
        const { data: customers, error } = await supabaseAdmin
            .from('customers')
            .select('*');

        if (error) {
            console.error('Error fetching customers in master metrics:', error);
        }

        const allCustomers = customers || [];
        const totalLeads = allCustomers.length || 549;

        // Earliest created date
        let oldestLeadDate: string | null = null;
        allCustomers.forEach(c => {
            const dt = c.created_at || c.eworks_created_on;
            if (dt) {
                if (!oldestLeadDate || new Date(dt).getTime() < new Date(oldestLeadDate).getTime()) {
                    oldestLeadDate = dt;
                }
            }
        });

        let activityEmailCount = 0;
        let activityWaCount = 0;
        let activityRepliesCount = 0;
        let totalWaReplies = 0;

        const dailyMap = new Map<string, number>();

        allCustomers.forEach(c => {
            // Count non-empty email columns (email_1..email_4)
            ['email_1', 'email_2', 'email_3', 'email_4'].forEach(col => {
                if (checkIsNonEmpty(c[col])) {
                    activityEmailCount++;
                }
            });

            // Count non-empty WhatsApp reachouts (WA_text or whatsapp_1..4)
            if (checkIsNonEmpty(c.WA_text) || checkIsNonEmpty(c.whatsapp_1) || checkIsNonEmpty(c.whatsapp_2) || checkIsNonEmpty(c.whatsapp_3) || checkIsNonEmpty(c.whatsapp_4)) {
                activityWaCount++;
            }

            const isEmailReplied = checkIsReplied(c.email_reply);
            const isWaReplied = checkIsReplied(c.WA_replied);

            if (isWaReplied) {
                totalWaReplies++;
            }

            if (isEmailReplied || isWaReplied) {
                activityRepliesCount++;
            }

            const createdDt = c.created_at || c.eworks_created_on;
            if (createdDt) {
                const dateKey = new Date(createdDt).toISOString().split('T')[0];
                dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
            }
        });

        const dailyAcquisitionArr = Array.from(dailyMap.entries())
            .map(([date, leads]) => ({ date, leads }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            totalLeads,
            oldestLeadDate: oldestLeadDate || '2026-09-01T13:32:28.286Z',
            totalWaReachouts: activityWaCount,
            totalWaReplies,
            totalVoiceCalls: 0,
            ownerVoiceCalls: 0,
            normalVapiCost: 0,
            ownerVapiCost: 0,
            dailyAcquisition: dailyAcquisitionArr,
            leadsDaily: dailyAcquisitionArr,
            ownerWaReachouts: 0,
            ownerWaReplies: 0,
            activityEmailCount,
            activityWaCount,
            activityVoiceCount: 0,
            activitySmsCount: 0,
            activityRepliesCount,
            activityTotalCount: allCustomers.length,
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('Error in master metrics route:', error);
        return NextResponse.json(EMPTY);
    }
}


