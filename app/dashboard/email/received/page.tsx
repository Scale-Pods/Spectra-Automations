"use client";

import { LMLoader } from "@/components/spectra-loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Mail, ChevronDown, ChevronUp, Reply, Search } from "lucide-react";
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

export default function ReceivedEmailsPage() {
    const { leads: allLeads, loadingLeads } = useData();
    const [apiEmailLeads, setApiEmailLeads] = useState<any[]>([]);
    const [loadingApi, setLoadingApi] = useState(false);
    const [loopFilter, setLoopFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState<any>({ from: subDays(new Date(), 90), to: new Date() });
    const [sortBy, setSortBy] = useState("newest");

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

    const replies = useMemo(() => {
        const result: any[] = [];

        // 1. Process from /api/email (public.messages table)
        if (apiEmailLeads && apiEmailLeads.length > 0) {
            apiEmailLeads.forEach((lead: any) => {
                const messagesList = lead.messages && Array.isArray(lead.messages) ? lead.messages : [];
                messagesList.forEach((m: any, mIdx: number) => {
                    if (m.direction === 'INBOUND' || (m.status && m.status.toLowerCase().includes('reply'))) {
                        const senderEmail = m.sender_address || lead.recipient_address || "Lead";
                        const leadName = lead.full_name || lead.customer_name || lead.name || senderEmail;
                        const dateRaw = m.sent_or_received_at || m.created_at || lead.created_at;
                        const timestamp = dateRaw ? format(new Date(dateRaw), "yyyy-MM-dd HH:mm") : "Recent";

                        result.push({
                            id: m.id || `${lead.id}-inbound-${mIdx}`,
                            sender: senderEmail,
                            senderName: leadName,
                            status: "Replied",
                            subject: m.subject || lead.subject || "Re: Campaign Outreach",
                            timestamp,
                            content: m.body_text || m.content || m.subject || "Inbound response received.",
                            originalDate: dateRaw || new Date().toISOString(),
                            loop: "Email Campaign",
                            repliedToStep: "Outreach Email",
                            rawLead: lead
                        });
                    }
                });
            });
        }

        // 2. Fallback to allLeads if no inbound messages found from API
        if (result.length === 0) {
            allLeads.forEach((lead: any) => {
                const hasReply = lead.email_reply &&
                    String(JSON.stringify(lead.email_reply)) !== '[]' &&
                    String(JSON.stringify(lead.email_reply)) !== 'null' &&
                    String(JSON.stringify(lead.email_reply)) !== '""';

                if (hasReply) {
                    const senderEmail = lead.email || lead.lead_email || lead.Email || 'Prospect';
                    const leadName = lead.full_name || lead.customer_name || lead.name || 'Lead';
                    let content = "Inbound email response received.";
                    if (Array.isArray(lead.email_reply) && lead.email_reply.length > 0) {
                        const lastItem = lead.email_reply[lead.email_reply.length - 1];
                        content = lastItem.body_text || lastItem.content || lastItem.subject || JSON.stringify(lastItem);
                    } else if (typeof lead.email_reply === 'object') {
                        content = lead.email_reply.body_text || lead.email_reply.content || JSON.stringify(lead.email_reply);
                    } else {
                        content = String(lead.email_reply);
                    }
                    const dateRaw = lead.updated_at || lead.created_at || lead.eworks_created_on;
                    const timestamp = dateRaw ? format(new Date(dateRaw), "yyyy-MM-dd HH:mm") : "Recent";

                    result.push({
                        id: lead.id || `reply-${Math.random()}`,
                        sender: senderEmail,
                        senderName: leadName,
                        status: "Replied",
                        subject: lead.subject || "Re: Campaign Outreach",
                        timestamp,
                        content,
                        originalDate: dateRaw || new Date().toISOString(),
                        loop: lead.source_loop || lead.source_table || "Email Campaign",
                        repliedToStep: "Outreach Email",
                        rawLead: lead
                    });
                }
            });
        }
        return result;
    }, [allLeads, apiEmailLeads]);



    const filteredReplies = useMemo(() => {
        let result = replies.filter((reply) => {
            // Loop filter
            if (loopFilter !== "all") {
                const loop = (reply.loop || "").toLowerCase();
                if (loopFilter === "intro" && !loop.includes("intro")) return false;
                if (loopFilter === "followup" && !loop.includes("follow")) return false;
                if (loopFilter === "nurture" && !loop.includes("nurture")) return false;
            }

            // Search
            const q = searchQuery.toLowerCase();
            if (
                q &&
                !reply.sender.toLowerCase().includes(q) &&
                !reply.content.toLowerCase().includes(q) &&
                !reply.senderName.toLowerCase().includes(q)
            )
                return false;

            // Date range
            if (dateRange?.from) {
                const rd = reply.originalDate ? new Date(reply.originalDate) : null;
                if (!rd || isNaN(rd.getTime())) return false;
                const from = new Date(dateRange.from);
                from.setHours(0, 0, 0, 0);
                const to = dateRange.to ? new Date(dateRange.to) : new Date(from);
                to.setHours(23, 59, 59, 999);
                if (rd < from || rd > to) return false;
            }

            return true;
        });

        // Sort
        return result.sort((a, b) => {
            const da = a.originalDate ? new Date(a.originalDate).getTime() : 0;
            const db = b.originalDate ? new Date(b.originalDate).getTime() : 0;
            return sortBy === "newest" ? db - da : da - db;
        });
    }, [replies, loopFilter, searchQuery, dateRange, sortBy]);

    return (
        <div className="space-y-6 pb-10 max-w-5xl mx-auto relative min-h-[500px]">
            {loading && <LMLoader />}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">Received Emails</h1>
                    <p className="text-[var(--label-secondary)]">
                        View all received email replies from your campaigns
                    </p>
                </div>
            </div>

            {/* Summary Card */}
            <Card className="bg-[var(--glass-fill)] border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-[var(--label-primary)]">
                            {loading ? "..." : filteredReplies.length} replies received
                        </h3>
                        <p className="text-sm font-medium text-[var(--label-secondary)] mt-1">Total Replies</p>
                    </div>
                    <div className="p-3 bg-[rgba(52,199,89,0.08)] text-emerald-600 rounded-xl">
                        <Mail className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>

            {/* Search & Filters */}
            <div className="bg-[var(--glass-fill)] p-4 rounded-xl border border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                        <Input
                            placeholder="Search by sender or content..."
                            className="pl-10 bg-[var(--bg-app)] border-[var(--separator)]"
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
                    <Select value={loopFilter} onValueChange={setLoopFilter}>
                        <SelectTrigger className="w-[140px] h-9 text-xs">
                            <SelectValue placeholder="All Loops" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Loops</SelectItem>
                            <SelectItem value="intro">Intro Loop</SelectItem>
                            <SelectItem value="followup">Follow Up</SelectItem>
                            <SelectItem value="nurture">Nurture Loop</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[140px] h-9 text-xs">
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--label-secondary)] h-9 text-xs ml-auto bg-[var(--fill-quaternary)] hover:bg-[var(--fill-tertiary)]"
                        onClick={() => {
                            setSearchQuery("");
                            setDateRange(undefined);
                            setLoopFilter("all");
                            setSortBy("newest");
                        }}
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>

            {/* Reply List */}
            <div className="space-y-4">
                {!loading &&
                    filteredReplies.map((reply) => (
                        <EmailReplyCard key={reply.id} reply={reply} />
                    ))}
                {!loading && filteredReplies.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-[var(--label-tertiary)] border border-dashed border-[var(--separator)] rounded-xl bg-[var(--bg-app)]/50">
                        <Mail className="h-8 w-8 mb-2 opacity-50" />
                        <p>No replies found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function EmailReplyCard({ reply }: { reply: any }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="bg-[var(--glass-fill)] border border-[var(--separator)] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] transition-all hover:shadow-[var(--glass-shadow)]"
        >
            <CollapsibleTrigger asChild>
                <div className="p-6 flex items-center gap-4 cursor-pointer group">
                    <div className="h-12 w-12 shrink-0 bg-[rgba(52,199,89,0.08)] text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                        <Reply className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-lg font-bold text-[var(--label-primary)] truncate">
                                    {reply.senderName}
                                </h4>
                                {reply.loop && (
                                    <Badge
                                        variant="outline"
                                        className="text-purple-600 bg-purple-50 border-purple-100 text-[10px] uppercase font-bold"
                                    >
                                        {reply.loop}
                                    </Badge>
                                )}
                                {reply.repliedToStep && (
                                    <Badge
                                        variant="outline"
                                        className="text-indigo-600 bg-indigo-50 border-indigo-100 text-[10px] font-bold gap-1"
                                    >
                                        <Reply className="h-3 w-3" />
                                        {reply.repliedToStep}
                                    </Badge>
                                )}
                                {reply.timestamp && (
                                    <Badge
                                        variant="outline"
                                        className="text-cyan-600 bg-cyan-50 border-cyan-100 text-[10px] font-bold"
                                    >
                                        {reply.timestamp}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-[var(--label-tertiary)]" />
                            <p className="text-xs text-[var(--label-secondary)] font-medium truncate">{reply.sender}</p>
                        </div>
                        {!isOpen && (
                            <p className="text-sm text-[var(--label-tertiary)] truncate max-w-md mt-1">
                                {reply.content.substring(0, 80)}...
                            </p>
                        )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                        <FollowUpBossButton lead={reply.rawLead || reply} variant="button" />
                        <div className="p-2 rounded-full text-[var(--label-tertiary)] group-hover:bg-[var(--bg-app)] group-hover:text-[var(--label-secondary)] transition-colors">
                            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                    </div>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="px-6 pb-6 pt-0">
                    <div className="pl-[64px] space-y-4 border-t border-[var(--separator)] pt-4">
                        <div className="p-4 bg-[var(--bg-app)] rounded-lg border border-[var(--separator)] text-sm text-[var(--label-primary)] whitespace-pre-wrap leading-relaxed">
                            {reply.content}
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
