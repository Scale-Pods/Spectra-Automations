import { NextRequest, NextResponse } from 'next/server';
import { fetchMessages, groupMessagesByRecipient } from '@/lib/messages-data';
import { supabaseAdmin } from '@/lib/supabase';
import { getCachedData, setCachedData } from '@/lib/cache-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const fromParam = searchParams.get('from') || searchParams.get('start_date');
        const toParam = searchParams.get('to') || searchParams.get('end_date');

        const fromDate = fromParam ? new Date(fromParam) : undefined;
        const toDate = toParam ? new Date(toParam) : undefined;

        const cacheKey = `wa-leads:${search || 'all'}:${fromDate?.toISOString() || 'none'}:${toDate?.toISOString() || 'none'}`;
        const cached = getCachedData<any>(cacheKey);
        if (cached) {
            return NextResponse.json(cached, {
                headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
            });
        }

        // Query messages for WHATSAPP channel with date range
        const { messages: rawMessages } = await fetchMessages({
            channel: 'WHATSAPP',
            search: search || undefined,
            from: fromDate,
            to: toDate,
            limit: 2000
        });

        const messages = rawMessages.filter(m => {
            if (!fromDate && !toDate) return true;
            const dt = m.sent_or_received_at || m.created_at;
            if (!dt) return false;
            const d = new Date(dt);
            if (isNaN(d.getTime())) return false;
            if (fromDate && d < fromDate) return false;
            if (toDate && d > toDate) return false;
            return true;
        });

        // Also query customers table to join customer data if available (select lean columns only)
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('id, full_name, customer_name, phone_e164, eworks_customer_id, email, city, address_line, total_job_count, total_invoiced_value, latest_quoted_service_category');

        const customersMap = new Map<string, any>();
        (customerRows || []).forEach(c => {
            if (c.id) customersMap.set(c.id, c);
            if (c.phone_e164) customersMap.set(c.phone_e164.replace(/\D/g, ''), c);
            if (c.eworks_customer_id) customersMap.set(String(c.eworks_customer_id), c);
        });

        // Group messages by recipient_address
        const leadSummaries = groupMessagesByRecipient(messages);

        const nr_wf: any[] = [];
        const followup: any[] = [];
        const nurture: any[] = [];
        const wa_activity: any[] = [];

        leadSummaries.forEach(lead => {
            const rawPhoneClean = String(lead.recipient_address || lead.lead_phone || '').replace(/\D/g, '');
            const matchedCust = lead.customer_id 
                ? customersMap.get(lead.customer_id) 
                : (lead.eworks_customer_id 
                    ? customersMap.get(String(lead.eworks_customer_id)) 
                    : (rawPhoneClean ? customersMap.get(rawPhoneClean) : null));
            
            const isReplied = lead.direction === 'INBOUND' || lead.messages.some(m => (m.direction || '').toUpperCase() === 'INBOUND');
            const createdIso = lead.latest_date || new Date().toISOString();

            const msgCustomerId = lead.customer_id || lead.messages.find(m => m.customer_id)?.customer_id || matchedCust?.id || null;

            const leadObj = {
                ...matchedCust,
                id: msgCustomerId || lead.recipient_address,
                customer_id: msgCustomerId,
                conversation_id: lead.conversation_id,
                eworks_customer_id: lead.eworks_customer_id || matchedCust?.eworks_customer_id || null,
                recipient_address: lead.recipient_address, // Unique constraint
                Name: matchedCust?.full_name || matchedCust?.customer_name || lead.lead_name || lead.recipient_address,
                name: matchedCust?.full_name || matchedCust?.customer_name || lead.lead_name || lead.recipient_address,
                full_name: matchedCust?.full_name || matchedCust?.customer_name || lead.lead_name || lead.recipient_address,
                Phone: lead.lead_phone || matchedCust?.phone_e164 || lead.recipient_address,
                phone: lead.lead_phone || matchedCust?.phone_e164 || lead.recipient_address,
                phone_e164: lead.lead_phone || matchedCust?.phone_e164 || lead.recipient_address,
                Email: matchedCust?.email || '',
                email: matchedCust?.email || '',
                city: matchedCust?.city || 'Dubai',
                address: matchedCust?.address_line || '',
                "W.P_1": lead.latest_body || "Outreach WhatsApp Message",
                "W.P_2": lead.messages[1]?.body_text || "",
                "W.P_3": lead.messages[2]?.body_text || "",
                "1st_wa_ts": createdIso,
                wp1_parsed_date: createdIso,
                latest_date: createdIso,
                latest_wp_date: createdIso,
                created_at: createdIso,
                sent_or_received_at: createdIso,
                updated_at: createdIso,
                WP_Replied_track: isReplied ? "Replied" : "",
                replied: isReplied ? "yes" : "no",
                whatsapp_replied: isReplied ? "yes" : "",
                whatsapp_count: lead.message_count,
                sequence_channel: 'WHATSAPP',
                sequence_step: lead.message_count,
                total_job_count: matchedCust?.total_job_count || 0,
                total_invoiced_value: matchedCust?.total_invoiced_value || 0,
                category: matchedCust?.latest_quoted_service_category || 'General Service',
                raw_payload: lead.raw_payload_parsed,
                messages: lead.messages,
                _source_table: 'messages'
            };

            wa_activity.push(leadObj);

            if (isReplied) {
                followup.push(leadObj);
            } else if (lead.message_count > 0) {
                nr_wf.push(leadObj);
            } else {
                nurture.push(leadObj);
            }
        });

        const responsePayload = {
            nr_wf,
            followup,
            nurture,
            owners: [],
            wa_activity,
            messages
        };

        setCachedData(cacheKey, responsePayload);

        return NextResponse.json(responsePayload, {
            headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
        });
    } catch (error: any) {
        console.error('Error in whatsapp-leads API route:', error);
        return NextResponse.json({
            nr_wf: [],
            followup: [],
            nurture: [],
            owners: [],
            wa_activity: [],
            messages: []
        }, { status: 500 });
    }
}