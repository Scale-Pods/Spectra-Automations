import { NextRequest, NextResponse } from 'next/server';
import { fetchMessages, groupMessagesByRecipient, parseRawPayload } from '@/lib/messages-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const channel = searchParams.get('channel');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const offset = (page - 1) * limit;

        const { messages, total } = await fetchMessages({
            channel: channel || undefined,
            search: search || undefined,
            limit,
            offset
        });

        const activities = messages.map(m => {
            const rawPayload = parseRawPayload(m.raw_payload);
            const canonical = rawPayload.canonical_event || {};
            const isReply = m.direction === 'INBOUND' || (m.status && m.status.toLowerCase().includes('reply'));

            return {
                id: m.id,
                conversation_id: m.conversation_id,
                customer_id: m.customer_id,
                lead_id: m.customer_id || m.recipient_address,
                lead_name: m.recipient_address || m.sender_address,
                lead_phone: m.sender_address || m.recipient_address,
                lead_email: m.recipient_address || m.sender_address,
                sender_address: m.sender_address,
                recipient_address: m.recipient_address, // Unique lead constraint
                channel: m.channel,
                direction: m.direction,
                status: m.status,
                provider: m.provider,
                provider_message_id: m.provider_message_id,
                provider_thread_id: m.provider_thread_id,
                subject: m.subject || canonical.subject || '',
                body_text: m.body_text || canonical.body_text || '',
                body_html: m.body_html || null,
                content: m.body_text || m.subject || canonical.body_text || '',
                note: m.body_text || m.subject || '',
                summary: m.subject || m.body_text || '',
                raw_payload: m.raw_payload,
                sent_or_received_at: m.sent_or_received_at,
                created_at: m.created_at || m.sent_or_received_at,
                _source_table: 'messages'
            };
        });

        return NextResponse.json({
            activities,
            messages,
            total,
            page,
            limit
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
    } catch (error: any) {
        console.error('Error in activity API route:', error);
        return NextResponse.json({
            activities: [],
            messages: [],
            total: 0,
            page: 1,
            limit: 50,
            errors: [error.message]
        }, { status: 500 });
    }
}
