"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    XCircle,
    Mail,
    Monitor,
    Briefcase,
    User,
    MessageSquare,
    FileText,
    RefreshCw,
    Check,
    Receipt
} from "lucide-react";
import { format } from "date-fns";

export const APPROVAL_STATUS_META: Record<string, { label: string; short: string; color: string; step: number }> = {
    SPECTRA_REVIEW_REQUIRED: {
        label: "Email sent, waiting internal team review",
        short: "Spectra Review Required",
        color: "bg-amber-50 text-amber-800 border-amber-200",
        step: 1,
    },
    AWAITING_CUSTOMER_ACCEPTANCE: {
        label: "Approved by team, sent to customer",
        short: "Awaiting Customer Acceptance",
        color: "bg-indigo-50 text-indigo-800 border-indigo-200",
        step: 2,
    },
    SPECTRA_COMMERCIAL_APPROVED: {
        label: "Commercially approved",
        short: "Commercial Approved",
        color: "bg-teal-50 text-teal-800 border-teal-200",
        step: 2,
    },
    CUSTOMER_ACCEPTED: {
        label: "Customer agreed to quote",
        short: "Customer Accepted",
        color: "bg-cyan-50 text-cyan-800 border-cyan-200",
        step: 3,
    },
    JOB_CREATED_UNASSIGNED: {
        label: "Booked into eWorks",
        short: "Job Created (eWorks)",
        color: "bg-emerald-50 text-emerald-800 border-emerald-200",
        step: 4,
    },
    REJECTED: {
        label: "Rejected by internal team",
        short: "Rejected",
        color: "bg-rose-50 text-rose-800 border-rose-200",
        step: 0,
    },
    CANCELLED: {
        label: "Cancelled",
        short: "Cancelled",
        color: "bg-slate-100 text-slate-600 border-slate-200",
        step: 0,
    },
    SUPERSEDED: {
        label: "Superseded by newer version",
        short: "Superseded",
        color: "bg-slate-100 text-slate-500 border-slate-200",
        step: 0,
    },
};

