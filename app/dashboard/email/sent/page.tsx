"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Filter,
    Mail,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    ArrowLeft,
    Reply,
    User,
    Bot,
    ExternalLink,
    MessageSquare,
    Share2
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, subDays } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useData } from "@/context/DataContext";
import { FollowUpBossButton } from "@/components/ui/followup-boss-button";
import { LMLoader } from "@/components/spectra-loader";
import { EmailChatDetail } from "@/components/dashboard/email-chat-detail";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 7;

export default function SentEmailsPage() {
    const { leads: allLeads, loadingLeads } = useData();
    const [page, setPage] = useState(1);
    const [selectedLeadItem, setSelectedLeadItem] = useState<{ id: string; initialLead?: any } | null>(null);
    const [dateRange, setDateRange] = useState<any>(undefined);
    const [apiEmailLeads, setApiEmailLeads] = useState<any[]>([]);
    const [loadingApi, setLoadingApi] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        campaign: "all",
        sender: "all",
        type: "all",
    });

    useEffect(() => {
        const fetchEmailThreads = async () => {
            setLoadingApi(true);
            try {
                const res = await fetch('/api/email');
                if (res.ok) {
                    const data = await res.json();
                    setApiEmailLeads(data.email_leads || []);
                }
            } catch (err) {
                console.error("Error fetching email threads:", err);
            } finally {
                setLoadingApi(false);
            }
        };
        fetchEmailThreads();
    }, []);

    const loading = loadingLeads || loadingApi;

    const sentEmails = useMemo(() => {
        const result: any[] = [];

        // 1. Process email threads from /api/email (public.messages table)
        if (apiEmailLeads && apiEmailLeads.length > 0) {
            apiEmailLeads.forEach((lead: any, lIdx: number) => {
                const recipientEmail = lead.recipient_address || lead.email || lead.Email || "Lead";
                const recipientName = lead.full_name || lead.customer_name || lead.name || recipientEmail;
                const messagesList = lead.messages && Array.isArray(lead.messages) ? lead.messages : [];
                const latestMsg = messagesList[messagesList.length - 1] || {};

                result.push({
                    id: lead.id || lead.recipient_address || `email-thread-${lIdx}`,
                    recipient: recipientName,
                    email: recipientEmail,
                    sender: latestMsg.sender_address || "outreach@spectradubai.com",
                    type: latestMsg.provider || "EMAIL OUTREACH",
                    sentDate: lead.created_at ? format(new Date(lead.created_at), "yyyy-MM-dd HH:mm") : "Recent",
                    rawDate: lead.created_at,
                    subject: lead.subject || latestMsg.subject || "Spectra Service Outreach",
                    body: latestMsg.body_text || latestMsg.content || "Email conversation thread.",
                    content: latestMsg.body_text || latestMsg.content || "Email conversation thread.",
                    campaign: "Email Campaign",
                    hasReplied: lead.replied === 'yes',
                    rawLead: lead,
                    messagesList
                });
            });
        }

        // 2. Fallback / supplement from allLeads if apiEmailLeads is empty
        if (result.length === 0) {
            allLeads.forEach((lead: any) => {
                const hasReplied = lead.email_reply &&
                    String(JSON.stringify(lead.email_reply)) !== '[]' &&
                    String(JSON.stringify(lead.email_reply)) !== 'null';

                ['email_1', 'email_2', 'email_3', 'email_4'].forEach((col, idx) => {
                    const val = lead[col] || lead[`${col}_status`];
                    if (val && String(val).trim() !== '' && String(val).trim() !== 'null' && String(val).trim() !== 'undefined') {
                        const recipientName = lead.full_name || lead.customer_name || lead.name || lead.email || "Lead";
                        const sentDate = lead.created_at || lead.eworks_created_on ? format(new Date(lead.created_at || lead.eworks_created_on), "yyyy-MM-dd HH:mm") : "Recent";
                        const rawContent = typeof val === 'object' ? JSON.stringify(val) : String(val);
                        result.push({
                            id: lead.id || lead.email || `${lead.id}-email-${idx + 1}`,
                            recipient: recipientName,
                            email: lead.email || "",
                            sender: lead.sender || "outreach@spectradubai.com",
                            type: `EMAIL STEP ${idx + 1}`,
                            sentDate,
                            rawDate: lead.created_at || lead.eworks_created_on,
                            subject: lead.subject || `Email Step ${idx + 1}`,
                            body: rawContent,
                            content: rawContent,
                            campaign: lead.source_loop || lead.source_table || "Email Campaign",
                            hasReplied: !!hasReplied,
                            rawLead: lead,
                        });
                    }
                });
            });
        }

        return result;
    }, [allLeads, apiEmailLeads]);


    // Dynamic filter options derived from actual database records
    const uniqueSenders = Array.from(
        new Set(sentEmails.map((e) => e.sender).filter((s) => s && s !== "Email Sender"))
    ).sort();

    const uniqueCampaigns = Array.from(
        new Set(sentEmails.map((e) => e.campaign).filter(Boolean))
    ).sort();

    const uniqueTypes = Array.from(
        new Set(sentEmails.map((e) => e.type).filter(Boolean))
    ).sort();

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const filteredEmails = sentEmails.filter((email) => {
        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (
                !email.recipient.toLowerCase().includes(q) &&
                !email.subject.toLowerCase().includes(q) &&
                !email.content.toLowerCase().includes(q)
            )
                return false;
        }

        // Date range
        if (dateRange?.from && email.rawDate) {
            const ed = new Date(email.rawDate);
            if (!isNaN(ed.getTime())) {
                const from = new Date(dateRange.from);
                from.setHours(0, 0, 0, 0);
                const to = dateRange.to ? new Date(dateRange.to) : new Date(from);
                to.setHours(23, 59, 59, 999);
                if (ed < from || ed > to) return false;
            }
        }

        // Campaign filter (exact match against DB campaign / source table)
        if (filters.campaign !== "all" && email.campaign !== filters.campaign) {
            return false;
        }

        // Sender filter (matches selected email in email.sender)
        if (filters.sender !== "all") {
            const sLower = (email.sender || "").toLowerCase();
            if (!sLower.includes(filters.sender.toLowerCase())) {
                return false;
            }
        }

        // Type filter (exact match against DB action_type / stage)
        if (filters.type !== "all" && email.type !== filters.type) {
            return false;
        }

        return true;
    });

    const totalPages = Math.ceil(filteredEmails.length / ITEMS_PER_PAGE);
    const paginatedEmails = filteredEmails.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-6 pb-10 max-w-5xl mx-auto relative min-h-[500px]">
            {loading && <LMLoader />}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--label-primary)]">Emails Sent</h1>
                    <p className="text-[var(--label-secondary)]">View and manage your sent email history.</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-[var(--glass-fill)] p-4 rounded-xl border border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                        <Input
                            placeholder="Search recipients, subjects..."
                            className="pl-9 bg-[var(--bg-app)] border-[var(--separator)]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <DateRangePicker
                        className="w-full md:w-[260px]"
                        onUpdate={(values) => setDateRange(values.range)}
                    />
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <Filter className="h-4 w-4 text-[var(--label-tertiary)] mr-2" />

                    {/* Dynamic Campaign Filter */}
                    <Select value={filters.campaign} onValueChange={(val) => handleFilterChange("campaign", val)}>
                        <SelectTrigger className="w-[180px] h-9 text-xs">
                            <SelectValue placeholder="All Campaigns" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Campaigns</SelectItem>
                            {uniqueCampaigns.map((camp) => (
                                <SelectItem key={camp} value={camp}>
                                    {camp}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sender Filter */}
                    <Select value={filters.sender} onValueChange={(val) => handleFilterChange("sender", val)}>
                        <SelectTrigger className="w-[200px] h-9 text-xs">
                            <SelectValue placeholder="All Senders" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Senders</SelectItem>
                            {uniqueSenders.map((sender) => (
                                <SelectItem key={sender} value={sender}>
                                    {sender}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Dynamic Type Filter */}
                    <Select value={filters.type} onValueChange={(val) => handleFilterChange("type", val)}>
                        <SelectTrigger className="w-[180px] h-9 text-xs">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {uniqueTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--label-secondary)] h-9 text-xs ml-auto bg-[var(--fill-quaternary)] hover:bg-[var(--fill-tertiary)]"
                        onClick={() => {
                            setSearchQuery("");
                            setDateRange(undefined);
                            setFilters({ campaign: "all", sender: "all", type: "all" });
                            setPage(1);
                        }}
                    >
                        Reset All Filters
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {!loading && paginatedEmails.length > 0 ? (
                    paginatedEmails.map((email) => (
                        <SentEmailCard
                            key={email.id}
                            email={email}
                            onOpenThread={(id, initialLead) => setSelectedLeadItem({ id, initialLead })}
                        />
                    ))
                ) : !loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[var(--label-tertiary)] border border-dashed border-[var(--separator)] rounded-xl bg-[var(--bg-app)]/50">
                        <Mail className="h-8 w-8 mb-2 opacity-50" />
                        <p>No emails found matching your filters</p>
                    </div>
                ) : null}
            </div>

            {/* Pagination */}
            {!loading && filteredEmails.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
                    <p className="text-sm text-slate-600 font-medium">
                        Showing{" "}
                        <span className="font-bold text-slate-900">{(page - 1) * ITEMS_PER_PAGE + 1}</span>–
                        <span className="font-bold text-slate-900">
                            {Math.min(page * ITEMS_PER_PAGE, filteredEmails.length)}
                        </span>{" "}
                        of <span className="font-bold text-slate-900">{filteredEmails.length}</span> results
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="gap-1.5 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:bg-slate-100 disabled:text-slate-400 font-semibold shadow-xs cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4 text-slate-600" /> Previous
                        </Button>
                        <span className="text-sm font-semibold text-slate-700 px-2">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="gap-1.5 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:bg-slate-100 disabled:text-slate-400 font-semibold shadow-xs cursor-pointer"
                        >
                            Next <ArrowRight className="h-4 w-4 text-slate-600" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Email Chat Detail Modal Overlay */}
            <Dialog open={!!selectedLeadItem} onOpenChange={(open) => { if (!open) setSelectedLeadItem(null); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-none bg-transparent shadow-none [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Email Thread Detail</DialogTitle>
                    </DialogHeader>
                    {selectedLeadItem && (
                        <EmailChatDetail
                            leadId={selectedLeadItem.id}
                            initialLead={selectedLeadItem.initialLead}
                            onClose={() => setSelectedLeadItem(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface ParsedEmailTurn {
    sender: 'agent' | 'user';
    label: string;
    text: string;
    timestamp?: string;
}

function parseCardContent(content: string, note?: string): ParsedEmailTurn[] {
    const raw = (content || note || "").trim();
    if (!raw) return [];

    const turns: ParsedEmailTurn[] = [];

    // Regex matching prefixes like Template:, Agent:, User:, Reply:
    const regex = /(Template:|Agent\s*:|Outbound Email:|Email Sent:|User\s*:|Inbound Email:|Inbound Reply:|Reply:)/gi;
    const matches = Array.from(raw.matchAll(regex));

    if (matches.length > 0) {
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const startIdx = match.index! + match[0].length;
            const endIdx = i < matches.length - 1 ? matches[i + 1].index! : raw.length;
            let block = raw.substring(startIdx, endIdx).trim();

            const prefix = match[0].toLowerCase();
            const isAgent = prefix.includes('template') || prefix.includes('agent') || prefix.includes('outbound') || prefix.includes('sent');

            let timestamp: string | undefined = undefined;
            const tsMatch = block.match(/(\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?)/i);
            if (tsMatch) {
                timestamp = tsMatch[1];
                block = block.replace(tsMatch[0], '').trim();
            }

            if (block) {
                turns.push({
                    sender: isAgent ? 'agent' : 'user',
                    label: isAgent ? 'AI Agent' : 'User Reply',
                    text: block,
                    timestamp
                });
            }
        }
    } else {
        const parts = raw.split(/(?=\d{1,2}\/\d{1,2}\/\d{4})/g);
        for (const part of parts) {
            let p = part.trim();
            if (!p) continue;
            let timestamp: string | undefined = undefined;
            const tsMatch = p.match(/(\d{1,2}\/\d{1,2}\/\d{4}(?:,\s*\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?)?)/i);
            if (tsMatch) {
                timestamp = tsMatch[1];
                p = p.replace(tsMatch[0], '').trim();
            }
            if (p) {
                turns.push({
                    sender: 'agent',
                    label: 'Outbound Email',
                    text: p,
                    timestamp
                });
            }
        }
    }

    if (turns.length === 0 && raw) {
        turns.push({
            sender: 'agent',
            label: 'Email Content',
            text: raw
        });
    }

    return turns;
}

function SentEmailCard({ email, onOpenThread }: { email: any; onOpenThread: (id: string, lead?: any) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const turns = parseCardContent(email?.content, email?.note);
    const firstTurn = turns[0];
    const rawText = firstTurn ? (firstTurn.text || '') : (email?.content || email?.note || '');
    const rawPreview = String(rawText || '').replace(/^(Template:|Agent\s*:|User\s*:)/i, '').trim();
    const previewText = rawPreview.replace(/<(br|p|div|li|h[1-6])[^>]*>/gi, " ").replace(/<\/?[^>]+(>|$)/g, "").trim();

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-xl shadow-xs transition-all hover:border-slate-300 hover:shadow-md overflow-hidden text-slate-900"
        >
            <CollapsibleTrigger asChild>
                <div className="p-5 cursor-pointer group hover:bg-slate-50/80 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 shrink-0 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center border border-purple-200 mt-0.5 shadow-2xs">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge
                                        variant="secondary"
                                        className="bg-slate-100 text-slate-700 text-[10px] tracking-wider font-semibold uppercase border border-slate-200"
                                    >
                                        {email.type}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="text-purple-700 border-purple-200 bg-purple-50 text-[10px] uppercase font-semibold"
                                    >
                                        {email.campaign || email.loop}
                                    </Badge>
                                    {email.hasReplied && (
                                        <Badge
                                            variant="outline"
                                            className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px] font-semibold gap-1"
                                        >
                                            <Reply className="h-3 w-3" /> Replied
                                        </Badge>
                                    )}
                                    {email.sentDate && (
                                        <Badge
                                            variant="outline"
                                            className="text-cyan-700 border-cyan-200 bg-cyan-50 text-[10px] font-medium"
                                        >
                                            {email.sentDate}
                                        </Badge>
                                    )}
                                </div>
                                <h4 className="text-base font-bold text-slate-900 leading-tight">
                                    {email.subject || 'Spectra Email Outreach'}
                                </h4>
                                <p className="text-xs font-semibold text-slate-600">
                                    Recipient: <span className="text-slate-900 font-bold">{email.recipient}</span> {email.email ? `(${email.email})` : ''}
                                </p>
                                {!isOpen && (
                                    <p className="text-xs text-slate-500 truncate max-w-xl font-normal mt-0.5">
                                        {previewText.substring(0, 100)}{previewText.length > 100 ? '...' : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                            <FollowUpBossButton lead={email.rawLead || email} variant="button" />
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const shareId = email.rawLead?.lead_email || email.rawLead?.email || email.recipient || email.id;
                                    onOpenThread(shareId, email.rawLead);
                                }}
                                className="h-8 text-xs gap-1.5 text-blue-600 border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 hover:text-blue-700 rounded-lg font-semibold shadow-2xs"
                            >
                                <MessageSquare className="h-3.5 w-3.5" /> Full Thread
                            </Button>
                            {isOpen ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                            )}
                        </div>
                    </div>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="px-5 pb-5 pt-0">
                    <div className="border-t border-slate-200/80 pt-4 space-y-3">
                        {email.sender && (
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                                <span className="font-semibold text-slate-700">From:</span> {email.sender}
                            </p>
                        )}

                        {/* Structured Conversation Turns */}
                        <div className="space-y-3 mt-3">
                            {turns.map((turn, idx) => {
                                const isAgent = turn.sender === 'agent';
                                return (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-xl border text-xs leading-relaxed transition-all ${
                                            isAgent
                                                ? 'bg-emerald-50/60 border-emerald-200/90 text-slate-800'
                                                : 'bg-purple-50/60 border-purple-200/90 text-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/70">
                                            <span className={`font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${
                                                isAgent ? 'text-emerald-700' : 'text-purple-700'
                                            }`}>
                                                {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                                {turn.label}
                                            </span>
                                            {turn.timestamp && (
                                                <span className="text-[10px] text-slate-500 font-mono font-medium">
                                                    {turn.timestamp}
                                                </span>
                                            )}
                                        </div>
                                        <p className="whitespace-pre-wrap leading-relaxed text-slate-700 font-normal">{turn.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
