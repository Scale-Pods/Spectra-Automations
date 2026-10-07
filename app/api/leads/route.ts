import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        // Fetch customers from live public.customers table
        let query = supabaseAdmin
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (from) {
            query = query.gte('created_at', from);
        }
        if (to) {
            query = query.lte('created_at', to);
        }

        const { data: customerRows, error: custError } = await query;

        let allCustomers = customerRows || [];
        
        // If date filter was too narrow and yielded 0 records, fetch top 500 customers
        if (allCustomers.length === 0) {
            const { data: fallbackCustomers } = await supabaseAdmin
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);
            allCustomers = fallbackCustomers || [];
        }

        // Map customers into master_leads, nr_wf, followup, nurture
        const mappedLeads = allCustomers.map((c: any) => {
            const name = c.full_name || c.customer_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Customer';
            const phone = c.phone_e164 || c.mobile_raw || c.telephone_raw || '';
            const rVal = String(c.WA_replied || '').trim().toLowerCase();
            const isWaReplied = rVal !== '' && rVal !== 'no' && rVal !== 'false' && rVal !== 'null' && rVal !== 'undefined';

            return {
                ...c, // Spread ALL database row columns (WA_text, WA_sentiment, WA_note, quotes, jobs, etc.)
                id: c.id,
                eworks_customer_id: c.eworks_customer_id,
                Name: name,
                name: name,
                full_name: name,
                Email: c.email || '',
                email: c.email || '',
                Phone: phone,
                phone: phone,
                phone_e164: phone,
                city: c.city || 'Dubai',
                address: c.address_line || '',
                notes: c.notes || '',
                created_at: c.created_at || c.eworks_created_on || new Date().toISOString(),
                sequence_channel: c.sequence_channel || 'WHATSAPP',
                sequence_step: c.sequence_step || 1,
                WA_replied: c.WA_replied || 'NO',
                WP_Replied_track: isWaReplied ? (c.WA_replied || 'Replied') : '',
                replied: isWaReplied ? (c.WA_replied || 'yes') : 'no',
                whatsapp_count: (c.whatsapp_1 || c.whatsapp_2 || c.WA_text) ? 1 : 0,
                email_count: (c.email_1 || c.email_2) ? 1 : 0,
                "W.P_1": c.WA_text || c.whatsapp_1 || "Outreach WhatsApp Message",
                "W.P_2": c.whatsapp_2 || "",
                "1st_wa_ts": c.created_at || c.eworks_created_on,
                total_job_count: c.total_job_count || 0,
                total_invoiced_value: c.total_invoiced_value || 0,
                category: c.latest_quoted_service_category || 'General Service',
                _source_table: 'customers'
            };
        });

        // Filter into lists
        const masterLeads = mappedLeads;
        const nrWf = mappedLeads.filter(l => l.Phone || l.email);
        const followup = mappedLeads.filter(l => checkIsReplied(l.WA_replied || l.WP_Replied_track) || l.total_job_count > 0);
        const nurture = mappedLeads.filter(l => !checkIsReplied(l.WA_replied || l.WP_Replied_track) && l.total_job_count === 0);

        function checkIsReplied(val: any): boolean {
            if (!val) return false;
            const str = String(val).trim().toLowerCase();
            return str !== '' && str !== 'no' && str !== 'false' && str !== 'null' && str !== 'undefined';
        }


        return NextResponse.json({
            nr_wf: nrWf,
            followup: followup,
            nurture: nurture,
            master_leads: masterLeads,
            activity_leads: [],
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
    } catch (error: any) {
        console.error('Error in leads route:', error);
        return NextResponse.json(
            { nr_wf: [], followup: [], nurture: [], master_leads: [], activity_leads: [] },
            { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
        );
    }
}

