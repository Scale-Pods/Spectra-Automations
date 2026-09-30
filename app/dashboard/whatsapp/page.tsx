"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    MessageCircle,
    TrendingUp,
    BarChart3,
    Send,
    Activity
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
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { subDays } from "date-fns";
import { LMLoader } from "@/components/spectra-loader";
import { SPECTRA_WHATSAPP_METRICS } from "@/lib/dummy-data";

export default function WhatsappDashboardPage() {
    const router = useRouter();

    const [dateRange, setDateRange] = useState<any>({
        from: subDays(new Date(), 90),
        to: new Date()
    });
    const loading = false;

    const stats = {
        totalLeads: 1480,
        sentCount: SPECTRA_WHATSAPP_METRICS.sentCount,
        uniqueSentCount: SPECTRA_WHATSAPP_METRICS.uniqueSentCount,
        totalReplies: SPECTRA_WHATSAPP_METRICS.totalReplies,
        activityReachouts: 5320,
        activityReplies: 740,
        dailyTrend: SPECTRA_WHATSAPP_METRICS.trendData
    };

    const trendData = SPECTRA_WHATSAPP_METRICS.trendData;

    const donutData = [
        { name: 'Unique Msg Sent', value: stats.uniqueSentCount, color: '#8b5cf6' },
        { name: 'Messages Sent', value: stats.sentCount, color: '#3b82f6' },
        { name: 'Total Replies', value: stats.totalReplies, color: '#10b981' },
    ];

    return (
        <div className="space-y-3 pb-3 relative min-h-[500px]">
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <MetricCard
                    title="Unique Msg Sent"
                    value={stats.uniqueSentCount.toLocaleString()}
                    icon={Users}
                    theme="purple"
                    onClick={() => router.push('/dashboard/whatsapp/leads')}
                />
                <MetricCard
                    title="Total Replies"
                    value={stats.totalReplies.toLocaleString()}
                    icon={MessageCircle}
                    theme="emerald"
                />
                <MetricCard
                    title="Messages Sent"
                    value={stats.sentCount.toLocaleString()}
                    icon={Send}
                    theme="blue"
                />
                <MetricCard
                    title="Activity Reachouts"
                    value={stats.activityReachouts.toLocaleString()}
                    icon={Activity}
                    theme="amber"
                />
                <MetricCard
                    title="Activity Replies"
                    value={stats.activityReplies.toLocaleString()}
                    icon={MessageCircle}
                    theme="amber"
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
                            <SummaryPill label="Unique Msg Sent" value={stats.uniqueSentCount} color="bg-purple-600" />
                            <SummaryPill label="Messages Sent" value={stats.sentCount} color="bg-blue-600" />
                            <SummaryPill label="Total Replies" value={stats.totalReplies} color="bg-emerald-600" />
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
                                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
