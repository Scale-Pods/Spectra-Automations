"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    MessageCircle,
    TrendingUp,
    PieChart as PieChartIcon,
    Activity,
    Maximize2,
    Minimize2,
    X,
    Expand,
    Info,
    Smartphone,
    Briefcase,
    ChevronRight,
    DollarSign,
    Wrench,
    FileText
} from "lucide-react";
import {
    Tooltip as UITooltip,
    TooltipContent as UITooltipContent,
    TooltipProvider as UITooltipProvider,
    TooltipTrigger as UITooltipTrigger,
} from "@/components/ui/tooltip";
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
    Legend
} from 'recharts';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { TotalRepliesView } from "@/components/dashboard/total-replies-view";
import { WhatsAppChatDetail } from "@/components/dashboard/whatsapp-chat-detail";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { LMLoader } from "@/components/spectra-loader";
import { useData } from "@/context/DataContext";
import { extractReplyDate } from "@/lib/reply-utils";
import { SPECTRA_EWORKS_METRICS } from "@/lib/eworks-data";

export default function MasterDashboard() {
    const { masterMetrics, leads, loadingMasterMetrics, loadingLeads } = useData();
    const [isRepliesModalOpen, setIsRepliesModalOpen] = useState(false);
    const [isRepliesExpanded, setIsRepliesExpanded] = useState(false);
    const [chatLead, setChatLead] = useState<any | null>(null);
    const [dateRange, setDateRange] = useState<any>({
        from: subDays(new Date(), 7),
        to: new Date()
    });

    const loading = loadingMasterMetrics || loadingLeads;

    const combinedReplyLeads = useMemo(() => {
        return (leads || []).filter((l: any) => {
            return l.email_replied ||
                l.WP_Replied_track ||
                l.status === 'replied' ||
                l.replyStatus === 'Replied' ||
                !!l.replied_at;
        });
    }, [leads]);

    const displayTotalLeads = masterMetrics?.totalLeads ?? leads.length;
    const displayEmailsSent = masterMetrics?.activityEmailCount ?? 0;
    const displayWaReachouts = masterMetrics?.totalWaReachouts || masterMetrics?.activityWaCount || 0;
    const displayReplies = masterMetrics?.activityRepliesCount || masterMetrics?.totalWaReplies || 0;
    const totalOutreach = displayEmailsSent + displayWaReachouts;
    const displayReplyRate = totalOutreach > 0 ? ((displayReplies / totalOutreach) * 100).toFixed(1) : "0.0";

    const acquisitionChartData = useMemo(() => {
        const daily = masterMetrics?.dailyAcquisition || masterMetrics?.leadsDaily || [];
        return daily.map((d: any) => ({
            name: d.date ? (d.date.includes('-') ? format(new Date(d.date + 'T00:00:00'), 'MMM dd') : d.date) : "Date",
            leads: d.leads || d.count || 0
        }));
    }, [masterMetrics]);

    const realServiceDistribution = useMemo(() => {
        return [
            { name: 'Email', value: displayEmailsSent, color: '#3b82f6' },
            { name: 'WhatsApp', value: displayWaReachouts, color: '#10b981' },
        ];
    }, [displayEmailsSent, displayWaReachouts]);

    const activeServiceDistribution = useMemo(() => 
        realServiceDistribution.filter(d => d.value > 0),
    [realServiceDistribution]);

    const totalOutreachVal = useMemo(() => 
        realServiceDistribution.reduce((acc, curr) => acc + curr.value, 0),
    [realServiceDistribution]);

    const router = useRouter();

    return (
        <div className="space-y-8 pb-10 relative min-h-[500px]">
            {loading && <LMLoader />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        Master Overview
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Telemetry
                        </span>
                    </h1>
                    <p className="text-xs font-medium text-slate-500 mt-1">Holistic view of all marketing automation channels & customer intelligence.</p>
                </div>
                <div className="flex items-center gap-3">
                    <DateRangePicker onUpdate={({ range }) => setDateRange(range)} />
                </div>
            </div>

            {/* Top Metric Cards Grid with Staggered Entrance */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="animate-fade-in-up stagger-1">
                    <MetricCard
                        title="Total Leads"
                        value={loading ? "..." : displayTotalLeads.toLocaleString()}
                        change={masterMetrics?.oldestLeadDate ? `Since ${format(new Date(masterMetrics.oldestLeadDate), 'MMM d')}` : "Real-time"}
                        isUp={true}
                        icon={<Users className="h-6 w-6" />}
                        color="text-blue-600"
                        bg="bg-blue-50 text-blue-600 border-blue-100"
                        border="border-blue-200/80"
                    />
                </div>
                <div className="animate-fade-in-up stagger-2">
                    <MetricCard
                        title="Total Emails Sent"
                        value={loading ? "..." : displayEmailsSent.toLocaleString()}
                        change="Real-time"
                        isUp={true}
                        icon={<TrendingUp className="h-6 w-6" />}
                        color="text-emerald-600"
                        bg="bg-emerald-50 text-emerald-600 border-emerald-100"
                        border="border-emerald-200/80"
                        onClick={() => router.push('/dashboard/email/sent')}
                    />
                </div>
                <div className="animate-fade-in-up stagger-3">
                    <MetricCard
                        title="Total WhatsApp Reachouts"
                        value={loading ? "..." : displayWaReachouts.toLocaleString()}
                        change="Real-time"
                        isUp={true}
                        icon={<MessageCircle className="h-6 w-6" />}
                        color="text-purple-600"
                        bg="bg-purple-50 text-purple-600 border-purple-100"
                        border="border-purple-200/80"
                        onClick={() => router.push('/dashboard/whatsapp/chat')}
                    />
                </div>
                <div className="animate-fade-in-up stagger-4">
                    <MetricCard
                        title="Total Replies"
                        value={loading ? "..." : displayReplies.toLocaleString()}
                        change={`${displayReplyRate}% Reply Rate`}
                        isUp={true}
                        icon={<Expand className="h-6 w-6" />}
                        color="text-indigo-600"
                        bg="bg-indigo-50 text-indigo-600 border-indigo-100"
                        border="border-indigo-200/80"
                        onClick={() => setIsRepliesModalOpen(true)}
                        info="This rate is calculated as (Total Replies / Total Outreach across Email & WhatsApp)."
                        action={<Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg p-0 border border-slate-200 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsRepliesExpanded(!isRepliesExpanded);
                            }}
                        >
                            {isRepliesExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        </Button>}
                    />
                </div>
            </div>

            {/* eWorks Operations & Schema Summary Banner */}
            <div className="animate-fade-in-up stagger-5 bg-gradient-to-br from-white via-slate-50/80 to-purple-50/30 backdrop-blur-xl border border-purple-100/80 rounded-2xl p-6 shadow-md text-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-500" />
                <div className="space-y-2.5 max-w-2xl relative z-10">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="p-2.5 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/20">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">eWorks Operations & Schema Hub</h2>
                        <span className="text-xs px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shadow-20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block" />
                            Live Supabase Sync Active
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        Manage eWorks customers, active maintenance jobs, quote proposals, invoice balances, AMC contracts, and retention automation decision queues in real-time.
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-700 flex-wrap font-medium">
                        <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> AED 3,072,278.20 Invoiced
                        </span>
                        <span className="flex items-center gap-1 font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200/60">
                            <Wrench className="h-3.5 w-3.5 text-violet-600" /> 252 Active Jobs
                        </span>
                        <span className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60">
                            <FileText className="h-3.5 w-3.5 text-indigo-600" /> 852 Pending Quotes
                        </span>
                    </div>
                </div>

                <Button
                    onClick={() => router.push('/dashboard/eworks')}
                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/25 rounded-xl font-semibold px-6 py-5 text-xs shrink-0 relative z-10 group-hover:translate-x-0.5 transition-all"
                >
                    Explore eWorks CRM Hub <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
            </div>

            {/* Expanded Replies View */}
            {isRepliesExpanded && (
                <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-6 shadow-2xl animate-fade-in-up text-slate-900">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Total Replies Details</h2>
                            <p className="text-xs text-slate-500">Detailed view of all replies across channels</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsRepliesExpanded(false)} className="text-slate-600 hover:bg-slate-100 rounded-xl">
                            <X className="h-4 w-4 mr-2" />
                            Close
                        </Button>
                    </div>
                    <TotalRepliesView leads={combinedReplyLeads} dateRange={dateRange} onViewLead={(lead) => { setIsRepliesExpanded(false); setChatLead(lead); }} />
                </div>
            )}

            {/* Replies Modal */}
            <Dialog open={isRepliesModalOpen} onOpenChange={setIsRepliesModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 text-slate-900 border-slate-200 rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 font-bold text-lg">Total Replies - Detailed View</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <TotalRepliesView leads={combinedReplyLeads} dateRange={dateRange} onViewLead={(lead) => { setIsRepliesModalOpen(false); setChatLead(lead); }} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* WhatsApp Chat Detail — opened from Total Replies view */}
            <Dialog open={!!chatLead} onOpenChange={(open) => { if (!open) setChatLead(null); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-6 gap-0 bg-white/95 text-slate-900 border-slate-200 rounded-2xl">
                    <DialogHeader className="sr-only"><DialogTitle>WhatsApp Chat Detail</DialogTitle></DialogHeader>
                    {chatLead && (
                        <WhatsAppChatDetail
                            customerId={String(chatLead["Lead ID"] || chatLead.id || "")}
                            initialLead={chatLead}
                            onClose={() => setChatLead(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                {/* Channel Reachout Activity Over Time */}
                <Card className="lg:col-span-2 border-slate-200/80 shadow-md bg-white/90 text-slate-900 rounded-2xl hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-violet-600" /> Daily Outreach Activity
                            </CardTitle>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                                Real-Time Volume
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full pt-2">
                            {acquisitionChartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                                    No outreach data available for the selected period
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={acquisitionChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                        <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                                borderRadius: '14px',
                                                border: '1px solid #E2E8F0',
                                                boxShadow: '0 10px 30px -5px rgba(124,58,237,0.12)'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="leads" name="Total Outreach" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Channel Distribution Donut */}
                <Card className="border-slate-200/80 shadow-md bg-white/90 text-slate-900 rounded-2xl hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-emerald-600" /> Channel Volume Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center relative">
                            {totalOutreach === 0 ? (
                                <div className="text-slate-400 text-xs">No channel distribution data</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={activeServiceDistribution}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={65}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {activeServiceDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any, name: any) => [
                                                `${Number(value).toLocaleString()} (${((Number(value) / totalOutreach) * 100).toFixed(1)}%)`,
                                                name
                                            ]}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                                borderRadius: '14px',
                                                border: '1px solid #E2E8F0',
                                                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value: any) => {
                                                const item = realServiceDistribution.find(d => d.name === value);
                                                const val = item ? item.value : 0;
                                                const pct = totalOutreach > 0 ? ((val / totalOutreach) * 100).toFixed(0) : '0';
                                                return <span className="text-xs font-semibold text-slate-700">{value}: {val.toLocaleString()} ({pct}%)</span>;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ title, value, change, isUp, icon, color, bg, border, onClick, action, info }: {
    title: string;
    value: string;
    change: string;
    isUp: boolean;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    onClick?: () => void;
    action?: React.ReactNode;
    info?: string;
}) {
    return (
        <Card
            className={`bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-md overflow-hidden relative group hover:border-violet-400/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full min-h-[145px] rounded-2xl ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {/* Hover Shimmer Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight" title={title}>
                                {title}
                            </p>
                            {info && (
                                <UITooltipProvider>
                                    <UITooltip>
                                        <UITooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-slate-400 cursor-help hover:text-slate-700 transition-colors shrink-0" />
                                        </UITooltipTrigger>
                                        <UITooltipContent className="max-w-[250px] bg-slate-900 text-white border border-slate-800 p-3 shadow-2xl rounded-xl z-50">
                                            <p className="text-[11px] leading-relaxed">{info}</p>
                                        </UITooltipContent>
                                    </UITooltip>
                                </UITooltipProvider>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {action}
                        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0 border border-slate-100 shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                            {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}
                        </div>
                    </div>
                </div>

                {/* Big Metric Number */}
                <div className="my-2">
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-violet-700 transition-colors">{value}</h3>
                </div>

                {/* Bottom Status Tag */}
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        {change}
                    </span>
                    {onClick && (
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