export const NOTIFICATION_TYPE_META: Record<string, { label: string; color: string }> = {
    COMMERCIAL_REVIEW: { label: "Commercial Review", color: "bg-amber-50 text-amber-800 border-amber-200" },
    CALLBACK_REQUEST: { label: "Callback Request", color: "bg-blue-50 text-blue-800 border-blue-200" },
    JOB_AUTHORIZATION: { label: "Job Authorization", color: "bg-violet-50 text-violet-800 border-violet-200" },
    JOB_CREATED: { label: "eWorks Job Created", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    COMPLIANCE_ESCALATION: { label: "Compliance Escalation", color: "bg-purple-50 text-purple-800 border-purple-200" },
    URGENT_SAFETY: { label: "Urgent Safety", color: "bg-rose-50 text-rose-800 border-rose-200" },
    EWORKS_FAILURE: { label: "eWorks Failure", color: "bg-rose-50 text-rose-800 border-rose-200" },
};

export const NOTIFICATION_STATUS_META: Record<string, { label: string; color: string }> = {
    VERIFIED_SENT: { label: "VERIFIED SENT", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    DELIVERED: { label: "DELIVERED", color: "bg-teal-50 text-teal-700 border-teal-200" },
    SENT: { label: "SENT", color: "bg-blue-50 text-blue-700 border-blue-200" },
    FAILED: { label: "FAILED", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

export function formatAed(amount?: number | string | null, currency = "AED") {
    if (amount === undefined || amount === null || amount === "") return "Pending Pricing";
    const num = Number(amount);
    if (isNaN(num)) return "Pending Pricing";
    return `${currency} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(dateStr?: string | null) {
    if (!dateStr) return "N/A";
    try {
        return format(new Date(dateStr), "MMM dd, yyyy · hh:mm a");
    } catch {
        return dateStr;
    }
}

interface ApprovalDetailModalProps {
    approval: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApprovalDetailModal({
    approval,
    open,
    onOpenChange,
}: ApprovalDetailModalProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

    useEffect(() => {
        if (!approval || !open) return;

        if (approval.conversation_id || approval.customer_id) {
            setLoadingMessages(true);
            const params = new URLSearchParams({ include_messages: "true" });
            if (approval.conversation_id) params.set("conversation_id", approval.conversation_id);
            else if (approval.customer_id) params.set("customer_id", approval.customer_id);

            fetch(`/api/approvals?${params.toString()}`)
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) setMessages(data.messages || []);
                })
                .catch(() => {})
                .finally(() => setLoadingMessages(false));
        } else {
            setMessages([]);
        }
    }, [approval, open]);

    if (!approval) return null;

    const statusMeta = APPROVAL_STATUS_META[approval.status] || {
        label: approval.status,
        short: approval.status,
        color: "bg-slate-100 text-slate-700 border-slate-200",
        step: 1,
    };

    const payload = approval.proposal_payload || {};
    const approvedPayload = approval.approved_payload || {};
    const cust = approval.customer || {};
    const ep = approval.service_episode || {};

    const subtotalVal = approval.approved_subtotal ?? approvedPayload.subtotal ?? payload.subtotal ?? payload.proposed_price ?? null;
    const vatVal = approval.vat_amount ?? approvedPayload.vat_amount ?? payload.vat_amount ?? payload.proposed_tax ?? null;
    const totalVal = approval.approved_total ?? approval.resolved_proposed_total ?? null;

    const pipelineSteps = [
        { step: 1, key: "SPECTRA_REVIEW_REQUIRED", label: "Team Review Required" },
        { step: 2, key: "AWAITING_CUSTOMER_ACCEPTANCE", label: "Awaiting Customer" },
        { step: 3, key: "CUSTOMER_ACCEPTED", label: "Customer Accepted" },
        { step: 4, key: "JOB_CREATED_UNASSIGNED", label: "Booked in eWorks" },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-white text-slate-900 border-slate-200 p-6 shadow-2xl rounded-2xl">
                <DialogHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                                    {approval.approval_id}
                                </span>
                                <Badge variant="outline" className={`text-xs font-bold border ${statusMeta.color}`}>
                                    {statusMeta.short}
                                </Badge>
                                {approval.review_channel && (
                                    <Badge variant="outline" className="text-[11px] font-semibold bg-slate-50 text-slate-700 border-slate-200 gap-1">
                                        {approval.review_channel === "GMAIL" ? <Mail className="h-3 w-3 text-rose-500" /> : <Monitor className="h-3 w-3 text-violet-600" />}
                                        {approval.review_channel}
                                    </Badge>
                                )}
                                {approval.job_id && (
                                    <Badge className="bg-emerald-600 text-white text-[11px] font-bold gap-1">
                                        <Briefcase className="h-3 w-3" />
                                        eWorks Job #{approval.job_id}
                                    </Badge>
                                )}
                            </div>
                            <DialogTitle className="text-lg font-extrabold text-slate-900 mt-2">
                                {approval.resolved_service_name || approval.service_name || "Commercial Approval Record"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                {statusMeta.label} · Created {formatDateTime(approval.created_at)}
                            </DialogDescription>
                        </div>

                        <div className="text-left sm:text-right bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                {approval.approved_total ? "Approved Total" : "Proposed Total"}
                            </span>
                            <span className="text-lg font-extrabold text-emerald-700 font-mono">
                                {formatAed(totalVal, approval.currency || "AED")}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    {/* Commercial Approval Pipeline Progress Bar (Read-Only) */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {pipelineSteps.map((s) => {
                                const isRejected = approval.status === "REJECTED" || approval.status === "CANCELLED";
                                const isDone = !isRejected && statusMeta.step >= s.step;
                                const isActive = !isRejected && statusMeta.step === s.step;
                                return (
                                    <div
                                        key={s.key}
                                        className={`p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2 ${
                                            isDone
                                                ? isActive
                                                    ? "bg-violet-50 border-violet-400 text-violet-950 font-bold shadow-2xs"
                                                    : "bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold"
                                                : "bg-white border-slate-200 text-slate-400"
                                        }`}
                                    >
                                        <span
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                isDone
                                                    ? isActive
                                                        ? "bg-violet-600 text-white"
                                                        : "bg-emerald-600 text-white"
                                                    : "bg-slate-200 text-slate-500"
                                            }`}
                                        >
                                            {isDone && !isActive ? <Check className="h-3 w-3" /> : s.step}
                                        </span>
                                        <span className="truncate text-[11px]">{s.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {approval.status === "REJECTED" && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                <span>
                                    <strong>Rejected</strong> by {approval.reviewer || "Internal Team"}
                                    {approval.rejection_reason ? `: "${approval.rejection_reason}"` : ""}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Customer & Commercial Financial Audit Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-white border-slate-200 shadow-2xs rounded-xl">
                            <CardHeader className="pb-2 border-b border-slate-100">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-violet-600" />
                                    Customer &amp; Property Context
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Customer Name</span>
                                    <span className="font-bold text-slate-900">{cust.full_name || cust.customer_name || "Customer"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Phone / WhatsApp</span>
                                    <span className="font-mono font-semibold text-slate-800">{cust.phone_e164 || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Email</span>
                                    <span className="font-medium text-slate-800">{cust.email || "N/A"}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500 shrink-0">Property Address</span>
                                    <span className="font-medium text-slate-900 text-right">{approval.resolved_address || "Pending"}</span>
                                </div>
                                {cust.eworks_customer_id && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">eWorks Customer ID</span>
                                        <span className="font-mono font-bold text-violet-700">#{cust.eworks_customer_id}</span>
                                    </div>
                                )}
                                {approval.related_task_id && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">eWorks Task Ref</span>
                                        <span className="font-mono font-bold text-slate-700">Task #{approval.related_task_id}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-slate-200 shadow-2xs rounded-xl">
                            <CardHeader className="pb-2 border-b border-slate-100">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                    <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                                    Commercial &amp; Audit Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-mono font-semibold text-slate-800">{formatAed(subtotalVal, approval.currency || "AED")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">VAT ({Math.round(Number(approval.vat_rate ?? 0.05) * 100)}%)</span>
                                    <span className="font-mono font-semibold text-slate-800">{formatAed(vatVal, approval.currency || "AED")}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 pt-1.5">
                                    <span className="text-slate-700 font-bold">Total</span>
                                    <span className="font-mono font-extrabold text-emerald-700">{formatAed(totalVal, approval.currency || "AED")}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-slate-500">Reviewer / Channel</span>
                                    <span className="font-semibold text-slate-800">
                                        {approval.reviewer ? `${approval.reviewer} (${approval.review_channel || "GMAIL"})` : "Awaiting Team Review"}
                                    </span>
                                </div>
                                {approval.review_timestamp && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Reviewed At</span>
                                        <span className="text-slate-600">{formatDateTime(approval.review_timestamp)}</span>
                                    </div>
                                )}
                                {approval.customer_accepted_at && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Customer Accepted At</span>
                                        <span className="text-cyan-700 font-medium">{formatDateTime(approval.customer_accepted_at)}</span>
                                    </div>
                                )}
                                {(approval.preferred_date || payload.preferred_timing) && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Preferred Slot</span>
                                        <span className="font-medium text-slate-800">
                                            {[approval.preferred_date || payload.preferred_date, approval.preferred_time || payload.preferred_timing].filter(Boolean).join(" · ")}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Commercial Scope & Notes */}
                    <Card className="bg-white border-slate-200 shadow-2xs rounded-xl">
                        <CardHeader className="pb-2 border-b border-slate-100">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                Scope &amp; Line Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2.5 text-xs">
                            <p className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                {payload.proposed_scope || ep.service_type || approval.resolved_service_name}
                            </p>
                            {(approvedPayload.notes || payload.notes) && (
                                <p className="text-slate-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 leading-relaxed">
                                    {approvedPayload.notes || payload.notes}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Linked Customer Conversation Transcript (Read-Only) */}
                    <Card className="bg-white border-slate-200 shadow-2xs rounded-xl">
                        <CardHeader className="pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                                Customer Communication Context ({messages.length} messages)
                            </CardTitle>
                            {loadingMessages && <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                        </CardHeader>
                        <CardContent className="p-3 max-h-60 overflow-y-auto space-y-2 bg-slate-50/60">
                            {messages.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">
                                    {loadingMessages ? "Loading linked conversation messages..." : "No linked message history found for this episode."}
                                </p>
                            ) : (
                                messages.map((m: any) => {
                                    const isInbound = m.direction === "INBOUND";
                                    return (
                                        <div
                                            key={m.id}
                                            className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                                                isInbound
                                                    ? "bg-white border border-slate-200 text-slate-800 mr-auto"
                                                    : "bg-violet-600 text-white ml-auto"
                                            }`}
                                        >
                                            <div className={`flex items-center justify-between gap-3 text-[10px] mb-1 ${isInbound ? "text-slate-400" : "text-violet-200"}`}>
                                                <span className="font-bold uppercase">
                                                    {isInbound ? `${cust.customer_name || "Customer"} (${m.channel})` : `Spectra AI (${m.channel})`}
                                                </span>
                                                <span>{formatDateTime(m.sent_or_received_at || m.created_at)}</span>
                                            </div>
                                            <p className="whitespace-pre-wrap leading-relaxed">{m.body_text}</p>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
