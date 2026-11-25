import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getCachedData, setCachedData, clearCache } from '@/lib/cache-utils';

export const dynamic = 'force-dynamic';

const getDb = () => supabaseAdmin || supabase;

export const AUTHORIZED_REVIEWER_EMAILS = [
    'marketing@spectradubai.com',
    'dispatch@spectradubai.com',
    'tech@spectradubai.com',
    'ops@spectrawide.com',
    'admin@spectradubai.com',
    'naveen@scalepods.tech',
];

const ACTION_API_URL = 'https://n8n.srv1010832.hstgr.cloud/webhook/spectra-frontend-approval';

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

        // Operational Approvals Inbox: Real-time queries bypass caching to prevent stale approvals
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

        // 3. Batch-fetch related customers, service episodes, and latest messages
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

        // Fetch latest inbound messages for customers to provide context in approval cards
        const messagesMap: Record<string, { body_text: string; channel: string }> = {};
        if (customerIds.length > 0) {
            const { data: latestMsgs } = await db
                .from('messages')
                .select('customer_id, body_text, channel, created_at')
                .in('customer_id', customerIds)
                .eq('direction', 'INBOUND')
                .order('created_at', { ascending: false });
            (latestMsgs || []).forEach((m: any) => {
                if (m.customer_id && !messagesMap[m.customer_id]) {
                    messagesMap[m.customer_id] = {
                        body_text: m.body_text || '',
                        channel: m.channel || 'WHATSAPP',
                    };
                }
            });
        }

        // Enrich approvals with autofill properties
        const approvals = approvalsList.map((a: any) => {
            const cust = a.customer_id ? customersMap[a.customer_id] || null : null;
            const ep = a.service_episode_id ? episodesMap[a.service_episode_id] || null : null;
            const payload = a.proposal_payload || {};
            const approvedPayload = a.approved_payload || {};
            const resolvedServiceName = a.service_name || payload.service || ep?.service_type || 'Maintenance Service';
            const resolvedProposedTotal =
                payload.proposed_total ??
                payload.total_amount ??
                payload.proposed_price ??
                null;

            const jobAuthToken =
                a.job_auth_id ||
                (a.approval_id ? 'SPECTRA-JOB-AUTH-' + a.approval_id.replace('SPECTRA-APPROVAL-', '') : '');

            const subtotalAed = Number(payload.subtotal ?? a.approved_subtotal ?? 0);
            const vatAed = Number(payload.vat_amount ?? a.vat_amount ?? 0);
            const totalAed = Number(
                a.approved_total ??
                (resolvedProposedTotal !== null ? resolvedProposedTotal : null) ??
                (subtotalAed + vatAed > 0 ? subtotalAed + vatAed : 0)
            );

            const requestedTiming =
                payload.preferred_timing ||
                approvedPayload.timing ||
                a.preferred_time ||
                a.preferred_date ||
                'Flexible';

            const latestMsg = a.customer_id ? messagesMap[a.customer_id] : null;

            return {
                ...a,
                customer: cust,
                service_episode: ep,
                resolved_service_name: resolvedServiceName,
                resolved_proposed_total: resolvedProposedTotal !== null ? Number(resolvedProposedTotal) : null,
                resolved_address: payload.property_address || ep?.property_address || cust?.address_line || null,
                job_auth_token: jobAuthToken,
                subtotal_aed: subtotalAed,
                vat_aed: vatAed,
                total_aed: totalAed,
                requested_timing: requestedTiming,
                latest_customer_message: latestMsg?.body_text || '',
                customer_channel: latestMsg?.channel || 'WHATSAPP',
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

        // 4. Compute summary metrics aligned with the 4 Main Steps
        const approvalsSummary = {
            total: approvals.length,
            // Step 1: New quote created, waiting for Spectra team to click Approve
            reviewRequired: approvals.filter((a: any) => a.status === 'SPECTRA_REVIEW_REQUIRED').length,
            // Step 2: Quote approved, sent to customer, waiting for customer to say YES
            awaitingCustomer: approvals.filter((a: any) => a.status === 'AWAITING_CUSTOMER_ACCEPTANCE' || a.status === 'SPECTRA_COMMERCIAL_APPROVED').length,
            // Step 3: Customer said YES, waiting for Spectra team to click Dispatch Job
            jobAuthPending: approvals.filter((a: any) => a.status === 'JOB_AUTHORIZATION_PENDING' || a.status === 'CUSTOMER_ACCEPTED').length,
            customerAccepted: approvals.filter((a: any) => a.status === 'JOB_AUTHORIZATION_PENDING' || a.status === 'CUSTOMER_ACCEPTED').length,
            // Step 4: Job booked and created in eWorks CRM
            jobCreated: approvals.filter((a: any) => a.status === 'JOB_CREATED_UNASSIGNED' || a.status === 'JOB_AUTHORIZED').length,
            // Rejected or cancelled
            rejected: approvals.filter((a: any) => a.status === 'REJECTED' || a.status === 'CANCELLED').length,
            superseded: approvals.filter((a: any) => a.status === 'SUPERSEDED').length,
            totalApprovedAed: approvals
                .filter((a: any) => ['AWAITING_CUSTOMER_ACCEPTANCE', 'CUSTOMER_ACCEPTED', 'JOB_AUTHORIZATION_PENDING', 'JOB_CREATED_UNASSIGNED', 'JOB_AUTHORIZED', 'SPECTRA_COMMERCIAL_APPROVED'].includes(a.status))
                .reduce((acc: number, a: any) => acc + (Number(a.approved_total ?? a.total_aed) || 0), 0),
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

        // Real-time headers: never cache on Vercel CDN or browser for governance inbox
        return NextResponse.json(responsePayload, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (err: any) {
        console.error('[API /api/approvals] GET error:', err);
        return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, token, reviewer_email, price, date, time, approved_date, notes, reason } = body;

        if (!action || !token) {
            return NextResponse.json({
                success: false,
                action_executed: 'ERROR',
                error: 'Missing required parameters: "action" and "token" are mandatory.'
            }, { status: 400 });
        }

        const resolvedReviewer = (reviewer_email || (action === 'AUTHORIZE_JOB' ? 'dispatch@spectradubai.com' : 'marketing@spectradubai.com')).trim().toLowerCase();

        const isAllowed = AUTHORIZED_REVIEWER_EMAILS.some((e) => e.toLowerCase() === resolvedReviewer);
        if (!isAllowed) {
            return NextResponse.json({
                success: false,
                action_executed: 'ERROR',
                status: 'UNAUTHORIZED',
                error: `Reviewer '${resolvedReviewer}' is not authorized. Must be one of: ${AUTHORIZED_REVIEWER_EMAILS.join(', ')}`,
                approval_id: token
            }, { status: 403 });
        }

        const payload: Record<string, any> = {
            action,
            token,
            reviewer_email: resolvedReviewer,
        };

        if (price !== undefined && price !== null && !isNaN(Number(price))) {
            payload.price = Number(price);
        }
        if (date) payload.date = date;
        if (time) payload.time = time;
        if (approved_date) payload.approved_date = approved_date;
        if (notes) payload.notes = notes;
        if (reason) payload.reason = reason;

        const resp = await fetch(ACTION_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        const resData = await resp.json().catch(() => null);

        // Invalidate in-memory approvals cache so next fetch immediately returns fresh DB state
        clearCache('approvals');

        if (!resp.ok && !resData) {
            return NextResponse.json({
                success: false,
                action_executed: 'ERROR',
                error: `Webhook returned HTTP ${resp.status}`,
                approval_id: token
            }, { status: resp.status });
        }

        return NextResponse.json(resData || { success: true });
    } catch (err: any) {
        console.error('[API /api/approvals] POST action error:', err);
        return NextResponse.json({
            success: false,
            action_executed: 'ERROR',
            error: err.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

