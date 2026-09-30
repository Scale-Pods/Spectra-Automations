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
import { useState } from "react";
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
import { SPECTRA_EMAIL_METRICS, SPECTRA_RECEIVED_EMAILS } from "@/lib/dummy-data";

export default function EmailDashboardPage() {
    const router = useRouter();
    const [dateSubtitle, setDateSubtitle] = useState("all time");

    const [dateRange, setDateRange] = useState<any>({
        from: subDays(new Date(), 90),
        to: new Date(),
    });

    const metrics = SPECTRA_EMAIL_METRICS;

    const chartData = metrics.dailyChartData.map((item) => ({
        ...item,
        dateFormatted: format(new Date(item.date + "T00:00:00"), "MMM dd"),
    }));

    const handleDateUpdate = (range: any) => {
        setDateRange(range.range);
        if (range.label) {
            setDateSubtitle(range.label.toLowerCase() === "today" ? "sent today" : `sent ${range.label.toLowerCase()}`);
        } else {
            setDateSubtitle("sent in selected range");
        }
    };

    return (
        <div className="space-y-8 pb-10 relative min-h-[500px]">
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
                            <h3 className="text-3xl font-extrabold text-[var(--label-primary)] mt-1">{metrics.totalSent.toLocaleString()}</h3>
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
                            <h3 className="text-3xl font-extrabold text-[var(--label-primary)] mt-1">{metrics.totalReplies.toLocaleString()}</h3>
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
                            <h3 className="text-3xl font-extrabold text-[var(--label-primary)] mt-1">{metrics.replyRate}%</h3>
                            <p className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Above Benchmark
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
                            <h3 className="text-3xl font-extrabold text-[var(--label-primary)] mt-1">{metrics.totalLeads.toLocaleString()}</h3>
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
                    {SPECTRA_RECEIVED_EMAILS.map((item) => (
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
                    ))}
                </div>
            </Card>
        </div>
    );
}

