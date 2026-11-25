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
    Receipt,
    ShieldCheck,
    AlertCircle,
    Info,
    Calendar,
    Clock,
    X,
} from "lucide-react";
import { format } from "date-fns";
import { executeApprovalAction, AUTHORIZED_REVIEWER_EMAILS, ApprovalActionResult } from "@/lib/approvals-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const APPROVAL_STATUS_META: Record<string, { label: string; short: string; color: string; step: number }> = {
    SPECTRA_REVIEW_REQUIRED: {
        label: "New quote created, waiting team review & approval",
        short: "Spectra Review Required",
        color: "bg-amber-50 text-amber-800 border-amber-200",
        step: 1,
    },
    AWAITING_CUSTOMER_ACCEPTANCE: {
        label: "Quote approved by team, sent to customer (waiting YES)",
        short: "Awaiting Customer Acceptance",
        color: "bg-indigo-50 text-indigo-800 border-indigo-200",
        step: 2,
    },
    SPECTRA_COMMERCIAL_APPROVED: {
        label: "Quote approved, awaiting customer acceptance",
        short: "Commercial Approved",
        color: "bg-teal-50 text-teal-800 border-teal-200",
        step: 2,
    },
    JOB_AUTHORIZATION_PENDING: {
        label: "Customer accepted quote, waiting dispatch authorization",
        short: "Job Authorization Pending",
        color: "bg-purple-50 text-purple-800 border-purple-200",
        step: 3,
    },
    CUSTOMER_ACCEPTED: {
        label: "Customer agreed to quote, pending job authorization",
        short: "Job Authorization Pending",
        color: "bg-purple-50 text-purple-800 border-purple-200",
        step: 3,
    },
    JOB_CREATED_UNASSIGNED: {
        label: "Job booked & created in eWorks CRM",
        short: "Job Created (eWorks)",
        color: "bg-emerald-50 text-emerald-800 border-emerald-200",
        step: 4,
    },
    JOB_AUTHORIZED: {
        label: "Job authorized & created in eWorks",
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
    onActionCompleted?: () => void;
}

