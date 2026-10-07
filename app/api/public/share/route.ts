import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const channel = searchParams.get('channel') || '';
        const phone = searchParams.get('phone') || '';
        const email = searchParams.get('email') || '';

        if (!channel || (!phone && !email)) {
            return NextResponse.json(
                { error: 'Missing required params: channel and phone or email' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        // Query customers for lookup
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('*');

        const customers = customerRows || [];
        const customerMap = new Map<string, any>();
        customers.forEach(c => customerMap.set(c.id, c));

        // Find customer if matching phone/email
        let matchedCustomer = customers.find(c => {
            if (phone) {
                const cleanInput = phone.replace(/\D/g, '').slice(-10);
                const cleanCPhone = (c.phone_e164 || c.mobile_raw || '').replace(/\D/g, '');
                if (cleanInput && cleanCPhone.includes(cleanInput)) return true;
            }
            if (email && c.email) {
                if (c.email.trim().toLowerCase() === email.trim().toLowerCase()) return true;
            }
            return false;
        });

        let msgQuery = supabaseAdmin
            .from('messages')
            .select('*')
            .ilike('channel', channel);

        if (matchedCustomer) {
            msgQuery = msgQuery.eq('customer_id', matchedCustomer.id);
        } else if (phone) {
            const cleanInput = phone.replace(/\D/g, '').slice(-10);
            msgQuery = msgQuery.or(`sender_address.ilike.%${cleanInput}%,recipient_address.ilike.%${cleanInput}%`);
        } else if (email) {
            msgQuery = msgQuery.or(`sender_address.ilike.%${email}%,recipient_address.ilike.%${email}%`);
        }

        const { data: messages } = await msgQuery.order('created_at', { ascending: true }).limit(200);

        const activities = (messages || []).map((m: any) => {
            const cust = customerMap.get(m.customer_id) || matchedCustomer || {};
            const custName = cust.full_name || cust.customer_name || 'Customer';
            const isReply = m.direction === 'INBOUND' || (m.status && m.status.toLowerCase().includes('reply'));

            return {
                id: m.id,
                lead_id: m.customer_id,
                lead_name: custName,
                lead_phone: cust.phone_e164 || m.sender_address || m.recipient_address || phone,
                lead_email: cust.email || m.sender_address || m.recipient_address || email,
                channel: m.channel,
                action_type: m.channel,
                direction: m.direction,
                status: m.status || (isReply ? 'replied' : 'sent'),
                replied: isReply ? 'yes' : 'no',
                WP_Replied_track: isReply ? 'Replied' : '',
                content: m.body_text || m.subject || '',
                note: m.body_text || m.subject || '',
                summary: m.subject || m.body_text || '',
                created_at: m.sent_or_received_at || m.created_at,
                _source_table: 'messages'
            };
        });

        const lead = matchedCustomer ? {
            id: matchedCustomer.id,
            name: matchedCustomer.full_name || matchedCustomer.customer_name,
            phone: matchedCustomer.phone_e164 || phone,
            email: matchedCustomer.email || email,
            status: matchedCustomer.WA_replied ? 'Replied' : 'Active',
            source_table: 'customers'
        } : (activities[0] ? {
            id: activities[0].lead_id,
            name: activities[0].lead_name,
            phone: activities[0].lead_phone,
            email: activities[0].lead_email,
            status: activities[0].status,
            source_table: 'messages'
        } : null);

        return NextResponse.json(
            { lead, activities },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Pragma': 'no-cache',
                },
            }
        );
    } catch (err) {
        console.error('[public/share] Error:', err);
        return NextResponse.json(
            { error: 'Internal server error', lead: null, activities: [] },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}

