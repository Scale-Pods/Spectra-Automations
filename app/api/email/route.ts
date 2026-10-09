import { NextRequest, NextResponse } from 'next/server';
import { fetchMessages, groupMessagesByRecipient } from '@/lib/messages-data';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        // Query messages for EMAIL channel
        const { messages } = await fetchMessages({
            channel: 'EMAIL',
            search: search || undefined,
            limit: 500
        });

        // Query customers table to join customer data if available
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('*');

        const customersMap = new Map<string, any>();
        (customerRows || []).forEach(c => {
            if (c.id) customersMap.set(c.id, c);
            if (c.email) customersMap.set(c.email.toLowerCase(), c);
            if (c.eworks_customer_id) customersMap.set(String(c.eworks_customer_id), c);
        });

        // Group messages by recipient_address constraint
        const leadSummaries = groupMessagesByRecipient(messages);

        const emailLeads = leadSummaries.map(lead => {
            const matchedCust = lead.customer_id ? customersMap.get(lead.customer_id) : (lead.lead_email ? customersMap.get(lead.lead_email.toLowerCase()) : (lead.eworks_customer_id ? customersMap.get(String(lead.eworks_customer_id)) : null));
            const isReplied = lead.direction === 'INBOUND' || lead.messages.some(m => m.direction === 'INBOUND');

            return {
                ...matchedCust,
                id: lead.customer_id || lead.recipient_address,
                conversation_id: lead.conversation_id,
                eworks_customer_id: lead.eworks_customer_id || matchedCust?.eworks_customer_id || null,
                recipient_address: lead.recipient_address, // Unique constraint
                Name: matchedCust?.full_name || matchedCust?.customer_name || lead.lead_name,
                name: matchedCust?.full_name || matchedCust?.customer_name || lead.lead_name,
                full_name: matchedCust?.full_name || matchedCust?.customer_name || lead.lead_name,
                Email: lead.recipient_address || matchedCust?.email || '',
                email: lead.recipient_address || matchedCust?.email || '',
                Phone: matchedCust?.phone_e164 || '',
                phone: matchedCust?.phone_e164 || '',
                subject: lead.latest_subject || 'Email Communication',
                body_text: lead.latest_body || '',
                body_html: lead.messages[lead.messages.length - 1]?.body_html || null,
                replied: isReplied ? 'yes' : 'no',
                message_count: lead.message_count,
                raw_payload: lead.raw_payload_parsed,
                messages: lead.messages,
                created_at: lead.latest_date,
                _source_table: 'messages'
            };
        });

        return NextResponse.json({
            email_leads: emailLeads,
            total: emailLeads.length,
            messages
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
    } catch (error: any) {
        console.error('Error in email API route:', error);
        return NextResponse.json({
            email_leads: [],
            total: 0,
            messages: [],
            error: error.message
        }, { status: 500 });
    }
}
