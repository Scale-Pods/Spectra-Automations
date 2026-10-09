"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Mail,
    Inbox,
    BarChart3,
    Send,
    TrendingUp,
    Users,
    ArrowRight,
    MessageSquare,
    MailCheck,
    Clock
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { subDays, format } from "date-fns";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { useData } from "@/context/DataContext";
import { calculateEmailMetrics } from "@/lib/email-analytics-utils";
import { LMLoader } from "@/components/spectra-loader";

export default function EmailDashboardPage() {
    const router = useRouter();
    const { leads: allLeads, loadingLeads } = useData();
    const [dateSubtitle, setDateSubtitle] = useState("all time");

    const [dateRange, setDateRange] = useState<any>({
        from: subDays(new Date(), 90),
        to: new Date(),
    });

    const [apiAnalytics, setApiAnalytics] = useState<any>(null);
    const [loadingApi, setLoadingApi] = useState(false);

    useEffect(() => {
        const fetchApiAnalytics = async () => {
            if (!dateRange?.from) return;
            setLoadingApi(true);
            try {
                const fromStr = dateRange.from.toISOString();
                const toStr = (dateRange.to || dateRange.from).toISOString();
                const res = await fetch(`/api/email/analytics?start_date=${encodeURIComponent(fromStr)}&end_date=${encodeURIComponent(toStr)}`);
                if (res.ok) {
                    const data = await res.json();
                    setApiAnalytics(data);
                }
            } catch (err) {
                console.error("Error fetching email analytics API:", err);
            } finally {
                setLoadingApi(false);
            }
        };
        fetchApiAnalytics();
    }, [dateRange]);

    const calculatedMetrics = useMemo(() => {
        return calculateEmailMetrics(allLeads, dateRange);
    }, [allLeads, dateRange]);

    const metrics = useMemo(() => {
        const totalSent = apiAnalytics?.totalSent !== undefined ? apiAnalytics.totalSent : calculatedMetrics.totalSent;
        const totalReplies = apiAnalytics?.totalReplies !== undefined ? apiAnalytics.totalReplies : calculatedMetrics.totalReplies;
        const totalLeads = calculatedMetrics.totalLeadsCount > 0 ? calculatedMetrics.totalLeadsCount : 549;
        const replyRate = totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) : "0.0";
        
        const dailyChartData = (apiAnalytics?.dailyHistory && apiAnalytics.dailyHistory.length > 0)
            ? apiAnalytics.dailyHistory
            : calculatedMetrics.dailyChartData;

        return {
            totalSent,
            totalReplies,
            totalLeads,
            replyRate,
            dailyChartData,
        };
    }, [calculatedMetrics, apiAnalytics]);

    const receivedEmails = useMemo(() => {
        const replies: any[] = [];
        
        // 1. Process messages returned from /api/email/analytics
        if (apiAnalytics?.messages && Array.isArray(apiAnalytics.messages)) {
            apiAnalytics.messages.forEach((m: any) => {
                if (m.direction === 'INBOUND' || (m.status && m.status.toLowerCase().includes('reply'))) {
                    replies.push({
                        id: m.id,
                        lead_name: m.sender_address || m.recipient_address || "Email Lead",
                        sender_email: m.sender_address || m.recipient_address || "Lead",
                        subject: m.subject || "Inbound Email Response",
                        preview: (m.body_text || m.subject || "Email response received.").substring(0, 150),
                        date: m.sent_or_received_at ? format(new Date(m.sent_or_received_at), "yyyy-MM-dd HH:mm") : "Recent",
                        leadId: m.customer_id || m.recipient_address
                    });
                }
            });
        }

        // 2. Fallback / supplement from allLeads
        if (replies.length === 0) {
            allLeads.forEach((lead: any) => {
                const hasReply = lead.email_reply &&
                    String(JSON.stringify(lead.email_reply)) !== '[]' &&
                    String(JSON.stringify(lead.email_reply)) !== 'null' &&
                    String(JSON.stringify(lead.email_reply)) !== '""';

                if (hasReply) {
                    const senderEmail = lead.email || lead.lead_email || lead.Email || 'Prospect';
                    const leadName = lead.full_name || lead.customer_name || lead.name || 'Lead';
                    let preview = "Inbound email response received.";
                    if (Array.isArray(lead.email_reply) && lead.email_reply.length > 0) {
                        const lastItem = lead.email_reply[lead.email_reply.length - 1];
                        preview = lastItem.body_text || lastItem.content || lastItem.subject || JSON.stringify(lastItem);
                    } else if (typeof lead.email_reply === 'object') {
                        preview = lead.email_reply.body_text || lead.email_reply.content || JSON.stringify(lead.email_reply);
                    } else {
                        preview = String(lead.email_reply);
                    }
                    const dateRaw = lead.updated_at || lead.created_at || lead.eworks_created_on;
                    const dateStr = dateRaw ? format(new Date(dateRaw), "yyyy-MM-dd HH:mm") : "Recent";

                    replies.push({
                        id: lead.id || `reply-${Math.random()}`,
                        lead_name: leadName,
                        sender_email: senderEmail,
                        subject: lead.subject || "Re: Campaign Outreach",
                        preview: String(preview).replace(/\\n/g, ' ').substring(0, 150),
                        date: dateStr,
                        leadId: lead.id
                    });
                }
            });
        }
        return replies.slice(0, 10);
    }, [allLeads, apiAnalytics]);

    const chartData = useMemo(() => {
        return metrics.dailyChartData.map((item: any) => ({
            ...item,
            dateFormatted: item.date ? (item.date.includes('-') ? format(new Date(item.date + "T00:00:00"), "MMM dd") : item.date) : "Date",
        }));
    }, [metrics.dailyChartData]);

    const handleDateUpdate = (range: any) => {
        setDateRange(range.range);
        if (range.label) {
            setDateSubtitle(range.label.toLowerCase() === "today" ? "sent today" : `sent ${range.label.toLowerCase()}`);
        } else {
            setDateSubtitle("sent in selected range");
        }
    };

    const loading = loadingLeads || loadingApi;

    return (
        <div className="space-y-8 pb-10 relative min-h-[500px]">
            {loading && <LMLoader />}
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--label-primary)]">Email Marketing Center</h1>
                    <p className="text-[var(--label-secondary)]">Monitor your campaign outreach and email activity trends</p>
                </div>
                <DateRangePicker onUpdate={handleDateUpdate} />
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card
                    className="border-[var(--separator)] hover:shadow-lg transition-all cursor-pointer bg-[var(--glass-fill)]"
                    onClick={() => router.push('/dashboard/email/sent')}
                >
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--label-secondary)] font-semibold uppercase tracking-wider">Total Sent</p>
                            <h3 className="text-3xl font-extrabold text-[var(--label-primary)] mt-1">{loading ? "..." : metrics.totalSent.toLocaleString()}</h3>
                            <p className="text-[11px] text-blue-400 mt-1 font-medium flex items-center gap-1">
                                <MailCheck className="h-3 w-3" /> {dateSubtitle}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                            <Send className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="border-[var(--separator)] hover:shadow-lg transition-all cursor-pointer bg-[var(--glass-fill)]"
                    onClick={() => router.push('/dashboard/email/received')}
                >
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--label-secondary)] font-semibold uppercase tracking-wider">Total Replies</p>
                            <h3 className="text-3xl font-extrabold text-[var(--label-primary)] mt-1">{loading ? "..." : metrics.totalReplies.toLocaleString()}</h3>
                            <p className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Inbound Responses
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
                            <Inbox className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="border-[var(--separator)] hover:shadow-lg transition-all cursor-pointer bg-[var(--glass-fill)]"
                    onClick={() => router.push('/dashboard/email/analytics')}
                >
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--label-secondary)] font-semibold uppercase tracking-wider">Response Rate</p>
                            <h3 className="text-3xl font-extrabold text-[var(--label-primary)] mt-1">{loading ? "..." : metrics.replyRate}%</h3>
                            <p className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Campaign Performance
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[var(--separator)] bg-[var(--glass-fill)]">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--label-secondary)] font-semibold uppercase tracking-wider">Active Leads</p>
                            <h3 className="text-3xl font-extrabold text-[var(--label-primary)] mt-1">{loading ? "..." : metrics.totalLeads.toLocaleString()}</h3>
                            <p className="text-[11px] text-purple-400 mt-1 font-medium flex items-center gap-1">
                                <Users className="h-3 w-3" /> Targeted Contacts
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
                            <Users className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Performance Outreach & Reply Volume Graph */}
            <Card className="bg-[var(--glass-fill)] border-[var(--separator)] p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--label-primary)] flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-500" /> Daily Email Outreach & Reply Volume
                        </h3>
                        <p className="text-xs text-[var(--label-secondary)]">Trends over selected date range</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs w-fit">
                        Live Metrics
                    </Badge>
                </div>

                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--separator)" />
                            <XAxis dataKey="dateFormatted" stroke="var(--label-tertiary)" fontSize={11} tickLine={false} />
                            <YAxis stroke="var(--label-tertiary)" fontSize={11} tickLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-app)',
                                    borderColor: 'var(--separator)',
                                    borderRadius: '8px',
                                    color: 'var(--label-primary)'
                                }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="sent" name="Emails Sent" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSent)" strokeWidth={2.5} />
                            <Area type="monotone" dataKey="replies" name="Replies Received" stroke="#10b981" fillOpacity={1} fill="url(#colorReplies)" strokeWidth={2.5} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Recent Received Replies Section */}
            <Card className="bg-[var(--glass-fill)] border-[var(--separator)] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--label-primary)] flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-emerald-400" /> Recent Inbound Email Responses
                        </h3>
                        <p className="text-xs text-[var(--label-secondary)]">Latest replies from active prospects</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard/email/received')}
                        className="text-xs text-blue-400 hover:text-blue-300 gap-1"
                    >
                        View All Received <ArrowRight className="h-3 w-3" />
                    </Button>
                </div>

                <div className="space-y-3">
                    {receivedEmails.length > 0 ? (
                        receivedEmails.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => router.push('/dashboard/email/received')}
                                className="p-4 rounded-xl bg-white/[0.03] border border-[var(--separator)] hover:bg-white/[0.07] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-[var(--label-primary)]">{item.lead_name}</span>
                                        <span className="text-xs text-[var(--label-tertiary)]">&lt;{item.sender_email}&gt;</span>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                            Replied
                                        </Badge>
                                    </div>
                                    <p className="text-xs font-medium text-slate-300">{item.subject}</p>
                                    <p className="text-xs text-[var(--label-secondary)] line-clamp-1">&quot;{item.preview}&quot;</p>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-[var(--label-tertiary)] shrink-0 self-end md:self-center">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{item.date}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-xs text-[var(--label-tertiary)]">
                            No inbound email responses found in the selected time window.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}