export function ApprovalDetailModal({
    approval,
    open,
    onOpenChange,
    onActionCompleted,
}: ApprovalDetailModalProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

    // Interactive Action State
    const [modalPrice, setModalPrice] = useState<string>("");
    const [modalSchedule, setModalSchedule] = useState<string>("");
    const [modalNotes, setNotes] = useState<string>("");
    const [modalReviewer, setModalReviewer] = useState<string>("marketing@spectradubai.com");
    const [rejectReason, setRejectReason] = useState<string>("Property located outside designated service community.");
    const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
    const [submittingAction, setSubmittingAction] = useState<string | null>(null);
    const [modalCooldownSeconds, setModalCooldownSeconds] = useState<number>(0);
    const [modalFeedback, setModalFeedback] = useState<{
        type: "success" | "info" | "error";
        message: string;
    } | null>(null);

    // 30s Cooldown timer to prevent double-clicks while backend updates
    useEffect(() => {
        if (modalCooldownSeconds <= 0) return;
        const timer = setInterval(() => {
            setModalCooldownSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [modalCooldownSeconds]);

    useEffect(() => {
        if (!approval || !open) return;

        // Autofill state
        const initialP = Number(
            approval.total_aed ??
            approval.approved_total ??
            approval.resolved_proposed_total ??
            0
        ).toFixed(2);
        setModalPrice(initialP);

        const initialSched =
            approval.requested_timing ||
            approval.proposal_payload?.preferred_timing ||
            approval.approved_payload?.timing ||
            "Tomorrow at 4:00 PM";
        setModalSchedule(initialSched);

        const isDispatch =
            approval.status === "JOB_AUTHORIZATION_PENDING" ||
            approval.status === "CUSTOMER_ACCEPTED";

        setModalReviewer(isDispatch ? "dispatch@spectradubai.com" : "marketing@spectradubai.com");
        setNotes(
            isDispatch
                ? "Confirmed schedule with customer. Central dispatch handling technician assignment."
                : "Approved via Spectra Operations Portal"
        );
        setShowRejectInput(false);
        setModalFeedback(null);

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

    const handleModalAction = async (actionType: string, customPayload: Record<string, any> = {}) => {
        if (!approval || modalCooldownSeconds > 0 || submittingAction !== null) return;
        setSubmittingAction(actionType);
        setModalCooldownSeconds(30);
        setModalFeedback(null);

        const isDispatch =
            approval.status === "JOB_AUTHORIZATION_PENDING" ||
            approval.status === "CUSTOMER_ACCEPTED";

        const token = isDispatch
            ? approval.job_auth_token || approval.job_auth_id || `SPECTRA-JOB-AUTH-${approval.approval_id?.replace("SPECTRA-APPROVAL-", "")}`
            : approval.approval_id;

        const payload = {
            action: actionType as any,
            token,
            reviewer_email: modalReviewer,
            ...customPayload,
        };

        try {
            const res: ApprovalActionResult = await executeApprovalAction(payload);
            if (res.action_executed === "NO_OP_ALREADY_PROCESSED") {
                setModalFeedback({
                    type: "info",
                    message: "Notice: This proposal was already approved via Email/Frontend.",
                });
            } else if (res.success) {
                if (actionType === "AUTHORIZE_JOB" && res.job_id) {
                    setModalFeedback({
                        type: "success",
                        message: `eWorks Job #${res.job_id} successfully created & dispatched!`,
                    });
                } else if (actionType === "APPROVE_QUOTE" || actionType === "APPROVE") {
                    setModalFeedback({
                        type: "success",
                        message: "Quote approved! Outbound proposal sent to customer on WhatsApp/Email.",
                    });
                } else if (actionType === "REVISE_QUOTE") {
                    setModalFeedback({
                        type: "success",
                        message: `Price revised to AED ${Number(modalPrice).toFixed(2)}.`,
                    });
                } else {
                    setModalFeedback({
                        type: "success",
                        message: "Action completed successfully.",
                    });
                }
            } else {
                setModalFeedback({
                    type: "error",
                    message: res.error || "Failed to process approval action.",
                });
            }

            if (onActionCompleted) {
                setTimeout(() => {
                    onActionCompleted();
                }, 1600);
            }
        } catch (err: any) {
            setModalFeedback({
                type: "error",
                message: `Network error: ${err.message}`,
            });
        } finally {
            setSubmittingAction(null);
        }
    };

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
        { step: 1, key: "SPECTRA_REVIEW_REQUIRED", label: "Quote Review Required" },
        { step: 2, key: "AWAITING_CUSTOMER_ACCEPTANCE", label: "Awaiting Customer" },
        { step: 3, key: "JOB_AUTHORIZATION_PENDING", label: "Job Dispatch Pending" },
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

                    {/* Feedback Toast Notice */}
                    {modalFeedback && (
                        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                            modalFeedback.type === "success"
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                                : modalFeedback.type === "info"
                                ? "bg-blue-50 border-blue-300 text-blue-900"
                                : "bg-rose-50 border-rose-300 text-rose-900"
                        }`}>
                            {modalFeedback.type === "success" && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                            {modalFeedback.type === "info" && <Info className="h-4 w-4 text-blue-600 shrink-0" />}
                            {modalFeedback.type === "error" && <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                            <span className="font-bold">{modalFeedback.message}</span>
                        </div>
                    )}

                    {/* Interactive Action Bar (Gate 1: Review Required) */}
                    {approval.status === "SPECTRA_REVIEW_REQUIRED" && (
                        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                                    <span>Execute Commercial Quotation Review</span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">Reviewer: {modalReviewer}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                        Approved Price (AED incl. VAT):
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={modalPrice}
                                        onChange={(e) => setModalPrice(e.target.value)}
                                        className="h-8 text-xs font-bold font-mono bg-white border-amber-300"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                        Schedule Window:
                                    </label>
                                    <Input
                                        type="text"
                                        value={modalSchedule}
                                        onChange={(e) => setModalSchedule(e.target.value)}
                                        className="h-8 text-xs bg-white border-amber-300"
                                    />
                                </div>
                            </div>

                            {showRejectInput && (
                                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 space-y-2">
                                    <label className="text-[11px] font-bold text-rose-900 block">Rejection Reason:</label>
                                    <Input
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="h-8 text-xs bg-white border-rose-300"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs"
                                            disabled={submittingAction !== null || modalCooldownSeconds > 0}
                                            onClick={() => setShowRejectInput(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-7 text-xs bg-rose-700 hover:bg-rose-800 text-white font-bold"
                                            disabled={submittingAction !== null || modalCooldownSeconds > 0}
                                            onClick={() => handleModalAction("REJECT_QUOTE", { reason: rejectReason })}
                                        >
                                            {submittingAction === "REJECT_QUOTE"
                                                ? "Declining..."
                                                : modalCooldownSeconds > 0
                                                ? `Locked (${modalCooldownSeconds}s)`
                                                : "Confirm Rejection"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Cooldown Status Notification */}
                            {modalCooldownSeconds > 0 && (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-950 text-xs animate-pulse">
                                    <Clock className="h-4 w-4 text-amber-700 shrink-0" />
                                    <span>
                                        Action submitted. Buttons locked for <strong>{modalCooldownSeconds}s</strong> to prevent double-clicking while backend updates.
                                    </span>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Button
                                    size="sm"
                                    disabled={submittingAction !== null || modalCooldownSeconds > 0}
                                    onClick={() => handleModalAction("APPROVE_QUOTE", { price: Number(modalPrice), date: modalSchedule, time: modalSchedule, notes: modalNotes })}
                                    className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg gap-1.5"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    <span>
                                        {submittingAction === "APPROVE_QUOTE"
                                            ? "Approving..."
                                            : modalCooldownSeconds > 0
                                            ? `Processing... (${modalCooldownSeconds}s)`
                                            : `⚡ 1-Click Approve (AED ${modalPrice})`}
                                    </span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={submittingAction !== null || modalCooldownSeconds > 0}
                                    onClick={() => handleModalAction("REVISE_QUOTE", { price: Number(modalPrice), notes: modalNotes })}
                                    className="h-8 text-xs font-bold bg-white text-blue-700 border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg gap-1.5"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>
                                        {submittingAction === "REVISE_QUOTE"
                                            ? "Saving..."
                                            : modalCooldownSeconds > 0
                                            ? `Locked (${modalCooldownSeconds}s)`
                                            : "📝 Save Price Revision"}
                                    </span>
                                </Button>
                                {!showRejectInput && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={submittingAction !== null || modalCooldownSeconds > 0}
                                        onClick={() => setShowRejectInput(true)}
                                        className="h-8 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                                    >
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        {modalCooldownSeconds > 0 ? `Locked (${modalCooldownSeconds}s)` : "Decline"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Interactive Action Bar (Gate 2: Dispatch Pending) */}
                    {(approval.status === "JOB_AUTHORIZATION_PENDING" || approval.status === "CUSTOMER_ACCEPTED") && (
                        <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-300 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-900">
                                    <Briefcase className="h-4 w-4 text-purple-600" />
                                    <span>Authorize Technician Job Dispatch (Gate 2)</span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">Dispatcher: {modalReviewer}</span>
                            </div>
                            <p className="text-xs text-purple-900">Customer accepted quote. Confirm technician arrival window:</p>

                            {/* Cooldown Status Notification */}
                            {modalCooldownSeconds > 0 && (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-100/80 border border-purple-300 text-purple-950 text-xs animate-pulse">
                                    <Clock className="h-4 w-4 text-purple-700 shrink-0" />
                                    <span>
                                        Dispatch request submitted. Buttons locked for <strong>{modalCooldownSeconds}s</strong> while backend registers job in Eworks CRM.
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Input
                                    value={modalSchedule}
                                    onChange={(e) => setModalSchedule(e.target.value)}
                                    placeholder="e.g. Thursday 18th Nov in the afternoon"
                                    className="h-9 text-xs bg-white border-purple-300 font-medium flex-1"
                                />
                                <Button
                                    size="sm"
                                    disabled={submittingAction !== null || modalCooldownSeconds > 0}
                                    onClick={() => handleModalAction("AUTHORIZE_JOB", { approved_date: modalSchedule, notes: modalNotes })}
                                    className="h-9 text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-sm gap-1.5"
                                >
                                    <Briefcase className="h-3.5 w-3.5" />
                                    <span>
                                        {submittingAction === "AUTHORIZE_JOB"
                                            ? "Creating Eworks Job..."
                                            : modalCooldownSeconds > 0
                                            ? `Dispatching... (${modalCooldownSeconds}s)`
                                            : "🚀 Authorize & Dispatch Job"}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
