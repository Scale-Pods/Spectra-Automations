import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function parseWADateToISO(raw: any): string | null {
    if (!raw) return null;
    if (typeof raw === 'number') return new Date(raw).toISOString();
    const s = String(raw).trim();
    if (!s) return null;

    const ddmmyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (ddmmyyyy) {
        const day = ddmmyyyy[1].padStart(2, '0');
        const month = ddmmyyyy[2].padStart(2, '0');
        const year = ddmmyyyy[3];
        const hh = (ddmmyyyy[4] || '00').padStart(2, '0');
        const mm = (ddmmyyyy[5] || '00').padStart(2, '0');
        const ss = (ddmmyyyy[6] || '00').padStart(2, '0');
        const d = new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}.000Z`);
        if (!isNaN(d.getTime())) return d.toISOString();
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        // Fetch WhatsApp-eligible customers
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        const customers = customerRows || [];

        const nr_wf: any[] = [];
        const followup: any[] = [];
        const nurture: any[] = [];
        const owners: any[] = [];

        function checkIsReplied(val: any): boolean {
            if (!val) return false;
            const str = String(val).trim().toLowerCase();
            return str !== '' && str !== 'no' && str !== 'false' && str !== 'null' && str !== 'undefined';
        }

        customers.forEach((row: any) => {
            const phone = row.phone_e164 || row.mobile_raw || row.telephone_raw || '';
            const name = row.full_name || row.customer_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'WhatsApp Lead';
            const isWpReplied = checkIsReplied(row.WA_replied);
            const createdIso = row.created_at || row.eworks_created_on || new Date().toISOString();

            const hasWaMsg = !!(row.WA_text || row.whatsapp_1 || row.whatsapp_2 || row.whatsapp_3 || row.whatsapp_4);
            const leadObj = {
                ...row, // Preserve ALL database row properties (WA_text, WA_sentiment, WA_note, quotes, jobs, etc.)
                _source_table: 'customers',
                id: row.id,
                Name: name,
                name: name,
                full_name: name,
                Phone: phone,
                phone: phone,
                phone_e164: phone,
                Email: row.email || '',
                email: row.email || '',
                city: row.city || 'Dubai',
                "W.P_1": row.WA_text || row.whatsapp_1 || "",
                "W.P_2": row.whatsapp_2 || "",
                "W.P_3": row.whatsapp_3 || "",
                "1st_wa_ts": hasWaMsg ? createdIso : null,
                wp1_parsed_date: hasWaMsg ? createdIso : null,
                WP_Replied_track: isWpReplied ? (row.WA_replied || "Replied") : "",
                replied: isWpReplied ? (row.WA_replied || "yes") : "no",
                whatsapp_replied: isWpReplied ? (row.WA_replied || "yes") : "",
                whatsapp_count: hasWaMsg ? 1 : 0,
                sequence_channel: row.sequence_channel || 'WHATSAPP',
                sequence_step: row.sequence_step || 1,
                total_job_count: row.total_job_count || 0,
                total_invoiced_value: row.total_invoiced_value || 0,
                category: row.latest_quoted_service_category || 'General Service',
            };

            if (isWpReplied || row.total_job_count > 0) {
                followup.push(leadObj);
            } else if (hasWaMsg) {
                nr_wf.push(leadObj);
            } else {
                nurture.push(leadObj);
            }
        });


        return NextResponse.json({
            nr_wf: nr_wf.length > 0 ? nr_wf : (followup.length > 0 ? followup : nurture),
            followup,
            nurture,
            owners,
            wa_activity: [],
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
    } catch (error) {
        console.error('Error in whatsapp-leads route:', error);
        return NextResponse.json({
            nr_wf: [], followup: [], nurture: [], owners: [], wa_activity: [],
        }, { status: 500 });
    }
}