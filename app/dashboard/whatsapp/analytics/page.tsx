"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar
} from "recharts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
    TrendingUp,
    Users,
    MessageSquare,
    Send,
    RefreshCw,
    Info,
    CheckCircle2,
    BarChart3,
    PieChart as PieIcon,
    ArrowUpRight,
    MessageCircle
} from "lucide-react";
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { LMLoader } from "@/components/ryan-loader";

export default function WhatsappAnalyticsPage() {
    const router = useRouter();

    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: subDays(new Date(), 90),
        to: new Date()
    });

    const [loopData, setLoopData] = useState<{ nr_wf: any[]; followup: any[]; nurture: any[]; owners: any[]; wa_activity: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (from: Date, to: Date) => {
        setLoading(true);
        const fromISO = startOfDay(from).toISOString();
        const toISO = endOfDay(to).toISOString();
        try {
            const res = await fetch(`/api/whatsapp-leads?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`);
            if (res.ok) {
                const data = await res.json();
                setLoopData(data);
            }
        } catch (err) {
            console.error("[WA Analytics fetch]", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!dateRange?.from) return;
        fetchData(dateRange.from, dateRange.to || dateRange.from);
    }, [dateRange, fetchData]);

    // Compute WhatsApp analytics metrics
    const stats = useMemo(() => {
        if (!loopData) return {
            uniqueSentCount: 0,
            sentCount: 0,
            totalReplies: 0,
            trendData: [] as any[],
            statusCounts: { sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 },
            statusPieData: [] as any[],
            conversionFunnelData: [] as any[],
        };

        const parseDate = (raw: any): Date | null => {
            if (!raw) return null;
            if (typeof raw === 'number') return new Date(raw);
            const s = String(raw).trim();
            if (!s) return null;
            const ddmmyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
            if (ddmmyyyy) {
                const day = ddmmyyyy[1].padStart(2, '0');
                const month = ddmmyyyy[2].padStart(2, '0');
                const year = ddmmyyyy[3];
                const hh = (ddmmyyyy[4] || '00').padStart(2, '0');
                const mm = (ddmmyyyy[5] || '00').padStart(2, '0');
                const ss = (ddmmyyyy[6] || '00').padStart(2, '0');
                const d = new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}.000Z`);
                if (!isNaN(d.getTime())) return d;
            }
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d;
        };

        const nr_wf = (loopData.nr_wf || []).map(l => ({ ...l, source_loop: "Intro" }));
        const followup = (loopData.followup || []).map(l => ({ ...l, source_loop: "Follow Up" }));
        const nurture = (loopData.nurture || []).map(l => ({ ...l, source_loop: "Nurture" }));
        const waActivity = (loopData.wa_activity || []).map(a => ({
            ...a,
            source_loop: "Activity",
            "Name": a.lead_name || a.name || "",
            "Phone": a.lead_phone || a.phone || "",
            "W.P_1": a.created_at || true,
            wp1_parsed_date: a.created_at,
            "WP_Replied_track": (a.replied_at || a.status === "completed" || a.status === "replied" || a.replied) ? "Replied" : "",
            status: a.status || (a.replied_at ? "replied" : "sent"),
        }));

        const mergedLeads = [...nr_wf, ...followup, ...nurture, ...waActivity];

        const from = dateRange?.from ? startOfDay(dateRange.from).getTime() : null;
        const to = endOfDay(dateRange?.to || dateRange?.from || new Date()).getTime();
        const inRange = (t: number) => !from || (t >= from && t <= to);

        let sentCount = 0;
        let totalReplies = 0;

        const dailyMap: Record<string, { reachouts: number; replies: number }> = {};
        const statusCounts = { sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 };

        const inRangeLeads = mergedLeads.filter(lead => {
            const dateSource = lead.wp1_parsed_date || lead.created_at || lead["Created At"] || lead['1st_wa_ts'];
            if (!dateSource) return true;
            const parsed = parseDate(dateSource);
            if (!parsed) return true;
            return inRange(parsed.getTime());
        });

        const uniqueLeads = new Set<string>();
        inRangeLeads.forEach(lead => {
            const phone = String(lead.Phone || lead.phone || lead.lead_phone || lead.customer_phone || '').replace(/\D/g, '');
            const key = phone || String(lead.Name || lead.lead_name || lead.name || lead.id || '').trim();
            if (key) uniqueLeads.add(key);
        });
        const uniqueSentCount = uniqueLeads.size;

        inRangeLeads.forEach(lead => {
            // Sent count calculation
            if (lead.source_loop === "Activity") {
                if (lead.content) {
                    const lines = String(lead.content).split('\n');
                    let found = 0;
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('Template:') || trimmed.startsWith('User:') || trimmed.startsWith('Agent:') || trimmed.startsWith('Agent :')) {
                            found++;
                        }
                    }
                    sentCount += Math.max(1, found);
                } else {
                    sentCount++;
                }
            } else {
                const waCnt = Number(lead.whatsapp_count || 0);
                if (waCnt > 0) {
                    sentCount += waCnt;
                } else {
                    let cnt = 0;
                    for (let i = 1; i <= 12; i++) {
                        if (lead[`W.P_${i}`]) cnt++;
                    }
                    if (lead["W.P_FollowUp"]) cnt++;
                    sentCount += Math.max(1, cnt);
                }
            }

            // Replies
            const hasReplied = (() => {
                if (lead.source_loop === "Activity") {
                    return !!(lead.replied_at || lead.status === "completed" || lead.status === "replied" || lead.replied);
                }
                const wp = lead.WP_Replied_track || lead["WP_Replied_track"] || lead.replied;
                return !!(wp && String(wp).trim() && String(wp).trim().toLowerCase() !== "no" && String(wp).trim().toLowerCase() !== "false" && String(wp).trim().toLowerCase() !== "none");
            })();

            if (hasReplied) totalReplies++;

            // Status distribution
            const stVal = String(lead.status || (hasReplied ? "replied" : "sent")).trim().toLowerCase();
            if (stVal.includes('read')) statusCounts.read++;
            else if (stVal.includes('delivered')) statusCounts.delivered++;
            else if (stVal.includes('replied')) statusCounts.replied++;
            else if (stVal.includes('failed') || stVal.includes('error')) statusCounts.failed++;
            else statusCounts.sent++;

            // Trend
            const dateSource = lead.wp1_parsed_date || lead.created_at || lead["Created At"] || lead['1st_wa_ts'];
            if (dateSource) {
                const parsed = parseDate(dateSource);
                if (parsed) {
                    const dayKey = parsed.toISOString().slice(0, 10);
                    if (!dailyMap[dayKey]) dailyMap[dayKey] = { reachouts: 0, replies: 0 };
                    dailyMap[dayKey].reachouts++;
                    if (hasReplied) dailyMap[dayKey].replies++;
                }
            }
        });

        const trendData = Object.entries(dailyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, { reachouts, replies }]) => ({
                date: format(new Date(date + 'T00:00:00'), 'MMM dd'),
                sent: reachouts,
                replied: replies,
            }));

        const statusPieData = [
            { name: "Direct Replies", value: totalReplies, color: "#10b981" },
            { name: "Delivered & Sent", value: Math.max(0, sentCount - totalReplies - statusCounts.failed), color: "#3b82f6" },
            { name: "Read", value: statusCounts.read, color: "#8b5cf6" },
            { name: "Failed / Bounced", value: statusCounts.failed, color: "#f43f5e" }
        ].filter(d => d.value > 0 || sentCount === 0);

        const conversionFunnelData = [
            { stage: "Leads Contacted", count: uniqueSentCount, fill: "#3b82f6" },
            { stage: "Messages Sent", count: sentCount, fill: "#6366f1" },
            { stage: "Replies Received", count: totalReplies, fill: "#10b981" },
        ];

        return {
            uniqueSentCount,
            sentCount,
            totalReplies,
            trendData,
            statusCounts,
            statusPieData,
            conversionFunnelData
        };
    }, [loopData, dateRange]);

    const replyRate = stats.uniqueSentCount > 0
        ? ((stats.totalReplies / stats.uniqueSentCount) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="space-y-6 pb-10 relative min-h-[500px]">
            {loading && <LMLoader />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)] flex items-center gap-2">
                        WhatsApp Analytics
                    </h1>
                    <p className="text-[var(--label-secondary)] text-sm">
                        Real-time delivery trends, response rates, and message engagement metrics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DateRangePicker onUpdate={({ range }) => setDateRange({ from: range?.from, to: range?.to })} />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (dateRange?.from) fetchData(dateRange.from, dateRange.to || dateRange.from);
                        }}
                        className="h-10"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={() => router.push('/dashboard/whatsapp/chat')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 shadow-sm"
                    >
                        <MessageSquare className="h-4 w-4" /> Go to Chat
                    </Button>
                </div>
            </div>

            {/* Primary KPI Cards */}
            <div>
                <p className="text-xs font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-3">
                    Campaign & Activity Overview
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Messages Sent"
                        value={loading ? "..." : stats.sentCount.toLocaleString()}
                        icon={Send}
                        color="text-blue-600"
                        bg="bg-blue-50"
                        desc="Total outbound pulses"
                    />
                    <StatCard
                        title="Unique Leads Contacted"
                        value={loading ? "..." : stats.uniqueSentCount.toLocaleString()}
                        icon={Users}
                        color="text-slate-700"
                        bg="bg-slate-100"
                        info="Count of distinct leads with outbound WhatsApp activity in selected period."
                    />
                    <StatCard
                        title="Total Replies"
                        value={loading ? "..." : stats.totalReplies.toLocaleString()}
                        icon={MessageSquare}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                        desc="Incoming lead responses"
                    />
                    <StatCard
                        title="Response Rate"
                        value={loading ? "..." : `${replyRate}%`}
                        icon={TrendingUp}
                        color="text-purple-600"
                        bg="bg-purple-50"
                        desc="Replies / Unique Leads"
                    />
                </div>
            </div>

            {/* Visual Analytics Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Engagement & Reply Volume Trend Chart */}
                <Card className="lg:col-span-2 border-white/10 shadow-xl bg-[#0d121f] text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-emerald-400" />
                                WhatsApp Reachout & Response Volume
                            </CardTitle>
                            <CardDescription className="text-slate-400">Daily breakdown of messages sent vs replies received</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                            Live Trend
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[320px] w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorWaSent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="colorWaReplied" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="sent" name="Reachouts Sent" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWaSent)" />
                                    <Area type="monotone" dataKey="replied" name="Replies Received" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWaReplied)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Delivery & Response Breakdown Donut */}
                <Card className="border-white/10 shadow-xl bg-[#0d121f] text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <PieIcon className="h-5 w-5 text-purple-400" />
                            Engagement Breakdown
                        </CardTitle>
                        <CardDescription className="text-slate-400">Proportional status of WhatsApp campaigns</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[320px] w-full flex flex-col items-center justify-center">
                            {stats.sentCount === 0 ? (
                                <div className="text-slate-400 text-sm">No outreach data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <PieChart>
                                        <Pie
                                            data={stats.statusPieData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {stats.statusPieData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any, name: any) => [
                                                `${Number(value).toLocaleString()} (${stats.sentCount > 0 ? ((Number(value) / stats.sentCount) * 100).toFixed(1) : 0}%)`,
                                                name
                                            ]}
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value: any) => {
                                                const item = stats.statusPieData.find((d: any) => d.name === value);
                                                const val = item ? item.value : 0;
                                                const pct = stats.sentCount > 0 ? ((val / stats.sentCount) * 100).toFixed(0) : '0';
                                                return <span className="text-xs font-medium text-slate-300">{value} ({val.toLocaleString()} - {pct}%)</span>;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Conversion Funnel Bar Chart */}
            <Card className="border-white/10 shadow-xl bg-[#0d121f] text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-400" />
                            WhatsApp Conversion Funnel
                        </CardTitle>
                        <CardDescription className="text-slate-400">Progression from Contacted Leads to Outbound Messages & Inbound Replies</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[220px] w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={stats.conversionFunnelData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="stage" stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} width={130} />
                                <Tooltip
                                    formatter={(value: any) => [`${Number(value).toLocaleString()} leads`, 'Volume']}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff'
                                    }}
                                />
                                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                                    {stats.conversionFunnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg, desc, info }: any) {
    return (
        <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden relative">
            {info && (
                <div className="absolute top-2 right-2">
                    <TooltipProvider>
                        <UITooltip>
                            <TooltipTrigger asChild>
                                <div className="p-1 cursor-help hover:scale-110 transition-transform">
                                    <Info className="h-4 w-4 text-[var(--label-tertiary)] hover:text-[var(--label-secondary)]" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[250px] p-3 text-xs bg-slate-900 text-white border-none shadow-2xl rounded-xl">
                                <p className="font-bold mb-1">Note</p>
                                <p className="opacity-90 leading-relaxed">{info}</p>
                            </TooltipContent>
                        </UITooltip>
                    </TooltipProvider>
                </div>
            )}
            <CardContent className="p-4 flex items-center gap-3.5">
                <div className={`p-3 rounded-xl ${bg} ${color} shrink-0`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">{title}</p>
                    <h3 className="text-xl font-bold text-[var(--label-primary)] mt-0.5">{value}</h3>
                    {desc && <p className="text-[10px] text-[var(--label-tertiary)] mt-0.5">{desc}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
