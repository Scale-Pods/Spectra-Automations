import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function extractCustomerWhatsAppContent(c: any): string {
    const rawDirect = c.content || c.WA_text || c.whatsapp_text || c["WA_text"];
    if (rawDirect && String(rawDirect).trim()) {
        return String(rawDirect).trim();
    }

    const lines: string[] = [];

    // Stages 1..12
    for (let i = 1; i <= 12; i++) {
        const val = c[`W.P_${i}`] || c.stage_data?.[`WhatsApp ${i}`] || c[`whatsapp_${i}`];
        if (val && String(val).trim() && !["no", "none", "0", "false"].includes(String(val).toLowerCase().trim())) {
            const ts = c[`W.P_${i} TS`];
            lines.push(ts ? `AI [${ts}]: ${String(val).trim()}` : `AI: ${String(val).trim()}`);
        }
    }

    // Replied & FollowUps 1..10
    for (let i = 1; i <= 10; i++) {
        const rVal = c[`W.P_Replied_${i}`] || c[`W.P_Replied ${i}`];
        if (rVal && String(rVal).trim() && !["no", "none", "0", "false"].includes(String(rVal).toLowerCase().trim())) {
            lines.push(`User: ${String(rVal).trim()}`);
        }

        const fVal = c[`W.P_FollowUp_${i}`] || c[`W.P_FollowUp ${i}`];
        if (fVal && String(fVal).trim() && !["no", "none", "0", "false"].includes(String(fVal).toLowerCase().trim())) {
            const fTs = c[`W.P_FollowUp_TS${i}`];
            lines.push(fTs ? `AI [${fTs}]: ${String(fVal).trim()}` : `AI: ${String(fVal).trim()}`);
        }
    }

    // Direct whatsapp_1..4
    if (lines.length === 0) {
        for (let i = 1; i <= 4; i++) {
            const val = c[`whatsapp_${i}`];
            if (val && String(val).trim()) {
                lines.push(`AI: ${String(val).trim()}`);
            }
        }
    }

    // Standalone reply
    if (lines.length === 0) {
        const rTrack = c.WP_Replied_track || c.WA_replied || c.whatsapp_replied || c.replied;
        if (rTrack && String(rTrack).trim() && !["no", "none", "0", "false"].includes(String(rTrack).toLowerCase().trim())) {
            lines.push(`User: ${String(rTrack).trim()}`);
        }
    }

    if (lines.length === 0 && (c.summary || c.note || c.WA_note)) {
        lines.push(`User: ${c.summary || c.note || c.WA_note}`);
    }

    return lines.join('\n\n');
}

function extractCustomerEmailContent(c: any): string {
    const rawDirect = c.email_text || c.email_content || c.content;
    if (rawDirect && String(rawDirect).trim()) {
        return String(rawDirect).trim();
    }

    const lines: string[] = [];
    for (let i = 1; i <= 10; i++) {
        const val = c[`email_${i}`] || c[`Email_${i}`] || c[`Email ${i}`];
        if (val && String(val).trim()) {
            lines.push(`Outbound Email: ${String(val).trim()}`);
        }
    }
    const reply = c.email_reply || c.email_replied || c["Email Replied"];
    if (reply && String(reply).trim() && !["no", "none", "0", "false"].includes(String(reply).toLowerCase().trim())) {
        lines.push(`Inbound Email: ${String(reply).trim()}`);
    }
    if (lines.length === 0 && (c.summary || c.note)) {
        lines.push(`Inbound Email: ${c.summary || c.note}`);
    }
    return lines.join('\n\n');
}

