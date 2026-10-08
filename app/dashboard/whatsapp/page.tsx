"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    MessageCircle,
    TrendingUp,
    BarChart3,
    Send
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LineChart,
    Line
} from "recharts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { LMLoader } from "@/components/spectra-loader";
import { useData } from "@/context/DataContext";

export default function WhatsappDashboardPage() {
    const router = useRouter();

    const [dateRange, setDateRange] = useState<any>({
        from: subDays(new Date(), 90),
        to: new Date()
    });
    const [loading, setLoading] = useState(true);
    const [waData, setWaData] = useState<any>({
        uniqueSentCount: 0,
        sentCount: 0,
        totalReplies: 0,
        activityReachouts: 0,
        activityReplies: 0,
        trendData: [] as any[],
    });

    const fetchData = useCallback(async (from: Date, to: Date) => {
        setLoading(true);
        const fromISO = startOfDay(from).toISOString();
        const toISO = endOfDay(to).toISOString();
        try {
            const res = await fetch(`/api/whatsapp-leads?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`);
            if (!res.ok) throw new Error('Failed to fetch whatsapp leads');
            const loopData = await res.json();

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

            const nr_wf = loopData.nr_wf || [];
            const followup = loopData.followup || [];
            const nurture = loopData.nurture || [];
            const waActivity = loopData.wa_activity || [];

            // Deduplicate leads by unique phone / ID
            const leadMap = new Map<string, any>();
            [...nr_wf, ...followup, ...nurture, ...waActivity].forEach(l => {
                const rawPhone = l.phone_e164 || l.phone || l.Phone || l.mobile_raw || '';
                const cleanPhone = String(rawPhone).replace(/\D/g, '');
                const key = cleanPhone || String(l.id || l.Name || l.name || '').trim();
                if (key && !leadMap.has(key)) {
                    leadMap.set(key, l);
                }
            });

            const mergedLeads = Array.from(leadMap.values());

            const fromTime = startOfDay(from).getTime();
            const toTime = endOfDay(to).getTime();
            const inRange = (t: number) => t >= fromTime && t <= toTime;

            let sentCount = 0;
            let totalReplies = 0;
            const dailyMap: Record<string, { sent: number; replied: number }> = {};
            const uniqueLeads = new Set<string>();

            mergedLeads.forEach(lead => {
                const dateSource = lead.wp1_parsed_date || lead.created_at || lead["Created At"] || lead['1st_wa_ts'];
                if (dateSource) {
                    const parsed = parseDate(dateSource);
                    if (parsed && !inRange(parsed.getTime())) return;
                }

                const rawPhone = lead.phone_e164 || lead.phone || lead.Phone || lead.mobile_raw || '';
                const cleanPhone = String(rawPhone).replace(/\D/g, '');
                const key = cleanPhone || String(lead.id || lead.Name || lead.name || '').trim();

                const text1 = lead.whatsapp_1 ? String(lead.whatsapp_1).trim() : '';
                const text2 = lead.whatsapp_2 ? String(lead.whatsapp_2).trim() : '';
                const text3 = lead.whatsapp_3 ? String(lead.whatsapp_3).trim() : '';
                const text4 = lead.whatsapp_4 ? String(lead.whatsapp_4).trim() : '';
                const waText = lead.WA_text ? String(lead.WA_text).trim() : '';

                const hasWaText = waText !== '' || text1 !== '' || text2 !== '' || text3 !== '' || text4 !== '';

                const rVal = lead.WA_replied || lead.WP_Replied_track || lead.whatsapp_replied || lead.replied;
                const hasReplied = !!(rVal && String(rVal).trim() && !["no", "none", "0", "false", "null"].includes(String(rVal).trim().toLowerCase()));

                if (hasWaText || hasReplied) {
                    if (key) uniqueLeads.add(key);

                    let msgCount = 0;
                    if (waText) {
                        const turns = waText.match(/(User|AI|Agent|Bot|Template)\s*(?:\[[^\]]+\])?\s*:/gi);
                        msgCount = turns ? turns.length : 1;
                    } else {
                        if (text1) msgCount++;
                        if (text2) msgCount++;
                        if (text3) msgCount++;
                        if (text4) msgCount++;
                    }

                    sentCount += Math.max(1, msgCount);

                    if (hasReplied) totalReplies++;

                    if (dateSource) {
                        const parsed = parseDate(dateSource);
                        if (parsed) {
                            const dayKey = parsed.toISOString().slice(0, 10);
                            if (!dailyMap[dayKey]) dailyMap[dayKey] = { sent: 0, replied: 0 };
                            dailyMap[dayKey].sent += Math.max(1, msgCount);
                            if (hasReplied) dailyMap[dayKey].replied++;
                        }
                    }
                }
            });

            const uniqueSentCount = uniqueLeads.size;

            const trendData = Object.entries(dailyMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, vals]) => ({
                    date: format(new Date(date + 'T00:00:00'), 'MMM dd'),
                    sent: vals.sent,
                    replied: vals.replied,
                }));

            setWaData({
                uniqueSentCount,
                sentCount,
                totalReplies,
                activityReachouts: sentCount,
                activityReplies: totalReplies,
                trendData,
            });
        } catch (err) {
            console.error('Error fetching whatsapp page metrics:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (dateRange?.from) {
            fetchData(dateRange.from, dateRange.to || dateRange.from);
        }
    }, [dateRange, fetchData]);

    const stats = {
        totalLeads: waData.uniqueSentCount,
        sentCount: waData.sentCount,
        uniqueSentCount: waData.uniqueSentCount,
        totalReplies: waData.totalReplies,
        activityReachouts: waData.activityReachouts,
        activityReplies: waData.activityReplies,
        dailyTrend: waData.trendData
    };

    const donutData = [
        { name: 'Unique Leads Contacted', value: stats.uniqueSentCount, color: '#8b5cf6' },
        { name: 'Total Replies', value: stats.totalReplies, color: '#10b981' },
        { name: 'Messages Sent', value: stats.sentCount, color: '#3b82f6' },
    ];

    return (
        <div className="space-y-4 pb-3 relative min-h-[500px]">
            {loading && <LMLoader />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)] tracking-tight">WhatsApp Overview</h1>
                    <p className="text-[var(--label-secondary)] text-sm">Real-time engagement insights and campaign totals</p>
                </div>
                <DateRangePicker onUpdate={(range) => setDateRange(range.range)} />
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Unique Leads Contacted"
                    value={loading ? "..." : stats.uniqueSentCount.toLocaleString()}
                    icon={Users}
                    theme="purple"
                    onClick={() => router.push('/dashboard/whatsapp/leads')}
                />
                <MetricCard
                    title="Total Replies"
                    value={loading ? "..." : stats.totalReplies.toLocaleString()}
                    icon={MessageCircle}
                    theme="emerald"
                />
                <MetricCard
                    title="Messages Sent"
                    value={loading ? "..." : stats.sentCount.toLocaleString()}
                    icon={Send}
                    theme="blue"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] overflow-hidden">
                    <CardHeader className="bg-[var(--bg-app)]/50 border-b border-[var(--separator)]">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-[var(--label-secondary)]" />
                            <CardTitle className="text-sm font-bold text-[var(--label-primary)] uppercase">Conversion Funnel</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="w-full" style={{ height: 200, minHeight: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <SummaryPill label="Unique Leads Contacted" value={loading ? "..." : stats.uniqueSentCount} color="bg-purple-600" />
                            <SummaryPill label="Messages Sent" value={loading ? "..." : stats.sentCount} color="bg-blue-600" />
                            <SummaryPill label="Total Replies" value={loading ? "..." : stats.totalReplies} color="bg-emerald-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] overflow-hidden">
                    <CardHeader className="bg-[var(--bg-app)]/50 border-b border-[var(--separator)]">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-[var(--label-secondary)]" />
                            <CardTitle className="text-sm font-bold text-[var(--label-primary)] uppercase">Activity Trend</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="w-full" style={{ height: 200, minHeight: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.dailyTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="replied" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-8 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-4 bg-blue-600 rounded-full" />
                                <span className="text-xs font-bold text-[var(--label-secondary)] uppercase tracking-tight">Messages Sent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-4 bg-emerald-600 rounded-full" />
                                <span className="text-xs font-bold text-[var(--label-secondary)] uppercase tracking-tight">Replies Received</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, theme, onClick }: any) {
    const themes: any = {
        purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", iconBg: "bg-purple-100/50" },
        blue: { bg: "bg-[rgba(0,122,255,0.08)]", text: "text-blue-600", border: "border-blue-100", iconBg: "bg-blue-100/50" },
        emerald: { bg: "bg-[rgba(52,199,89,0.08)]", text: "text-emerald-600", border: "border-emerald-100", iconBg: "bg-emerald-100/50" },
        amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", iconBg: "bg-amber-100/50" },
    };
    const t = themes[theme] || themes.purple;

    return (
        <Card
            className={`border ${t.border} shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden relative ${onClick ? 'cursor-pointer hover:shadow-md hover:border-[var(--fill-tertiary)] transition-all active:scale-[0.98]' : ''}`}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${t.iconBg} ${t.text}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-[var(--label-primary)] tracking-tight">{value}</h3>
                        <p className="text-[10px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">{title}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SummaryPill({ label, value, color }: any) {
    return (
        <div className={`p-3 rounded-xl flex flex-col items-center justify-center text-white ${color} shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]`}>
            <span className="text-xl font-black">{value}</span>
            <span className="text-[9px] uppercase font-bold opacity-90 text-center leading-tight tracking-wider">{label}</span>
        </div>
    );
}

