"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    executeApprovalAction,
    AUTHORIZED_REVIEWER_EMAILS,
    ApprovalActionResult,
} from "@/lib/approvals-client";
import {
    formatAed,
    formatDateTime,
    APPROVAL_STATUS_META,
} from "./approval-detail-modal";
import {
    ShieldCheck,
    Briefcase,
    Copy,
    Check,
    Send,
    AlertCircle,
    Info,
    Calendar,
    User,
    MapPin,
    Phone,
    Mail,
    FileText,
    ChevronDown,
    ChevronUp,
    Eye,
    Receipt,
    Clock,
    X,
} from "lucide-react";

export interface ApprovalActionCardProps {
    record: any;
    onActionCompleted?: () => void;
    onViewDetails?: (record: any) => void;
}

export function ApprovalActionCard({
    record,
    onActionCompleted,
    onViewDetails,
}: ApprovalActionCardProps) {
    const isReviewRequired = record.status === "SPECTRA_REVIEW_REQUIRED";
    const isDispatchPending =
        record.status === "JOB_AUTHORIZATION_PENDING" ||
        record.status === "CUSTOMER_ACCEPTED";
    const isJobCreated =
        record.status === "JOB_CREATED_UNASSIGNED" ||
        record.status === "JOB_AUTHORIZED";
    const isAwaitingCustomer =
        record.status === "AWAITING_CUSTOMER_ACCEPTANCE" ||
        record.status === "SPECTRA_COMMERCIAL_APPROVED";
    const isRejected =
        record.status === "REJECTED" || record.status === "CANCELLED";

    // Autofill state
    const initialPrice = Number(
        record.total_aed ??
        record.approved_total ??
        record.resolved_proposed_total ??
        0
    ).toFixed(2);

    const [price, setPrice] = useState<string>(initialPrice);
    const [schedule, setSchedule] = useState<string>(
        record.requested_timing ||
        record.proposal_payload?.preferred_timing ||
        "Tomorrow at 4:00 PM"
    );
    const [reviewerEmail, setReviewerEmail] = useState<string>(
        isDispatchPending
            ? "dispatch@spectradubai.com"
            : "marketing@spectradubai.com"
    );
    const [notes, setNotes] = useState<string>(
        isDispatchPending
            ? "Confirmed schedule with customer. Central dispatch handling technician assignment."
            : "Approved via Spectra Operations Portal"
    );
    const [rejectReason, setRejectReason] = useState<string>(
        "Property located outside designated service community."
    );
    const [showRejectBox, setShowRejectBox] = useState<boolean>(false);
    const [showAdvancedReviewer, setShowAdvancedReviewer] = useState<boolean>(false);

    const [submittingAction, setSubmittingAction] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{
        type: "success" | "info" | "error";
        message: string;
        details?: string;
    } | null>(null);

    const [copiedToken, setCopiedToken] = useState(false);

    const copyToken = () => {
        const token = isDispatchPending ? (record.job_auth_token || record.job_auth_id) : record.approval_id;
        if (token) {
            navigator.clipboard.writeText(token);
            setCopiedToken(true);
            setTimeout(() => setCopiedToken(false), 2000);
        }
    };

    const handleAction = async (actionType: string, customPayload: Record<string, any> = {}) => {
        setSubmittingAction(actionType);
        setFeedback(null);

        const token = isDispatchPending
            ? record.job_auth_token || record.job_auth_id || `SPECTRA-JOB-AUTH-${record.approval_id?.replace("SPECTRA-APPROVAL-", "")}`
            : record.approval_id;

        const payload = {
            action: actionType as any,
            token,
            reviewer_email: reviewerEmail,
            ...customPayload,
        };

        try {
            const res: ApprovalActionResult = await executeApprovalAction(payload);

            if (res.action_executed === "NO_OP_ALREADY_PROCESSED") {
                setFeedback({
                    type: "info",
                    message: "Notice: This proposal was already approved via Email or prior action.",
                    details: res.message || "State updated to prevent regression.",
                });
            } else if (res.success) {
                if (actionType === "AUTHORIZE_JOB" && res.job_id) {
                    setFeedback({
                        type: "success",
                        message: `eWorks Job #${res.job_id} successfully created & dispatched!`,
                        details: "Central dispatch van assignment unlocked.",
                    });
                } else if (actionType === "APPROVE_QUOTE" || actionType === "APPROVE") {
                    setFeedback({
                        type: "success",
                        message: "Quotation approved! Outbound proposal sent to customer on WhatsApp/Email.",
                    });
                } else if (actionType === "REVISE_QUOTE") {
                    setFeedback({
                        type: "success",
                        message: `Price revised to AED ${Number(price).toFixed(2)}. Updated benchmark stored.`,
                    });
                } else if (actionType === "REJECT_QUOTE") {
                    setFeedback({
                        type: "info",
                        message: "Quotation declined/rejected. Commercial episode closed.",
                    });
                } else {
                    setFeedback({
                        type: "success",
                        message: "Action completed successfully.",
                    });
                }
            } else {
                setFeedback({
                    type: "error",
                    message: res.error || "Failed to process approval action.",
                });
            }

            if (onActionCompleted) {
                setTimeout(() => {
                    onActionCompleted();
                }, 1800);
            }
        } catch (err: any) {
            setFeedback({
                type: "error",
                message: `Network or runtime error: ${err.message}`,
            });
        } finally {
            setSubmittingAction(null);
        }
    };

    const statusMeta = APPROVAL_STATUS_META[record.status] || {
        short: record.status?.replace(/_/g, " "),
        color: "bg-slate-100 text-slate-700 border-slate-200",
    };

    const activeToken = isDispatchPending
        ? (record.job_auth_token || record.job_auth_id || `SPECTRA-JOB-AUTH-${record.approval_id?.replace("SPECTRA-APPROVAL-", "")}`)
        : record.approval_id;

    return (
        <div className={`rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden bg-white ${
            isReviewRequired
                ? "border-amber-300 ring-2 ring-amber-400/20 shadow-amber-100/40"
                : isDispatchPending
                ? "border-purple-300 ring-2 ring-purple-400/20 shadow-purple-100/40"
                : isJobCreated
                ? "border-emerald-200"
                : "border-slate-200"
        }`}>
            {/* Top Bar: Token & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={copyToken}
                        title="Click to copy token"
                        className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <span>{activeToken}</span>
                        {copiedToken ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                        )}
                    </button>

                    <Badge variant="outline" className={`text-xs font-bold border ${statusMeta.color}`}>
                        {statusMeta.short}
                    </Badge>

                    {record.eworks_quote_number && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold font-mono">
                            Quote #{record.eworks_quote_number}
                        </span>
                    )}

                    {record.job_id && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> Job #{record.job_id}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatDateTime(record.created_at)}
                    </span>
                    {onViewDetails && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(record)}
                            className="h-7 text-xs text-violet-700 hover:bg-violet-50 px-2 gap-1"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspect</span>
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* 2-Column Grid: Customer Profile & Service Scope */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Profile */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <User className="h-3 w-3 text-violet-600" /> Customer Profile
                            </span>
                            {record.customer?.eworks_customer_id && (
                                <span className="text-[10px] font-mono text-slate-500">
                                    CRM #{record.customer.eworks_customer_id}
                                </span>
                            )}
                        </div>
                        <div className="text-sm font-extrabold text-slate-900">
                            {record.customer_name || record.customer?.full_name || record.customer?.customer_name || "Customer"}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            {(record.customer_phone || record.customer?.phone_e164) && (
                                <span className="flex items-center gap-1 font-mono font-medium">
                                    <Phone className="h-3 w-3 text-emerald-600" />
                                    {record.customer_phone || record.customer?.phone_e164}
                                </span>
                            )}
                            {(record.customer_email || record.customer?.email) && (
                                <span className="flex items-center gap-1 text-slate-500">
                                    <Mail className="h-3 w-3 text-blue-600" />
                                    {record.customer_email || record.customer?.email}
                                </span>
                            )}
                        </div>
                        <div className="pt-1 border-t border-slate-200/60 text-xs text-slate-700 flex items-start gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="leading-tight">
                                {record.property_address || record.resolved_address || "Address pending"}
                            </span>
                        </div>
                    </div>

                    {/* Service & Benchmark */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Receipt className="h-3 w-3 text-emerald-600" /> Service &amp; Proposed Benchmark
                        </span>
                        <div className="text-sm font-extrabold text-slate-900 truncate">
                            {record.service_title || record.resolved_service_name || "Maintenance Service"}
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                            <span>Benchmark Subtotal:</span>
                            <span className="font-mono font-medium text-slate-700">
                                {formatAed(record.subtotal_aed || record.proposal_payload?.subtotal || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>VAT (5%):</span>
                            <span className="font-mono font-medium text-slate-700">
                                {formatAed(record.vat_aed || record.proposal_payload?.vat_amount || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-extrabold text-emerald-700 pt-1 border-t border-slate-200/70">
                            <span>Total Amount (incl. VAT):</span>
                            <span className="font-mono text-base">
                                {formatAed(record.total_aed || record.approved_total || record.resolved_proposed_total || 0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Customer Context & Timing Banner */}
                <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-start gap-2 max-w-xl">
                        <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5">
                            {record.customer_channel || "WhatsApp"}
                        </span>
                        <p className="text-slate-800 italic leading-snug">
                            &ldquo;{record.latest_customer_message || record.proposal_payload?.service || "Requested quotation for service appointment"}&rdquo;
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-violet-950 font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-violet-200">
                        <Calendar className="h-3.5 w-3.5 text-violet-600" />
                        <span>{record.requested_timing || "Flexible schedule"}</span>
                    </div>
                </div>

                {/* Feedback Toast Notice */}
                {feedback && (
                    <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        feedback.type === "success"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                            : feedback.type === "info"
                            ? "bg-blue-50 border-blue-300 text-blue-900"
                            : "bg-rose-50 border-rose-300 text-rose-900"
                    }`}>
                        {feedback.type === "success" && <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
                        {feedback.type === "info" && <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
                        {feedback.type === "error" && <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                            <p className="font-bold">{feedback.message}</p>
                            {feedback.details && <p className="text-[11px] opacity-90 mt-0.5">{feedback.details}</p>}
                        </div>
                    </div>
                )}

                {/* GATE 1: COMMERCIAL QUOTATION REVIEW ACTIONS */}
                {isReviewRequired && (
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="p-1 rounded-md bg-amber-500 text-white">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                </span>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                    Commercial Quotation Review Actions (Gate 1)
                                </h4>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAdvancedReviewer(!showAdvancedReviewer)}
                                className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                            >
                                <span>Reviewer: {reviewerEmail}</span>
                                {showAdvancedReviewer ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                        </div>

                        {/* Reviewer Email Dropdown (Collapsible) */}
                        {showAdvancedReviewer && (
                            <div className="p-2.5 rounded-lg bg-white border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                        Reviewer Allowlist Email:
                                    </label>
                                    <select
                                        value={reviewerEmail}
                                        onChange={(e) => setReviewerEmail(e.target.value)}
                                        className="w-full h-8 text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-slate-800"
                                    >
                                        {AUTHORIZED_REVIEWER_EMAILS.map((email) => (
                                            <option key={email} value={email}>
                                                {email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                        Internal Audit Notes:
                                    </label>
                                    <Input
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Internal review audit notes..."
                                        className="h-8 text-xs bg-slate-50 border-slate-300"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Autofill Form Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                    Approved Price (AED incl. 5% VAT):
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        AED
                                    </span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="pl-12 h-9 text-xs font-bold font-mono bg-white border-amber-300 text-slate-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                    Schedule / Arrival Window:
                                </label>
                                <Input
                                    type="text"
                                    value={schedule}
                                    onChange={(e) => setSchedule(e.target.value)}
                                    placeholder="e.g. Tomorrow at 4:00 PM"
                                    className="h-9 text-xs bg-white border-amber-300 text-slate-900"
                                />
                            </div>
                        </div>

                        {/* Rejection Input Box (Collapsible) */}
                        {showRejectBox && (
                            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-2">
                                <label className="text-[11px] font-bold text-rose-900 block">
                                    Reason for Declining Quotation:
                                </label>
                                <Input
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Specify why this service request cannot be fulfilled..."
                                    className="h-8 text-xs bg-white border-rose-300 text-slate-900"
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowRejectBox(false)}
                                        className="h-7 text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={submittingAction !== null}
                                        onClick={() => handleAction("REJECT_QUOTE", { reason: rejectReason })}
                                        className="h-7 text-xs bg-rose-700 hover:bg-rose-800 text-white font-bold"
                                    >
                                        {submittingAction === "REJECT_QUOTE" ? "Declining..." : "Confirm Rejection"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Main Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button
                                type="button"
                                size="sm"
                                disabled={submittingAction !== null}
                                onClick={() =>
                                    handleAction("APPROVE_QUOTE", {
                                        price: Number(price),
                                        date: schedule,
                                        time: schedule,
                                        notes,
                                    })
                                }
                                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl shadow-xs transition-all gap-1.5 cursor-pointer"
                            >
                                <Check className="h-3.5 w-3.5" />
                                <span>
                                    {submittingAction === "APPROVE_QUOTE"
                                        ? "Sending Outbound Quote..."
                                        : `⚡ 1-Click Approve (AED ${Number(price || 0).toFixed(2)})`}
                                </span>
                            </Button>

                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={submittingAction !== null}
                                onClick={() =>
                                    handleAction("REVISE_QUOTE", {
                                        price: Number(price),
                                        notes: `Revised to AED ${Number(price).toFixed(2)} via Portal`,
                                    })
                                }
                                className="h-9 text-xs font-bold bg-white hover:bg-blue-50 text-blue-700 border-blue-300 px-3.5 rounded-xl transition-all gap-1.5 cursor-pointer"
                            >
                                <FileText className="h-3.5 w-3.5 text-blue-600" />
                                <span>
                                    {submittingAction === "REVISE_QUOTE"
                                        ? "Saving Revision..."
                                        : "📝 Save Price Revision"}
                                </span>
                            </Button>

                            {!showRejectBox && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={submittingAction !== null}
                                    onClick={() => setShowRejectBox(true)}
                                    className="h-9 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-900 ml-auto px-3 rounded-xl cursor-pointer"
                                >
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Decline / Reject
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* GATE 2: TECHNICIAN DISPATCH AUTHORIZATION */}
                {isDispatchPending && (
                    <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/90 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="p-1 rounded-md bg-purple-600 text-white">
                                    <Briefcase className="h-3.5 w-3.5" />
                                </span>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                                    Technician Dispatch Authorization (Gate 2)
                                </h4>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAdvancedReviewer(!showAdvancedReviewer)}
                                className="text-[11px] font-semibold text-purple-800 hover:text-purple-950 flex items-center gap-1 cursor-pointer"
                            >
                                <span>Dispatcher: {reviewerEmail}</span>
                                {showAdvancedReviewer ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                        </div>

                        <p className="text-xs text-purple-900 leading-snug">
                            Customer accepted quotation. Confirm arrival appointment window and authorize unassigned job creation in Eworks CRM:
                        </p>

                        {/* Reviewer Email Dropdown (Collapsible) */}
                        {showAdvancedReviewer && (
                            <div className="p-2.5 rounded-lg bg-white border border-purple-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                        Dispatcher Email:
                                    </label>
                                    <select
                                        value={reviewerEmail}
                                        onChange={(e) => setReviewerEmail(e.target.value)}
                                        className="w-full h-8 text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-slate-800"
                                    >
                                        {AUTHORIZED_REVIEWER_EMAILS.map((email) => (
                                            <option key={email} value={email}>
                                                {email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                        Dispatch Notes:
                                    </label>
                                    <Input
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Internal dispatch notes..."
                                        className="h-8 text-xs bg-slate-50 border-slate-300"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                            <div className="flex-1">
                                <Input
                                    type="text"
                                    value={schedule}
                                    onChange={(e) => setSchedule(e.target.value)}
                                    placeholder="e.g. Thursday 18th Nov in the afternoon"
                                    className="h-10 text-xs bg-white border-purple-300 text-slate-900 font-medium"
                                />
                            </div>

                            <Button
                                type="button"
                                disabled={submittingAction !== null}
                                onClick={() =>
                                    handleAction("AUTHORIZE_JOB", {
                                        approved_date: schedule,
                                        notes,
                                    })
                                }
                                className="h-10 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-5 rounded-xl shadow-md transition-all gap-1.5 shrink-0 cursor-pointer"
                            >
                                <Briefcase className="h-3.5 w-3.5" />
                                <span>
                                    {submittingAction === "AUTHORIZE_JOB"
                                        ? "Registering in Eworks CRM..."
                                        : "🚀 Authorize & Dispatch Job"}
                                </span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* GATE 3: REGISTERED EWORKS JOB BANNER */}
                {isJobCreated && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="p-1 rounded-full bg-emerald-600 text-white">
                                <Check className="h-3 w-3" />
                            </span>
                            <span className="font-semibold">
                                ✓ eWorks Job registered <strong>(#{record.job_id})</strong>
                                {record.eworks_quote_number ? ` with Quote #${record.eworks_quote_number}` : ""}. Central dispatch holds technician assignment.
                            </span>
                        </div>
                        {record.job_id && (
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Job #{record.job_id}
                            </span>
                        )}
                    </div>
                )}

                {/* WAITING FOR CUSTOMER BANNER */}
                {isAwaitingCustomer && (
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Send className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span>
                                Formal quotation presented to lead via WhatsApp/Email. Awaiting customer acceptance.
                            </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200">
                            Sent to Lead
                        </span>
                    </div>
                )}

                {/* REJECTED BANNER */}
                {isRejected && (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                        <X className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>
                            Commercial quotation was declined or cancelled.{" "}
                            {record.rejection_reason && (
                                <span className="font-semibold text-slate-800">
                                    Reason: &ldquo;{record.rejection_reason}&rdquo;
                                </span>
                            )}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
