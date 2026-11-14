import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getCachedData, setCachedData } from '@/lib/cache-utils';

export const dynamic = 'force-dynamic';

const getDb = () => supabaseAdmin || supabase;

export async function GET(request: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customer_id');
        const approvalId = searchParams.get('approval_id');
        const conversationId = searchParams.get('conversation_id');
        const includeMessages = searchParams.get('include_messages') === 'true';
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const limit = Math.min(Number(searchParams.get('limit')) || 500, 1000);

        // If requesting messages for a specific conversation/customer (read-only transcript)
        if (includeMessages && (conversationId || customerId)) {
            let msgQuery = db
                .from('messages')
                .select('id, conversation_id, customer_id, channel, direction, status, provider, sender_address, recipient_address, subject, body_text, sent_or_received_at, created_at')
                .order('sent_or_received_at', { ascending: true })
                .limit(50);

            if (conversationId) {
                msgQuery = msgQuery.eq('conversation_id', conversationId);
            } else if (customerId) {
                msgQuery = msgQuery.eq('customer_id', customerId);
            }

            const { data: messages, error: msgErr } = await msgQuery;
            if (msgErr) {
                return NextResponse.json({ success: false, error: msgErr.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, messages: messages || [] });
        }

        if (!includeMessages) {
            const cacheKey = `approvals-api:${customerId || 'all'}:${approvalId || 'all'}:${from || 'none'}:${to || 'none'}:${limit}`;
            const cached = getCachedData<any>(cacheKey);
            if (cached) {
                return NextResponse.json(cached, {
                    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
                });
            }
        }

        // 1. Fetch commercial approvals (with optional customer_id / date range filters)
        let approvalsQuery = db
            .from('commercial_approvals')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (customerId) {
            approvalsQuery = approvalsQuery.eq('customer_id', customerId);
        }
        if (approvalId) {
            approvalsQuery = approvalsQuery.eq('approval_id', approvalId);
        }
        if (from) {
            approvalsQuery = approvalsQuery.gte('created_at', from);
        }
        if (to) {
            approvalsQuery = approvalsQuery.lte('created_at', to);
        }

        // 2. Fetch internal notifications (with optional customer_id / date range filters)
        let notificationsQuery = db
            .from('internal_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (customerId) {
            notificationsQuery = notificationsQuery.eq('customer_id', customerId);
        }
        if (from) {
            notificationsQuery = notificationsQuery.gte('created_at', from);
        }
        if (to) {
            notificationsQuery = notificationsQuery.lte('created_at', to);
        }

        const [
            { data: rawApprovals, error: appErr },
            { data: rawNotifications, error: notifErr }
        ] = await Promise.all([approvalsQuery, notificationsQuery]);

        if (appErr) {
            console.error('[API /api/approvals] Error fetching commercial_approvals:', appErr);
            return NextResponse.json({ success: false, error: appErr.message }, { status: 500 });
        }
        if (notifErr) {
            console.error('[API /api/approvals] Error fetching internal_notifications:', notifErr);
            return NextResponse.json({ success: false, error: notifErr.message }, { status: 500 });
        }

        const approvalsList = rawApprovals || [];
        const notificationsList = rawNotifications || [];

        // 3. Batch-fetch related customers & service episodes
        const customerIds = Array.from(
            new Set([
                ...approvalsList.map((a: any) => a.customer_id),
                ...notificationsList.map((n: any) => n.customer_id)
            ].filter(Boolean))
        );

        const episodeIds = Array.from(
            new Set([
                ...approvalsList.map((a: any) => a.service_episode_id),
                ...notificationsList.map((n: any) => n.service_episode_id)
            ].filter(Boolean))
        );

        const customersMap: Record<string, any> = {};
        if (customerIds.length > 0) {
            const { data: custRows } = await db
                .from('customers')
                .select('id, eworks_customer_id, full_name, customer_name, email, phone_e164, address_line, city')
                .in('id', customerIds);
            (custRows || []).forEach((c: any) => {
                customersMap[c.id] = c;
            });
        }

        const episodesMap: Record<string, any> = {};
        if (episodeIds.length > 0) {
            const { data: epRows } = await db
                .from('service_episodes')
                .select('id, service_type, property_address, status, active_task_id, active_quote_id, active_job_id, lifecycle_stage, provided_fields')
                .in('id', episodeIds);
            (epRows || []).forEach((ep: any) => {
                episodesMap[ep.id] = ep;
            });
        }

        // Enrich approvals
        const approvals = approvalsList.map((a: any) => {
            const cust = a.customer_id ? customersMap[a.customer_id] || null : null;
            const ep = a.service_episode_id ? episodesMap[a.service_episode_id] || null : null;
            const payload = a.proposal_payload || {};
            const resolvedServiceName = a.service_name || payload.service || ep?.service_type || 'Maintenance Service';
            const resolvedProposedTotal =
                payload.proposed_total ??
                payload.total_amount ??
                payload.proposed_price ??
                null;

            return {
                ...a,
                customer: cust,
                service_episode: ep,
                resolved_service_name: resolvedServiceName,
                resolved_proposed_total: resolvedProposedTotal !== null ? Number(resolvedProposedTotal) : null,
                resolved_address: payload.property_address || ep?.property_address || cust?.address_line || null,
            };
        });

        // Enrich notifications
        const notifications = notificationsList.map((n: any) => {
            const cust = n.customer_id ? customersMap[n.customer_id] || null : null;
            const ep = n.service_episode_id ? episodesMap[n.service_episode_id] || null : null;
            return {
                ...n,
                customer: cust,
                service_episode: ep
            };
        });

        // 4. Compute summary metrics
        const approvalsSummary = {
            total: approvals.length,
            reviewRequired: approvals.filter((a: any) => a.status === 'SPECTRA_REVIEW_REQUIRED').length,
            awaitingCustomer: approvals.filter((a: any) => a.status === 'AWAITING_CUSTOMER_ACCEPTANCE').length,
            customerAccepted: approvals.filter((a: any) => a.status === 'CUSTOMER_ACCEPTED' || a.status === 'SPECTRA_COMMERCIAL_APPROVED').length,
            jobCreated: approvals.filter((a: any) => a.status === 'JOB_CREATED_UNASSIGNED').length,
            rejected: approvals.filter((a: any) => a.status === 'REJECTED' || a.status === 'CANCELLED').length,
            superseded: approvals.filter((a: any) => a.status === 'SUPERSEDED').length,
            totalApprovedAed: approvals
                .filter((a: any) => ['AWAITING_CUSTOMER_ACCEPTANCE', 'CUSTOMER_ACCEPTED', 'JOB_CREATED_UNASSIGNED', 'SPECTRA_COMMERCIAL_APPROVED'].includes(a.status))
                .reduce((acc: number, a: any) => acc + (Number(a.approved_total) || 0), 0),
        };

        const byType: Record<string, number> = {};
        notifications.forEach((n: any) => {
            const t = n.notification_type || 'OTHER';
            byType[t] = (byType[t] || 0) + 1;
        });

        const notificationsSummary = {
            total: notifications.length,
            verifiedSent: notifications.filter((n: any) => n.status === 'VERIFIED_SENT' || n.status === 'SENT').length,
            delivered: notifications.filter((n: any) => n.status === 'DELIVERED').length,
            failed: notifications.filter((n: any) => n.status === 'FAILED').length,
            byType,
        };

        const responsePayload = {
            success: true,
            approvals,
            notifications,
            approvalsSummary,
            notificationsSummary,
        };

        if (!includeMessages) {
            const cacheKey = `approvals-api:${customerId || 'all'}:${approvalId || 'all'}:${from || 'none'}:${to || 'none'}:${limit}`;
            setCachedData(cacheKey, responsePayload);
        }

        return NextResponse.json(responsePayload, {
            headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
        });
    } catch (err: any) {
        console.error('[API /api/approvals] GET error:', err);
        return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
