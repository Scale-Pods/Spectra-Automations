/**
 * Client service for dispatching dual-channel commercial approvals & job authorizations.
 * Adheres to the Spectra Operations Portal — Dual-Channel Approval Integration Specification.
 */

import { clearCache } from "@/lib/cache-utils";

export const AUTHORIZED_REVIEWER_EMAILS = [
    'marketing@spectradubai.com',
    'dispatch@spectradubai.com',
    'tech@spectradubai.com',
    'ops@spectrawide.com',
    'admin@spectradubai.com',
    'naveen@scalepods.tech',
] as const;

export type ReviewerEmail = typeof AUTHORIZED_REVIEWER_EMAILS[number] | string;

export type ApprovalActionType =
    | 'APPROVE_QUOTE'
    | 'APPROVE'
    | 'REVISE_QUOTE'
    | 'REJECT_QUOTE'
    | 'AUTHORIZE_JOB';

export interface ApprovalActionPayload {
    action: ApprovalActionType;
    token: string;
    reviewer_email: string;
    price?: number;
    date?: string;
    time?: string;
    approved_date?: string;
    notes?: string;
    reason?: string;
}

export interface ApprovalActionResult {
    success: boolean;
    action_executed?: string;
    status?: string;
    approval_id?: string;
    job_id?: string | number | null;
    job_auth_id?: string | null;
    quote_id?: string | number | null;
    approved_price?: string | number | null;
    confirmed_timing?: string | null;
    customer_channel?: string | null;
    customer_email?: string | null;
    customer_notified?: boolean;
    message?: string;
    error?: string;
}

const DIRECT_WEBHOOK_URL = 'https://n8n.srv1010832.hstgr.cloud/webhook/spectra-frontend-approval';

/**
 * Dispatch an approval action with automatic fallback from local API proxy to direct n8n webhook.
 */
export async function executeApprovalAction(payload: ApprovalActionPayload): Promise<ApprovalActionResult> {
    // Invalidate client-side cache immediately
    clearCache('approvals');
    clearCache('approvals-panel');

    // 1. Attempt Next.js API route first (server-side proxy + cache invalidation)
    try {
        const response = await fetch('/api/approvals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        clearCache('approvals');
        clearCache('approvals-panel');
        return data;
    } catch (apiErr: any) {
        console.warn('Local /api/approvals proxy failed, attempting direct webhook fallback:', apiErr);

        // 2. Direct Webhook fallback
        try {
            const fallbackResponse = await fetch(DIRECT_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const fallbackData = await fallbackResponse.json();
            clearCache('approvals');
            clearCache('approvals-panel');
            return fallbackData;
        } catch (directErr: any) {
            console.error('All webhook endpoints failed:', directErr);
            return {
                success: false,
                action_executed: 'ERROR',
                error: `Network error: ${directErr?.message || 'Failed to reach approval webhook engine.'}`,
                approval_id: payload.token,
            };
        }
    }
}
