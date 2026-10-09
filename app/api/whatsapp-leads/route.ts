import { NextRequest, NextResponse } from 'next/server';
import { fetchMessages, groupMessagesByRecipient } from '@/lib/messages-data';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        // Query messages for WHATSAPP channel
        const { messages } = await fetchMessages({
            channel: 'WHATSAPP',
            search: search || undefined,
            limit: 500
        });

        // Also query customers table to join customer data if available
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('*');

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
            const matchedCust = lead.customer_id ? customersMap.get(lead.customer_id) : (lead.eworks_customer_id ? customersMap.get(String(lead.eworks_customer_id)) : null);
            
            const isReplied = lead.direction === 'INBOUND' || lead.messages.some(m => m.direction === 'INBOUND');
            const createdIso = lead.latest_date || new Date().toISOString();

            const leadObj = {
                ...matchedCust,
                id: lead.customer_id || lead.recipient_address,
                conversation_id: lead.conversation_id,
                eworks_customer_id: lead.eworks_customer_id || matchedCust?.eworks_customer_id || null,
                recipient_address: lead.recipient_address, // Unique constraint
                Name: matchedCust?.full_name || matchedCust?.customer_name || lead.lead_name,
                name: matchedCust?.full_name || matchedCust?.customer_name || lead.lead_name,
                full_name: matchedCust?.full_name || matchedCust?.customer_name || lead.lead_name,
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

        return NextResponse.json({
            nr_wf,
            followup,
            nurture,
            owners: [],
            wa_activity,
            messages
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
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