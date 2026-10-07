import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        // Fetch customers with phone numbers
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        const customers = customerRows || [];

        const smsLeads = customers.map((c: any) => {
            const name = c.full_name || c.customer_name || 'Customer';
            const phone = c.phone_e164 || c.mobile_raw || c.telephone_raw || '';
            return {
                id: c.id,
                Name: name,
                name: name,
                Phone: phone,
                phone: phone,
                email: c.email || '',
                city: c.city || 'Dubai',
                created_at: c.created_at || c.eworks_created_on,
                _source_table: 'customers'
            };
        });

        // Query SMS messages from messages table
        let msgQuery = supabaseAdmin
            .from('messages')
            .select('*')
            .ilike('channel', 'sms')
            .order('created_at', { ascending: false });

        if (search) {
            msgQuery = msgQuery.or(`body_text.ilike.%${search}%,sender_address.ilike.%${search}%,recipient_address.ilike.%${search}%`);
        }

        const { data: smsMessages } = await msgQuery;

        const customerMap = new Map<string, any>();
        customers.forEach(c => customerMap.set(c.id, c));

        const smsActivity = (smsMessages || []).map((m: any) => {
            const cust = customerMap.get(m.customer_id) || {};
            const custName = cust.full_name || cust.customer_name || 'Customer';

            return {
                id: m.id,
                lead_name: custName,
                lead_phone: cust.phone_e164 || m.sender_address || m.recipient_address || '',
                lead_email: cust.email || '',
                content: m.body_text || m.subject || '',
                direction: m.direction || 'OUTBOUND',
                status: m.status || 'sent',
                created_at: m.sent_or_received_at || m.created_at,
                _source_table: 'messages'
            };
        });

        return NextResponse.json({
            sms_activity: smsActivity,
            sms_leads: smsLeads,
            total: smsActivity.length,
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
    } catch (error) {
        console.error('Error in sms-leads route:', error);
        return NextResponse.json({
            sms_activity: [],
            sms_leads: [],
            total: 0,
        }, { status: 500 });
    }
}

