"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Users,
    Mail,
    Send,
    MessageSquare,
    RefreshCw,
    ArrowLeft,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Phone,
    Briefcase,
    Calendar,
    Sparkles
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useData } from "@/context/DataContext";
import { LMLoader } from "@/components/spectra-loader";
import { EmailChatDetail } from "@/components/dashboard/email-chat-detail";
import { format, subDays } from "date-fns";

export interface UniqueEmailLead {
    id: string;
    customer_id?: string | null;
    name: string;
    email: string;
    phone?: string;
    campaign?: string;
    message_count: number;
    replied: boolean;
    created_at?: string | null;
    rawLead?: any;
    messages?: any[];
}

const ITEMS_PER_PAGE = 10;

export default function UniqueEmailLeadsPage() {
    const router = useRouter();
    const { leads: allLeads, loadingLeads } = useData();

    const [apiEmailLeads, setApiEmailLeads] = useState<any[]>([]);
    const [loadingApi, setLoadingApi] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'replied' | 'sent'>('all');
    const [dateRange, setDateRange] = useState<any>({ from: subDays(new Date(), 7), to: new Date() });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLeadForThread, setSelectedLeadForThread] = useState<{ id: string; leadObj?: any } | null>(null);

    const fetchEmailData = async () => {
        setLoadingApi(true);
        try {
            const res = await fetch('/api/email');
            if (res.ok) {
                const data = await res.json();
                setApiEmailLeads(data.email_leads || []);
            }
        } catch (err) {
            console.error("Error fetching email leads:", err);
        } finally {
            setLoadingApi(false);
        }
    };

    useEffect(() => {
        fetchEmailData();
    }, []);

    // Deduplicate and aggregate unique leads contacted via email
    const uniqueLeads = useMemo<UniqueEmailLead[]>(() => {
        const uniqueMap = new Map<string, UniqueEmailLead>();

        // 1. Process leads from /api/email (grouped by recipient_address in public.messages)
        if (apiEmailLeads && apiEmailLeads.length > 0) {
            apiEmailLeads.forEach((lead: any, idx: number) => {
                const emailRaw = lead.recipient_address || lead.email || lead.Email || "";
                const emailKey = emailRaw.toLowerCase().trim();
                if (!emailKey) return;

                const nameRaw = lead.name || lead.full_name || lead.customer_name || emailKey.split('@')[0];
                const customerId = lead.customer_id || lead.id || emailKey;
                const isReplied = lead.replied === 'yes' || (Array.isArray(lead.messages) && lead.messages.some((m: any) => m.direction === 'INBOUND'));

                uniqueMap.set(emailKey, {
                    id: String(customerId),
                    customer_id: lead.customer_id || null,
                    name: String(nameRaw).trim() || emailKey.split('@')[0],
                    email: emailRaw,
                    phone: lead.phone || lead.phone_e164 || lead.telephone_raw || "",
                    campaign: lead.campaign_id || lead.source_loop || "Email Outreach",
                    message_count: lead.message_count || (Array.isArray(lead.messages) ? lead.messages.length : 1),
                    replied: isReplied,
                    created_at: lead.created_at || lead.sent_or_received_at || null,
                    rawLead: lead,
                    messages: lead.messages || []
                });
            });
        }

        // 2. Also incorporate any leads from allLeads (CRM) that have email steps
        if (allLeads && allLeads.length > 0) {
            allLeads.forEach((lead: any) => {
                const emailRaw = lead.email || lead.lead_email || lead.Email || "";
                const emailKey = emailRaw.toLowerCase().trim();
                if (!emailKey) return;

                const hasEmailStep = ['email_1', 'email_2', 'email_3', 'email_4'].some(col => {
                    const val = lead[col] || lead[`${col}_status`];
                    return val && String(val).trim() !== '' && String(val).trim() !== 'null' && String(val).trim() !== 'undefined';
                });
                const hasEmailReply = lead.email_reply &&
                    String(JSON.stringify(lead.email_reply)) !== '[]' &&
                    String(JSON.stringify(lead.email_reply)) !== 'null' &&
                    String(JSON.stringify(lead.email_reply)) !== '""';
                const hasEmailMessages = Array.isArray(lead.messages) && lead.messages.some((m: any) => m.channel === 'EMAIL');

                if (hasEmailStep || hasEmailReply || hasEmailMessages) {
                    if (!uniqueMap.has(emailKey)) {
                        let stepCount = 0;
                        ['email_1', 'email_2', 'email_3', 'email_4'].forEach(col => {
                            const val = lead[col] || lead[`${col}_status`];
                            if (val && String(val).trim() !== '' && String(val).trim() !== 'null') stepCount++;
                        });

                        const nameRaw = lead.full_name || lead.customer_name || lead.name || emailKey.split('@')[0];
                        const leadId = lead.customer_id || lead.id || emailKey;

                        uniqueMap.set(emailKey, {
                            id: String(leadId),
                            customer_id: lead.customer_id || null,
                            name: String(nameRaw).trim() || emailKey.split('@')[0],
                            email: emailRaw,
                            phone: lead.phone || lead.phone_e164 || lead.Phone || "",
                            campaign: lead.source_loop || lead.source_table || "Email Campaign",
                            message_count: Math.max(stepCount, 1),
                            replied: Boolean(hasEmailReply),
                            created_at: lead.created_at || lead.eworks_created_on || null,
                            rawLead: lead,
                            messages: lead.messages || []
                        });
                    } else {
                        const existing = uniqueMap.get(emailKey)!;
                        if (!existing.phone && (lead.phone || lead.phone_e164 || lead.Phone)) {
                            existing.phone = lead.phone || lead.phone_e164 || lead.Phone;
                        }
                        if (lead.full_name || lead.customer_name) {
                            existing.name = lead.full_name || lead.customer_name;
                        }
                    }
                }
            });
        }

        // Sort by created_at descending
        return Array.from(uniqueMap.values()).sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
        });
    }, [apiEmailLeads, allLeads]);

    // Apply search, status and date range filters
    const filteredLeads = useMemo(() => {
        return uniqueLeads.filter((lead) => {
            // Search Query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = lead.name.toLowerCase().includes(q);
                const matchEmail = lead.email.toLowerCase().includes(q);
                const matchPhone = (lead.phone || "").toLowerCase().includes(q);
                const matchCampaign = (lead.campaign || "").toLowerCase().includes(q);
                if (!matchName && !matchEmail && !matchPhone && !matchCampaign) {
                    return false;
                }
            }

            // Status Filter
            if (statusFilter === 'replied' && !lead.replied) return false;
            if (statusFilter === 'sent' && lead.replied) return false;

            // Date Range Filter
            if (dateRange?.from && lead.created_at) {
                const leadDate = new Date(lead.created_at);
                if (!isNaN(leadDate.getTime())) {
                    const from = new Date(dateRange.from);
                    from.setHours(0, 0, 0, 0);
                    const to = dateRange.to ? new Date(dateRange.to) : new Date(from);
                    to.setHours(23, 59, 59, 999);
                    if (leadDate < from || leadDate > to) return false;
                }
            }

            return true;
        });
    }, [uniqueLeads, searchQuery, statusFilter, dateRange]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredLeads.length / ITEMS_PER_PAGE));
    const paginatedLeads = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredLeads.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredLeads, currentPage]);

    // Scope summary stats to the active dateRange filter
    const dateScopedLeads = useMemo(() => {
        if (!dateRange?.from) return uniqueLeads;
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        const to = dateRange.to ? new Date(dateRange.to) : new Date(from);
        to.setHours(23, 59, 59, 999);

        return uniqueLeads.filter(lead => {
            if (!lead.created_at) return true;
            const d = new Date(lead.created_at);
            if (isNaN(d.getTime())) return true;
            return d >= from && d <= to;
        });
    }, [uniqueLeads, dateRange]);

    // Summary stats
    const totalUniqueCount = dateScopedLeads.length;
    const totalReplied = useMemo(() => dateScopedLeads.filter(l => l.replied).length, [dateScopedLeads]);
    const overallReplyRate = totalUniqueCount > 0 ? Math.min(100, (totalReplied / totalUniqueCount) * 100).toFixed(1) : "0.0";

    const loading = loadingLeads || loadingApi;

    return (
        <div className="space-y-6 pb-12 relative min-h-[600px] font-sans">
            {loading && <LMLoader />}

            {/* Top Navigation & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/email">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-slate-500 hover:text-slate-900 gap-1.5 -ml-2 rounded-xl"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-xs font-semibold">Email Dashboard</span>
                            </Button>
                        </Link>
                        <span className="text-slate-300">/</span>
                        <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200">
                            Unique Leads
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Total Unique Leads Contacted
                            </h1>
                            <p className="text-xs text-slate-500">
                                List view of all distinct prospects reached with email threads and reply tracking
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                    <DateRangePicker value={dateRange} onUpdate={(range) => {
                        setDateRange(range.range);
                        setCurrentPage(1);
                    }} />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchEmailData}
                        disabled={loading}
                        className="h-10 w-10 rounded-xl bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm"
                        title="Refresh Leads Data"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-violet-600' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-slate-200/80 bg-white shadow-xs rounded-2xl">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unique Leads</p>
                            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                                {loading ? "..." : totalUniqueCount.toLocaleString()}
                            </h3>
                            <p className="text-[11px] text-purple-600 mt-0.5 font-medium flex items-center gap-1">
                                <Users className="h-3 w-3" /> Distinct Recipients
                            </p>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                            <Users className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/80 bg-white shadow-xs rounded-2xl">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Leads Replied</p>
                            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                                {loading ? "..." : totalReplied.toLocaleString()}
                            </h3>
                            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Inbound Engagement
                            </p>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/80 bg-white shadow-xs rounded-2xl">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Response Rate</p>
                            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                                {loading ? "..." : `${overallReplyRate}%`}
                            </h3>
                            <p className="text-[11px] text-indigo-600 mt-0.5 font-medium flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> Lead-to-Reply Conversion
                            </p>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                            <Mail className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search unique leads by name, email, phone, or campaign..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 bg-slate-50/70 border-slate-200 text-slate-900 rounded-xl h-10 placeholder:text-slate-400 focus-visible:ring-violet-500 text-xs"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className={`gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-10 text-xs font-semibold shadow-2xs ${
                                    statusFilter !== 'all' ? 'border-purple-300 bg-purple-50/50 text-purple-700' : ''
                                }`}
                            >
                                <Filter className="h-3.5 w-3.5 text-purple-600" />
                                <span>
                                    {statusFilter === 'all' ? 'Filter: All Leads' : statusFilter === 'replied' ? 'Filter: Replied Only' : 'Filter: Sent Only'}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] bg-white border-slate-200 text-slate-800 rounded-xl shadow-lg">
                            <DropdownMenuItem
                                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                                className={`cursor-pointer text-xs ${statusFilter === 'all' ? 'font-bold text-purple-600 bg-purple-50' : ''}`}
                            >
                                All Unique Leads
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => { setStatusFilter('replied'); setCurrentPage(1); }}
                                className={`cursor-pointer text-xs ${statusFilter === 'replied' ? 'font-bold text-purple-600 bg-purple-50' : ''}`}
                            >
                                Replied Leads Only
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => { setStatusFilter('sent'); setCurrentPage(1); }}
                                className={`cursor-pointer text-xs ${statusFilter === 'sent' ? 'font-bold text-purple-600 bg-purple-50' : ''}`}
                            >
                                Sent / Awaiting Reply
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {(searchQuery || statusFilter !== 'all' || dateRange) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter('all');
                                setDateRange(undefined);
                                setCurrentPage(1);
                            }}
                            className="text-xs text-slate-500 hover:text-slate-800 h-10 px-3 rounded-xl"
                        >
                            Reset Filters
                        </Button>
                    )}
                </div>
            </div>

            {/* Unique Leads Table Card */}
            <Card className="bg-white border-slate-200/90 shadow-sm rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                                    <th className="py-3.5 px-5">Contact Name</th>
                                    <th className="py-3.5 px-4">Email Address</th>
                                    <th className="py-3.5 px-4">Phone Number</th>
                                    <th className="py-3.5 px-4">Campaign / Loop</th>
                                    <th className="py-3.5 px-4 text-center">Emails Sent</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4">Last Activity</th>
                                    <th className="py-3.5 px-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {paginatedLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <Users className="h-6 w-6" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700">No unique email leads found</p>
                                                <p className="text-xs text-slate-400 max-w-sm">
                                                    Try adjusting your search terms, date range, or reply filters.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedLeads.map((lead, idx) => {
                                        return (
                                            <tr
                                                key={`${lead.id}-${idx}`}
                                                onClick={() => setSelectedLeadForThread({ id: lead.id, leadObj: lead.rawLead || lead })}
                                                className="hover:bg-violet-50/40 transition-colors cursor-pointer group"
                                            >
                                                {/* Contact Name & Initials */}
                                                <td className="py-3.5 px-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                            {lead.name ? lead.name.charAt(0).toUpperCase() : "L"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate max-w-[180px]">
                                                                {lead.name}
                                                            </div>
                                                            {lead.customer_id && (
                                                                <span className="text-[10px] text-slate-400 font-mono block">
                                                                    ID: #{String(lead.customer_id).slice(0, 8)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email Address */}
                                                <td className="py-3.5 px-4 font-mono text-xs text-slate-600 truncate max-w-[200px]">
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                                        <span className="truncate">{lead.email || "—"}</span>
                                                    </div>
                                                </td>

                                                {/* Phone Number */}
                                                <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                                                    {lead.phone ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                                            <span>{lead.phone}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>

                                                {/* Campaign Loop */}
                                                <td className="py-3.5 px-4 text-xs text-slate-600">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-medium text-slate-700">
                                                        <Briefcase className="h-3 w-3 text-purple-500" />
                                                        <span className="truncate max-w-[140px]">{lead.campaign || "Email Outreach"}</span>
                                                    </span>
                                                </td>

                                                {/* Message Count */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold font-mono border border-purple-200/60">
                                                        {lead.message_count}
                                                    </span>
                                                </td>

                                                {/* Status (Replied vs Sent) */}
                                                <td className="py-3.5 px-4">
                                                    {lead.replied ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-[10px] font-bold uppercase gap-1">
                                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                            <span>Replied</span>
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] text-sky-700 border-sky-200 bg-sky-50 font-bold uppercase gap-1">
                                                            <Send className="h-3 w-3 text-sky-500" />
                                                            <span>Sent</span>
                                                        </Badge>
                                                    )}
                                                </td>

                                                {/* Last Activity */}
                                                <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                                                    {lead.created_at ? (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-slate-400" />
                                                            <span>{format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">Recent</span>
                                                    )}
                                                </td>

                                                {/* Action: Open Thread */}
                                                <td className="py-3.5 px-5 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedLeadForThread({ id: lead.id, leadObj: lead.rawLead || lead });
                                                        }}
                                                        className="h-8 px-2.5 text-xs font-semibold text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-xl gap-1 group-hover:bg-purple-100/70"
                                                    >
                                                        <span>View Thread</span>
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                        <span className="text-xs text-slate-500">
                            Showing{" "}
                            <span className="font-bold text-slate-800">
                                {filteredLeads.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                            </span>{" "}
                            to{" "}
                            <span className="font-bold text-slate-800">
                                {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)}
                            </span>{" "}
                            of{" "}
                            <span className="font-bold text-slate-800">{filteredLeads.length}</span> unique leads
                        </span>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs gap-1 shadow-2xs"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                <span>Previous</span>
                            </Button>

                            <span className="text-xs text-slate-500 font-mono px-2">
                                Page <strong className="text-slate-900">{currentPage}</strong> of{" "}
                                <strong className="text-slate-900">{totalPages}</strong>
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs gap-1 shadow-2xs"
                            >
                                <span>Next</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Full Thread Modal Dialog */}
            <Dialog
                open={!!selectedLeadForThread}
                onOpenChange={(open) => !open && setSelectedLeadForThread(null)}
            >
                <DialogContent className="max-w-4xl h-[88vh] p-0 bg-transparent border-none overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Email Conversation Thread</DialogTitle>
                    </DialogHeader>
                    {selectedLeadForThread && (
                        <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
                            <EmailChatDetail
                                leadId={selectedLeadForThread.id}
                                initialLead={selectedLeadForThread.leadObj}
                                onClose={() => setSelectedLeadForThread(null)}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