function extractCustomerSmsContent(c: any): string {
    const rawDirect = c.sms_text || c.sms_content || c.content;
    if (rawDirect && String(rawDirect).trim()) {
        return String(rawDirect).trim();
    }

    const lines: string[] = [];
    for (let i = 1; i <= 10; i++) {
        const val = c[`sms_${i}`] || c[`SMS_${i}`] || c[`SMS ${i}`];
        if (val && String(val).trim()) {
            lines.push(`Outbound SMS: ${String(val).trim()}`);
        }
    }
    const reply = c.sms_reply || c.sms_replied || c["SMS Replied"];
    if (reply && String(reply).trim() && !["no", "none", "0", "false"].includes(String(reply).toLowerCase().trim())) {
        lines.push(`User: ${String(reply).trim()}`);
    }
    if (lines.length === 0 && (c.summary || c.note)) {
        lines.push(`User: ${c.summary || c.note}`);
    }
    return lines.join('\n\n');
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const channel = (searchParams.get('channel') || '').toLowerCase();
        const idParam = searchParams.get('id') || searchParams.get('eworks_customer_id') || searchParams.get('customer_id') || searchParams.get('leadId') || '';
        const phone = searchParams.get('phone') || '';
        const email = searchParams.get('email') || '';

        if (!channel || (!idParam && !phone && !email)) {
            return NextResponse.json(
                { error: 'Missing required params: channel and id, phone, or email' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        // Query customers for lookup
        const { data: customerRows } = await supabaseAdmin
            .from('customers')
            .select('*');

        const customers = customerRows || [];
        const customerMap = new Map<string, any>();
        customers.forEach(c => customerMap.set(String(c.id), c));

        // Find customer matching eWorks Customer ID, ID, phone, or email
        let matchedCustomer = customers.find(c => {
            if (idParam) {
                const sId = String(idParam).trim().toLowerCase();
                if (
                    String(c.eworks_customer_id || '').trim().toLowerCase() === sId ||
                    String(c.id || '').trim().toLowerCase() === sId ||
                    String(c.customer_id || '').trim().toLowerCase() === sId
                ) {
                    return true;
                }
            }
            return false;
        });

        if (!matchedCustomer && idParam) {
            const cleanIdDigits = String(idParam).replace(/\D/g, '');
            if (cleanIdDigits.length >= 7) {
                matchedCustomer = customers.find(c => {
                    const cleanCPhone = (c.phone_e164 || c.mobile_raw || c.telephone_raw || c.phone || '').replace(/\D/g, '');
                    return cleanCPhone.length >= 7 && (cleanCPhone.includes(cleanIdDigits) || cleanIdDigits.includes(cleanCPhone));
                });
            }
        }

        if (!matchedCustomer && phone) {
            const cleanInput = phone.replace(/\D/g, '');
            if (cleanInput.length >= 7) {
                const cleanInputLast10 = cleanInput.slice(-10);
                matchedCustomer = customers.find(c => {
                    const cleanCPhone = (c.phone_e164 || c.mobile_raw || c.telephone_raw || c.phone || '').replace(/\D/g, '');
                    return cleanCPhone.length >= 7 && cleanCPhone.includes(cleanInputLast10);
                });
            }
        }

        if (!matchedCustomer && email) {
            const targetEmail = email.trim().toLowerCase();
            matchedCustomer = customers.find(c => c.email && c.email.trim().toLowerCase() === targetEmail);
        }

        let msgQuery = supabaseAdmin
            .from('messages')
            .select('*')
            .ilike('channel', channel);

        if (matchedCustomer) {
            msgQuery = msgQuery.eq('customer_id', matchedCustomer.id);
        } else if (idParam) {
            msgQuery = msgQuery.or(`customer_id.eq.${idParam},sender_address.ilike.%${idParam}%,recipient_address.ilike.%${idParam}%`);
        } else if (phone) {
            const cleanInput = phone.replace(/\D/g, '');
            if (cleanInput.length >= 7) {
                const cleanLast10 = cleanInput.slice(-10);
                msgQuery = msgQuery.or(`sender_address.ilike.%${cleanLast10}%,recipient_address.ilike.%${cleanLast10}%`);
            }
        } else if (email) {
            msgQuery = msgQuery.or(`sender_address.ilike.%${email}%,recipient_address.ilike.%${email}%`);
        }

        const { data: messages } = await msgQuery.order('created_at', { ascending: true }).limit(200);

        const activities: any[] = (messages || []).map((m: any) => {
            const cust = customerMap.get(m.customer_id) || matchedCustomer || {};
            const custName = cust.full_name || cust.customer_name || `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || 'Customer';
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

        // Fallback: If messages table returned 0 rows for matchedCustomer, extract from customer row fields
        if (activities.length === 0 && matchedCustomer) {
            let contentText = '';
            if (channel === 'whatsapp') {
                contentText = extractCustomerWhatsAppContent(matchedCustomer);
            } else if (channel === 'email') {
                contentText = extractCustomerEmailContent(matchedCustomer);
            } else if (channel === 'sms') {
                contentText = extractCustomerSmsContent(matchedCustomer);
            }

            if (contentText) {
                const isReply = !!(matchedCustomer.WA_replied || matchedCustomer.email_reply || matchedCustomer.sms_reply || matchedCustomer.whatsapp_replied || matchedCustomer.WP_Replied_track);
                activities.push({
                    id: `cust-${channel}-${matchedCustomer.id}`,
                    lead_id: matchedCustomer.id,
                    lead_name: matchedCustomer.full_name || matchedCustomer.customer_name || `${matchedCustomer.first_name || ''} ${matchedCustomer.last_name || ''}`.trim() || 'Customer',
                    lead_phone: matchedCustomer.phone_e164 || matchedCustomer.mobile_raw || matchedCustomer.telephone_raw || matchedCustomer.phone || phone,
                    lead_email: matchedCustomer.email || email,
                    channel: channel,
                    action_type: channel,
                    direction: isReply ? 'INBOUND' : 'OUTBOUND',
                    status: isReply ? 'replied' : 'sent',
                    replied: isReply ? 'yes' : 'no',
                    WP_Replied_track: isReply ? 'Replied' : '',
                    content: contentText,
                    note: contentText,
                    summary: matchedCustomer.summary || matchedCustomer.note || matchedCustomer.WA_note || contentText.slice(0, 100),
                    created_at: matchedCustomer.wp1_parsed_date || matchedCustomer.created_at || matchedCustomer.eworks_created_on || new Date().toISOString(),
                    _source_table: 'customers'
                });
            }
        }

        const lead = matchedCustomer ? {
            id: matchedCustomer.id,
            eworks_customer_id: matchedCustomer.eworks_customer_id || matchedCustomer.id,
            name: matchedCustomer.full_name || matchedCustomer.customer_name || `${matchedCustomer.first_name || ''} ${matchedCustomer.last_name || ''}`.trim() || 'Customer',
            phone: matchedCustomer.phone_e164 || matchedCustomer.mobile_raw || matchedCustomer.telephone_raw || matchedCustomer.phone || phone,
            email: matchedCustomer.email || email,
            address: matchedCustomer.address_line || [matchedCustomer.city, matchedCustomer.country].filter(Boolean).join(', ') || '',
            city: matchedCustomer.city || 'Dubai',
            category: matchedCustomer.latest_quoted_service_category || 'General Service',
            total_job_count: matchedCustomer.total_job_count || matchedCustomer.completed_job_count || 0,
            total_invoiced_value: matchedCustomer.total_invoiced_value || 0,
            status: (matchedCustomer.WA_replied || matchedCustomer.whatsapp_replied || matchedCustomer.email_replied || matchedCustomer.sms_replied || matchedCustomer.WP_Replied_track) ? 'Replied' : 'Active',
            source_table: 'customers',
            action_type: matchedCustomer.action_type || channel,
            lead_temp: matchedCustomer.lead_temp || matchedCustomer.sentiment || matchedCustomer["Lead Temperature"] || 'Warm',
            summary: matchedCustomer.summary || matchedCustomer.note || matchedCustomer.WA_note,
        } : (activities[0] ? {
            id: activities[0].lead_id,
            eworks_customer_id: activities[0].lead_id,
            name: activities[0].lead_name,
            phone: activities[0].lead_phone,
            email: activities[0].lead_email,
            address: '',
            city: 'Dubai',
            category: 'General Service',
            total_job_count: 0,
            total_invoiced_value: 0,
            status: activities[0].status,
            source_table: 'messages',
            action_type: channel,
            lead_temp: 'Warm',
            summary: activities[0].summary
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


