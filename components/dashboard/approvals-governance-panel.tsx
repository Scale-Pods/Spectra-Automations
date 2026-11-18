"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { getCachedData, setCachedData } from "@/lib/cache-utils";
import { ApprovalActionCard } from "./approval-action-card";
import {
    ApprovalDetailModal,
    APPROVAL_STATUS_META,
    NOTIFICATION_TYPE_META,
    NOTIFICATION_STATUS_META,
    formatAed,
    formatDateTime,
} from "./approval-detail-modal";
import {
    ShieldCheck,
    Mail,
    Clock,
    Search,
    RefreshCw,
    Monitor,
    Briefcase,
    ArrowUpRight,
    Bell,
    Send,
    ChevronLeft,
    ChevronRight,
    Eye,
    LayoutGrid,
    List,
    Check,
} from "lucide-react";

const PAGE_SIZE = 10;

interface ApprovalsGovernancePanelProps {
    customerId?: string;
    compact?: boolean;
}

export function ApprovalsGovernancePanel({ customerId, compact = false }: ApprovalsGovernancePanelProps) {
    const initialCacheKey = `approvals-panel:${customerId || 'all'}:${subDays(new Date(), 7).toISOString().slice(0, 10)}:${new Date().toISOString().slice(0, 10)}`;
    const cachedInitial = getCachedData<any>(initialCacheKey);

    const [activeTab, setActiveTab] = useState<"approvals" | "notifications">("approvals");
    const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
    const [autoSync, setAutoSync] = useState<boolean>(false);
    const [loading, setLoading] = useState(!cachedInitial);
    const [refreshing, setRefreshing] = useState(false);

    // Date filter: default to Last 7 days in dashboard view
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
        customerId
            ? undefined
            : {
                  from: startOfDay(subDays(new Date(), 7)),
                  to: new Date(),
              }
    );

    const [approvals, setApprovals] = useState<any[]>(() => cachedInitial?.approvals || []);
    const [notifications, setNotifications] = useState<any[]>(() => cachedInitial?.notifications || []);
    const [approvalsSummary, setApprovalsSummary] = useState<any>(() => cachedInitial?.approvalsSummary || {
        total: 0,
        reviewRequired: 0,
        awaitingCustomer: 0,
        customerAccepted: 0,
        jobCreated: 0,
        rejected: 0,
        totalApprovedAed: 0,
    });
    const [notificationsSummary, setNotificationsSummary] = useState<any>(() => cachedInitial?.notificationsSummary || {
        total: 0,
        verifiedSent: 0,
        delivered: 0,
        failed: 0,
        byType: {},
    });

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>("ALL");
    const [notifTypeFilter, setNotifTypeFilter] = useState<string>("ALL");
    const [notifStatusFilter, setNotifStatusFilter] = useState<string>("ALL");

    // Pagination (10 items per page)
    const [approvalsPage, setApprovalsPage] = useState(1);
    const [notificationsPage, setNotificationsPage] = useState(1);

    // Read-only detail modal
    const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(
        async (showSpinner = true) => {
            if (showSpinner) setLoading(true);
            else setRefreshing(true);

            try {
                const params = new URLSearchParams();
                if (customerId) params.set("customer_id", customerId);
                if (dateRange?.from) {
                    params.set("from", startOfDay(new Date(dateRange.from)).toISOString());
                    const endTarget = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
                    params.set("to", endOfDay(endTarget).toISOString());
                }
                params.set("limit", "500");

                const res = await fetch(`/api/approvals?${params.toString()}`);
                const data = await res.json();
                if (data.success) {
                    setApprovals(data.approvals || []);
                    setNotifications(data.notifications || []);
                    if (data.approvalsSummary) setApprovalsSummary(data.approvalsSummary);
                    if (data.notificationsSummary) setNotificationsSummary(data.notificationsSummary);

                    const cacheKey = `approvals-panel:${customerId || 'all'}:${dateRange?.from?.toISOString().slice(0, 10) || 'all'}:${dateRange?.to?.toISOString().slice(0, 10) || 'all'}`;
                    setCachedData(cacheKey, data);
                }
            } catch (err) {
                console.error("Failed to fetch approvals & notifications:", err);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [customerId, dateRange]
    );

    useEffect(() => {
        const cacheKey = `approvals-panel:${customerId || 'all'}:${dateRange?.from?.toISOString().slice(0, 10) || 'all'}:${dateRange?.to?.toISOString().slice(0, 10) || 'all'}`;
        const hasCache = !!getCachedData(cacheKey);
        fetchData(!hasCache);
    }, [fetchData, customerId, dateRange]);

    useEffect(() => {
        if (!autoSync) return;
        const timer = setInterval(() => {
            fetchData(false);
        }, 5000);
        return () => clearInterval(timer);
    }, [autoSync, fetchData]);

    // Reset pagination when filters change
    useEffect(() => {
        setApprovalsPage(1);
    }, [searchQuery, approvalStatusFilter, dateRange]);

    useEffect(() => {
        setNotificationsPage(1);
    }, [searchQuery, notifTypeFilter, notifStatusFilter, dateRange]);

    const filteredApprovals = useMemo(() => {
        return approvals.filter((a) => {
            if (approvalStatusFilter !== "ALL") {
                if (approvalStatusFilter === "REJECTED") {
                    if (a.status !== "REJECTED" && a.status !== "CANCELLED") return false;
                } else if (a.status !== approvalStatusFilter) {
                    return false;
                }
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const haystack = [
                    a.approval_id,
                    a.resolved_service_name,
                    a.service_name,
                    a.reviewer,
                    a.job_id,
                    a.customer?.full_name,
                    a.customer?.customer_name,
                    a.customer?.phone_e164,
                    a.customer?.email,
                    a.resolved_address,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [approvals, approvalStatusFilter, searchQuery]);

    const filteredNotifications = useMemo(() => {
        return notifications.filter((n) => {
            if (notifTypeFilter !== "ALL" && n.notification_type !== notifTypeFilter) return false;
            if (notifStatusFilter !== "ALL" && n.status !== notifStatusFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const haystack = [
                    n.notification_key,
                    n.notification_type,
                    n.recipient,
                    n.status,
                    n.customer?.full_name,
                    n.customer?.customer_name,
                    n.customer?.phone_e164,
                    n.provider_message_id,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [notifications, notifTypeFilter, notifStatusFilter, searchQuery]);

    // Paginated slices (10 per page)
    const approvalsTotalPages = Math.max(1, Math.ceil(filteredApprovals.length / PAGE_SIZE));
    const safeApprovalsPage = Math.min(approvalsPage, approvalsTotalPages);
    const paginatedApprovals = useMemo(() => {
        const start = (safeApprovalsPage - 1) * PAGE_SIZE;
        return filteredApprovals.slice(start, start + PAGE_SIZE);
    }, [filteredApprovals, safeApprovalsPage]);

    const notificationsTotalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
    const safeNotificationsPage = Math.min(notificationsPage, notificationsTotalPages);
    const paginatedNotifications = useMemo(() => {
        const start = (safeNotificationsPage - 1) * PAGE_SIZE;
        return filteredNotifications.slice(start, start + PAGE_SIZE);
    }, [filteredNotifications, safeNotificationsPage]);

    const openRelatedApproval = (notif: any) => {
        const match =
            approvals.find((a) => notif.service_episode_id && a.service_episode_id === notif.service_episode_id) ||
            approvals.find((a) => notif.customer_id && a.customer_id === notif.customer_id);
        if (match) {
            setSelectedApproval(match);
            setIsModalOpen(true);
        }
    };

    const currentTotal = activeTab === "approvals" ? filteredApprovals.length : filteredNotifications.length;
    const currentPage = activeTab === "approvals" ? safeApprovalsPage : safeNotificationsPage;
    const currentTotalPages = activeTab === "approvals" ? approvalsTotalPages : notificationsTotalPages;
    const setCurrentPage = activeTab === "approvals" ? setApprovalsPage : setNotificationsPage;

    return (
        <div className="space-y-5">
            {/* Top Toolbar: Date Filter (Default Last 7 Days) & Read-Only Indicator */}
            {!compact && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 px-4 py-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <DateRangePicker
                            value={dateRange}
                            onUpdate={({ range }) => {
                                if (range?.from) {
                                    setDateRange(range);
                                }
                            }}
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant={dateRange === undefined ? "default" : "outline"}
                            onClick={() =>
                                setDateRange(
                                    dateRange === undefined
                                        ? { from: startOfDay(subDays(new Date(), 7)), to: new Date() }
                                        : undefined
                                )
                            }
                            className={`h-10 text-xs rounded-xl px-3.5 font-semibold ${
                                dateRange === undefined
                                    ? "bg-violet-600 hover:bg-violet-700 text-white"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            {dateRange === undefined ? "Showing All Time" : "Show All Time"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Top Summary Strip (Full View) */}
            {!compact && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card
                        onClick={() => {
                            setActiveTab("approvals");
                            setApprovalStatusFilter("SPECTRA_REVIEW_REQUIRED");
                        }}
                        className="bg-white/95 border border-amber-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl p-4 cursor-pointer"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Team Review Required</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{approvalsSummary.reviewRequired}</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">Waiting team review via Gmail</p>
                    </Card>

                    <Card
                        onClick={() => {
                            setActiveTab("approvals");
                            setApprovalStatusFilter("AWAITING_CUSTOMER_ACCEPTANCE");
                        }}
                        className="bg-white/95 border border-indigo-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl p-4 cursor-pointer"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Awaiting Customer</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{approvalsSummary.awaitingCustomer}</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                                <Send className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">Approved quotes sent to leads</p>
                    </Card>

                    <Card
                        onClick={() => {
                            setActiveTab("approvals");
                            setApprovalStatusFilter("JOB_CREATED_UNASSIGNED");
                        }}
                        className="bg-white/95 border border-emerald-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl p-4 cursor-pointer"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Booked in eWorks</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                                    {approvalsSummary.jobCreated}{" "}
                                    <span className="text-xs font-bold text-emerald-700 font-mono">
                                        ({formatAed(approvalsSummary.totalApprovedAed)})
                                    </span>
                                </h3>
                            </div>
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <Briefcase className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                            {approvalsSummary.customerAccepted} customer accepted · {approvalsSummary.rejected} rejected
                        </p>
                    </Card>

                    <Card
                        onClick={() => setActiveTab("notifications")}
                        className="bg-white/95 border border-violet-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl p-4 cursor-pointer"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">Governance Emails</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{notificationsSummary.total}</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-200">
                                <Mail className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                            {notificationsSummary.verifiedSent + notificationsSummary.delivered} sent/verified · {notificationsSummary.failed} failed
                        </p>
                    </Card>
                </div>
            )}

            {/* Main Read-Only Table Card */}
            <Card className="bg-white/95 border border-slate-200/90 shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Tab Switcher */}
                        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => setActiveTab("approvals")}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    activeTab === "approvals"
                                        ? "bg-white text-violet-900 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
                                <span>Commercial Approvals ({approvals.length})</span>
                                {approvalsSummary.reviewRequired > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                                        {approvalsSummary.reviewRequired}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("notifications")}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    activeTab === "notifications"
                                        ? "bg-white text-violet-900 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Bell className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Internal Governance Audit ({notifications.length})</span>
                            </button>
                        </div>

                        {/* Search, View Switcher & Refresh Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* View Switcher (Only on approvals tab) */}
                            {activeTab === "approvals" && (
                                <div className="flex items-center p-0.5 bg-slate-200/80 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("cards")}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                            viewMode === "cards"
                                                ? "bg-white text-violet-900 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                        title="Interactive Action Cards with 1-Click Approve & Dispatch"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5 text-violet-600" />
                                        <span>Action Cards</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("table")}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                            viewMode === "table"
                                                ? "bg-white text-violet-900 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                        title="Compact Tabular View"
                                    >
                                        <List className="h-3.5 w-3.5 text-violet-600" />
                                        <span>Table</span>
                                    </button>
                                </div>
                            )}

                            {/* Auto-Sync Toggle */}
                            <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs select-none">
                                <input
                                    type="checkbox"
                                    checked={autoSync}
                                    onChange={(e) => setAutoSync(e.target.checked)}
                                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-3.5 w-3.5"
                                />
                                <span className="font-semibold text-[11px]">
                                    {autoSync ? "Syncing (5s)" : "Auto-Sync"}
                                </span>
                            </label>

                            <div className="relative w-full sm:w-56">
                                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={activeTab === "approvals" ? "Search ID, customer, service..." : "Search recipient, key..."}
                                    className="pl-8 h-8 text-xs bg-white border-slate-200 rounded-xl"
                                />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fetchData(false)}
                                disabled={refreshing}
                                className="h-8 text-xs rounded-xl border-slate-200 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 gap-1.5 cursor-pointer"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-violet-600" : ""}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    {activeTab === "approvals" ? (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            {[
                                { id: "ALL", label: `All (${approvals.length})` },
                                { id: "SPECTRA_REVIEW_REQUIRED", label: `Pending Team Review (${approvalsSummary.reviewRequired})` },
                                { id: "AWAITING_CUSTOMER_ACCEPTANCE", label: `Awaiting Customer (${approvalsSummary.awaitingCustomer})` },
                                { id: "CUSTOMER_ACCEPTED", label: `Customer Accepted (${approvalsSummary.customerAccepted})` },
                                { id: "JOB_CREATED_UNASSIGNED", label: `Job Created (${approvalsSummary.jobCreated})` },
                                { id: "REJECTED", label: `Rejected (${approvalsSummary.rejected})` },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setApprovalStatusFilter(f.id)}
                                    className={`px-2.5 py-1 rounded-full font-semibold border transition-all ${
                                        approvalStatusFilter === f.id
                                            ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            {["ALL", "COMMERCIAL_REVIEW", "CALLBACK_REQUEST", "JOB_AUTHORIZATION", "JOB_CREATED", "COMPLIANCE_ESCALATION", "URGENT_SAFETY", "EWORKS_FAILURE"].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setNotifTypeFilter(t)}
                                    className={`px-2.5 py-1 rounded-full font-semibold border transition-all ${
                                        notifTypeFilter === t
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    {t === "ALL" ? "All Types" : (NOTIFICATION_TYPE_META[t]?.label || t)}
                                </button>
                            ))}
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-violet-600" />
                            <span>Loading live approvals &amp; governance audit logs...</span>
                        </div>
                    ) : activeTab === "approvals" ? (
                        viewMode === "cards" ? (
                            <div className="p-5 space-y-4 bg-slate-50/50">
                                {paginatedApprovals.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                                        No commercial approvals match the selected filter or date range.
                                    </div>
                                ) : (
                                    paginatedApprovals.map((a) => (
                                        <ApprovalActionCard
                                            key={a.id || a.approval_id}
                                            record={a}
                                            onActionCompleted={() => fetchData(false)}
                                            onViewDetails={(rec) => {
                                                setSelectedApproval(rec);
                                                setIsModalOpen(true);
                                            }}
                                        />
                                    ))
                                )}
                            </div>
                        ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider">
                                        <th className="p-3.5">Approval ID</th>
                                        <th className="p-3.5">Customer &amp; Address</th>
                                        <th className="p-3.5">Service Scope</th>
                                        <th className="p-3.5">Pipeline Status</th>
                                        <th className="p-3.5">Total (AED)</th>
                                        <th className="p-3.5">Reviewer &amp; Channel</th>
                                        <th className="p-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedApprovals.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-slate-400">
                                                No commercial approval records match the selected date range or filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedApprovals.map((a) => {
                                            const meta = APPROVAL_STATUS_META[a.status] || {
                                                short: a.status,
                                                color: "bg-slate-100 text-slate-700 border-slate-200",
                                            };
                                            const isPendingReview = a.status === "SPECTRA_REVIEW_REQUIRED";
                                            const isDispatch = a.status === "JOB_AUTHORIZATION_PENDING" || a.status === "CUSTOMER_ACCEPTED";
                                            return (
                                                <tr
                                                    key={a.id}
                                                    onClick={() => {
                                                        setSelectedApproval(a);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className={`hover:bg-slate-50/90 transition-colors cursor-pointer ${
                                                        isPendingReview ? "bg-amber-50/30" : ""
                                                    }`}
                                                >
                                                    <td className="p-3.5">
                                                        <div className="font-mono font-bold text-slate-900">{a.approval_id}</div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                                             {formatDateTime(a.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-slate-900">
                                                            {a.customer?.full_name || a.customer?.customer_name || "Customer"}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500">
                                                            {a.customer?.phone_e164 || a.customer?.email || "N/A"}
                                                        </div>
                                                        {a.resolved_address && (
                                                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                                                {a.resolved_address}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-semibold text-slate-900">{a.resolved_service_name}</div>
                                                        <div className="text-[10px] text-slate-500">
                                                            {a.approval_type || "QUOTE"} {a.related_task_id ? `· Task #${a.related_task_id}` : ""}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <Badge variant="outline" className={`text-[10px] font-bold border ${meta.color}`}>
                                                            {meta.short}
                                                        </Badge>
                                                        {a.job_id && (
                                                            <div className="mt-1">
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                                                                    <Briefcase className="h-2.5 w-2.5" /> Job #{a.job_id}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 font-mono font-bold text-slate-900">
                                                        {formatAed(a.approved_total ?? a.resolved_proposed_total, a.currency || "AED")}
                                                    </td>
                                                    <td className="p-3.5">
                                                        {a.reviewer ? (
                                                            <div>
                                                                <div className="font-medium text-slate-800 truncate max-w-[160px]">{a.reviewer}</div>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <span
                                                                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                                                            a.review_channel === "FRONTEND"
                                                                                ? "bg-violet-100 text-violet-800"
                                                                                : "bg-slate-100 text-slate-700"
                                                                        }`}
                                                                    >
                                                                        {a.review_channel === "FRONTEND" ? (
                                                                            <Monitor className="h-2.5 w-2.5" />
                                                                        ) : (
                                                                            <Mail className="h-2.5 w-2.5" />
                                                                        )}
                                                                        {a.review_channel || "GMAIL"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic text-[11px]">Unreviewed</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {isPendingReview ? (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedApproval(a);
                                                                        setIsModalOpen(true);
                                                                    }}
                                                                    className="h-7 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-2.5 gap-1 cursor-pointer"
                                                                >
                                                                    <Check className="h-3 w-3" />
                                                                    <span>Review</span>
                                                                </Button>
                                                            ) : isDispatch ? (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedApproval(a);
                                                                        setIsModalOpen(true);
                                                                    }}
                                                                    className="h-7 text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-2.5 gap-1 cursor-pointer"
                                                                >
                                                                    <Briefcase className="h-3 w-3" />
                                                                    <span>Dispatch</span>
                                                                </Button>
                                                            ) : null}
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-[11px] bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-2.5 gap-1"
                                                            >
                                                                <Eye className="h-3 w-3 text-slate-500" />
                                                                <span>View</span>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        )
                    ) : (
                        /* Governance Audit Table: internal_notifications */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider">
                                        <th className="p-3.5">Type &amp; Audit Key</th>
                                        <th className="p-3.5">Recipient</th>
                                        <th className="p-3.5">Delivery Status</th>
                                        <th className="p-3.5">Customer &amp; Episode</th>
                                        <th className="p-3.5">Sent Timestamp</th>
                                        <th className="p-3.5 text-right">Context</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedNotifications.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-400">
                                                No internal governance notifications match the selected date range or filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedNotifications.map((n) => {
                                            const typeMeta = NOTIFICATION_TYPE_META[n.notification_type] || {
                                                label: n.notification_type,
                                                color: "bg-slate-100 text-slate-700 border-slate-200",
                                            };
                                            const statusMeta = NOTIFICATION_STATUS_META[n.status] || {
                                                label: n.status,
                                                color: "bg-slate-100 text-slate-700 border-slate-200",
                                            };
                                            const hasMatchingApproval = approvals.some(
                                                (a) =>
                                                    (n.service_episode_id && a.service_episode_id === n.service_episode_id) ||
                                                    (n.customer_id && a.customer_id === n.customer_id)
                                            );

                                            return (
                                                <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5">
                                                        <Badge variant="outline" className={`text-[10px] font-bold border ${typeMeta.color}`}>
                                                            {typeMeta.label}
                                                        </Badge>
                                                        <div className="font-mono text-[10px] text-slate-400 mt-1 truncate max-w-[230px]" title={n.notification_key}>
                                                            {n.notification_key}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                                            <Mail className="h-3.5 w-3.5 text-violet-600" />
                                                            <span>{n.recipient}</span>
                                                        </div>
                                                        {n.provider_message_id && (
                                                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                                MsgID: {n.provider_message_id}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <Badge variant="outline" className={`text-[10px] font-bold border ${statusMeta.color}`}>
                                                            {statusMeta.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-slate-900">
                                                            {n.customer?.full_name || n.customer?.customer_name || "System Event"}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500">
                                                            {n.service_episode?.service_type || n.customer?.phone_e164 || "—"}
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5 text-slate-600 text-[11px]">
                                                        {formatDateTime(n.sent_at || n.created_at)}
                                                    </td>
                                                    <td className="p-3.5 text-right">
                                                        {hasMatchingApproval ? (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openRelatedApproval(n)}
                                                                className="h-7 text-[11px] bg-white border-slate-200 text-violet-700 hover:bg-violet-50 rounded-lg px-2.5 gap-1"
                                                            >
                                                                <span>View Approval</span>
                                                                <ArrowUpRight className="h-3 w-3" />
                                                            </Button>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400">Audit Logged</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer (10 items per page) */}
                    {!loading && currentTotal > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/60 text-slate-600 text-xs">
                            <span>
                                Showing{" "}
                                <span className="font-bold text-slate-900">
                                    {(currentPage - 1) * PAGE_SIZE + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-slate-900">
                                    {Math.min(currentPage * PAGE_SIZE, currentTotal)}
                                </span>{" "}
                                of <span className="font-bold text-slate-900">{currentTotal}</span>{" "}
                                {activeTab === "approvals" ? "approvals" : "notifications"} (10 per page)
                            </span>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="h-8 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 rounded-lg px-2.5"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                                </Button>

                                <span className="text-xs font-bold text-slate-700 px-3">
                                    Page {currentPage} of {currentTotalPages}
                                </span>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={currentPage >= currentTotalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(currentTotalPages, p + 1))}
                                    className="h-8 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 rounded-lg px-2.5"
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Approval Pipeline Detail Modal with Interactive Review/Dispatch */}
            <ApprovalDetailModal
                approval={selectedApproval}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onActionCompleted={() => fetchData(false)}
            />
        </div>
    );
}
