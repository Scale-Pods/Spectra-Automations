import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const channel = searchParams.get('channel');
        const reply = searchParams.get('reply');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        // Query customers for lookup
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('*');

        const customers = customerRows || [];
        const customerMap = new Map<string, any>();
        customers.forEach(c => customerMap.set(c.id, c));

        // Query messages
        let msgQuery = supabaseAdmin
            .from('messages')
            .select('*', { count: 'exact' });

        if (channel && channel !== 'all') {
            msgQuery = msgQuery.ilike('channel', channel);
        }

        if (reply && reply !== 'all') {
            if (reply === 'yes') {
                msgQuery = msgQuery.or('direction.eq.INBOUND,status.ilike.%reply%');
            } else if (reply === 'no') {
                msgQuery = msgQuery.eq('direction', 'OUTBOUND');
            }
        }

        if (search) {
            const s = search.trim();
            msgQuery = msgQuery.or(`subject.ilike.%${s}%,body_text.ilike.%${s}%,sender_address.ilike.%${s}%,recipient_address.ilike.%${s}%`);
        }

        const offset = (page - 1) * limit;
        msgQuery = msgQuery.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data: messages, count: totalCount, error: msgErr } = await msgQuery;

        if (msgErr) {
            console.error('Error fetching messages in activity API:', msgErr);
        }

        const rawMessages = messages || [];

        const activities = rawMessages.map((m: any) => {
            const cust = customerMap.get(m.customer_id) || {};
            const custName = cust.full_name || cust.customer_name || 'Customer';
            const isReply = m.direction === 'INBOUND' || (m.status && m.status.toLowerCase().includes('reply'));

            return {
                id: m.id,
                lead_id: m.customer_id,
                lead_name: custName,
                lead_phone: cust.phone_e164 || m.sender_address || m.recipient_address || '',
                lead_email: cust.email || m.sender_address || m.recipient_address || '',
                channel: m.channel || 'WhatsApp',
                action_type: m.channel || 'WhatsApp',
                direction: m.direction || 'OUTBOUND',
                status: m.status || (isReply ? 'replied' : 'sent'),
                replied: isReply ? 'yes' : 'no',
                WP_Replied_track: isReply ? 'Replied' : '',
                content: m.body_text || m.subject || '',
                note: m.body_text || m.subject || '',
                summary: m.subject || m.body_text || '',
                created_at: m.sent_or_received_at || m.created_at || new Date().toISOString(),
                _source_table: 'messages'
            };
        });

        return NextResponse.json({
            activities,
            total: totalCount || activities.length,
            page,
            limit,
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
    } catch (error: any) {
        console.error('Error in activity route:', error);
        return NextResponse.json({
            activities: [],
            total: 0,
            page: 1,
            limit: 50,
            errors: [error.message],
        }, { status: 500 });
    }
}

