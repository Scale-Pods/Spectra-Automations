"use client";

import { LMLoader } from "@/components/spectra-loader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCw,
    Send,
    TrendingUp,
    Users,
    BarChart3,
    PieChart as PieIcon,
    MailCheck,
    MessageSquare
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays, format } from "date-fns";
import { useData } from "@/context/DataContext";
import { calculateEmailMetrics } from "@/lib/email-analytics-utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar
} from 'recharts';

import { SPECTRA_EMAIL_METRICS } from "@/lib/dummy-data";

export default function EmailAnalyticsPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 90),
        to: new Date(),
    });

    const loading = false;

    const handleDateUpdate = ({ range }: { range: DateRange | undefined }) => {
        setDateRange(range);
    };

    const analytics = SPECTRA_EMAIL_METRICS;

    const trendChartData = useMemo(() => {
        return SPECTRA_EMAIL_METRICS.dailyChartData.map(d => ({
            name: format(new Date(d.date + 'T00:00:00'), 'MMM dd'),
            sent: d.sent,
            replies: d.replies
        }));
    }, []);

    // Format Donut Distribution Data
    const donutData = useMemo(() => {
        const sentNoReply = Math.max(0, analytics.totalSent - analytics.totalReplies - analytics.totalUnsubscribed);
        return [
            { name: 'Direct Replies', value: analytics.totalReplies, color: '#10b981' },
            { name: 'Emails Sent', value: sentNoReply, color: '#3b82f6' },
            { name: 'Unsubscribed', value: analytics.totalUnsubscribed, color: '#f43f5e' },
        ].filter(d => d.value > 0 || analytics.totalSent === 0);
    }, [analytics]);

    const totalVolume = analytics.totalSent;

    return (
        <div className="space-y-8 pb-10 relative min-h-[500px]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--label-primary)]">Email Analytics</h1>
                    <p className="text-[var(--label-secondary)]">Real-time performance metrics, delivery trends, and response analytics.</p>
                </div>
                <div className="flex items-center gap-2">
                    <DateRangePicker onUpdate={handleDateUpdate} />
                    <Button
                        onClick={() => {}}
                        variant="outline"
                        size="icon"
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[var(--glass-fill)] border-[var(--separator)] shadow-lg">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--label-secondary)] font-semibold uppercase tracking-wider">Total Sent</p>
                            <h3 className="text-3xl font-extrabold text-white mt-1">{analytics.totalEmails.toLocaleString()}</h3>
                            <p className="text-[11px] text-blue-400 mt-1 font-medium flex items-center gap-1">
                                <MailCheck className="h-3 w-3" /> Outreach Delivered
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                            <Send className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--glass-fill)] border-[var(--separator)] shadow-lg">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--label-secondary)] font-semibold uppercase tracking-wider">Total Replies</p>
                            <h3 className="text-3xl font-extrabold text-white mt-1">{analytics.totalReplies.toLocaleString()}</h3>
                            <p className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> {analytics.replyRate}% Response Rate
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--glass-fill)] border-[var(--separator)] shadow-lg">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--label-secondary)] font-semibold uppercase tracking-wider">Active Leads</p>
                            <h3 className="text-3xl font-extrabold text-white mt-1">{analytics.totalLeadsCount.toLocaleString()}</h3>
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

            {/* Visual Analytics Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Email Sent & Reply Trend Chart */}
                <Card className="lg:col-span-2 border-white/10 shadow-xl bg-[#0d121f] text-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-400" />
                                Email Dispatch & Inbound Reply Volume
                            </CardTitle>
                            <CardDescription>Daily breakdown of emails sent vs inbound responses received</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                            Live Trend
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[320px] w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} />
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
                                    <Area type="monotone" dataKey="sent" name="Emails Sent" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSent)" />
                                    <Area type="monotone" dataKey="replies" name="Replies Received" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReplies)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Response Distribution Donut */}
                <Card className="border-white/10 shadow-xl bg-[#0d121f] text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <PieIcon className="h-5 w-5 text-emerald-400" />
                            Conversion Breakdown
                        </CardTitle>
                        <CardDescription>Proportional engagement per sent email batch</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[320px] w-full flex flex-col items-center justify-center">
                            {totalVolume === 0 ? (
                                <div className="text-slate-400 text-sm">No outreach data for distribution</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {donutData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any, name: any) => [
                                                `${Number(value).toLocaleString()} (${totalVolume > 0 ? ((Number(value) / totalVolume) * 100).toFixed(1) : 0}%)`,
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
                                                const item = donutData.find(d => d.name === value);
                                                const val = item ? item.value : 0;
                                                const pct = totalVolume > 0 ? ((val / totalVolume) * 100).toFixed(0) : '0';
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

            {loading && <LMLoader fullScreen={false} />}
        </div>
    );
}
