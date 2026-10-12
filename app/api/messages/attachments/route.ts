import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customer_id');
        const messageId = searchParams.get('message_id');
        const eworksCustomerId = searchParams.get('eworks_customer_id');
        const search = searchParams.get('search');

        let query = supabaseAdmin
            .from('message_attachments')
            .select('*')
            .order('created_at', { ascending: true });

        let resolvedCustomerIds: string[] = [];

        if (customerId && customerId.trim()) {
            const rawCids = customerId.split(',').map(s => s.trim()).filter(Boolean);
            for (const cid of rawCids) {
                // If it looks like a UUID
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cid)) {
                    resolvedCustomerIds.push(cid);
                } else {
                    // Try looking up customer by phone or eworks_customer_id
                    const digits = cid.replace(/\D/g, '');
                    if (digits.length >= 7) {
                        const { data: custs } = await supabaseAdmin
                            .from('customers')
                            .select('id')
                            .or(`phone_e164.ilike.%${digits.slice(-10)}%,eworks_customer_id.eq.${!isNaN(Number(digits)) ? Number(digits) : -1}`);
                        if (custs && custs.length > 0) {
                            custs.forEach(c => resolvedCustomerIds.push(c.id));
                        }
                    }
                    resolvedCustomerIds.push(cid);
                }
            }
        }

        const filters: string[] = [];

        if (resolvedCustomerIds.length > 0) {
            const uniqueCids = Array.from(new Set(resolvedCustomerIds));
            if (uniqueCids.length === 1) {
                filters.push(`customer_id.eq.${uniqueCids[0]}`);
            } else {
                filters.push(`customer_id.in.(${uniqueCids.join(',')})`);
            }
        }

        if (messageId && messageId.trim()) {
            filters.push(`message_id.eq.${messageId.trim()}`);
        }

        if (eworksCustomerId && !isNaN(Number(eworksCustomerId))) {
            filters.push(`eworks_customer_id.eq.${Number(eworksCustomerId)}`);
        }

        if (filters.length > 0) {
            query = query.or(filters.join(','));
        }

        if (search && search.trim()) {
            const s = search.trim();
            query = query.or(`filename.ilike.%${s}%,extracted_text.ilike.%${s}%,ai_summary.ilike.%${s}%`);
        }

        const { data: attachments, error } = await query;

        if (error) {
            console.error('[API /api/messages/attachments] Error fetching attachments:', error);
            return NextResponse.json({ attachments: [], error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            attachments: attachments || []
        });
    } catch (err: any) {
        console.error('[API /api/messages/attachments] Unexpected error:', err);
        return NextResponse.json({ attachments: [], error: err?.message || 'Internal Server Error' }, { status: 500 });
    }
}
