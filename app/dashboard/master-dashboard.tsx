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
    Smartphone
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
import { LMLoader } from "@/components/ryan-loader";
import { useData } from "@/context/DataContext";

import { extractReplyDate } from "@/lib/reply-utils";

import { SPECTRA_MASTER_METRICS, SPECTRA_DUMMY_LEADS } from "@/lib/dummy-data";

export default function MasterDashboard() {
    const [isRepliesModalOpen, setIsRepliesModalOpen] = useState(false);
    const [isRepliesExpanded, setIsRepliesExpanded] = useState(false);
    const [chatLead, setChatLead] = useState<any | null>(null);
    const [dateRange, setDateRange] = useState<any>({
        from: subDays(new Date(), 7),
        to: new Date()
    });

    const loading = false;
    const combinedReplyLeads = SPECTRA_DUMMY_LEADS.filter(l => l.replyStatus === "Replied");

    const acquisitionChartData = useMemo(() => {
        return SPECTRA_MASTER_METRICS.dailyAcquisition.map(d => ({
            name: format(new Date(d.date + 'T00:00:00'), 'MMM dd'),
            leads: d.leads
        }));
    }, []);

    const displayTotalLeads = SPECTRA_MASTER_METRICS.totalLeads;
    const displayEmailsSent = SPECTRA_MASTER_METRICS.totalEmailsSent;
    const displayWaReachouts = SPECTRA_MASTER_METRICS.totalWaReachouts;
    const displayReplies = SPECTRA_MASTER_METRICS.totalReplies;
    const displayReplyRate = SPECTRA_MASTER_METRICS.replyRate;

    const realServiceDistribution = useMemo(() => {
        return [
            { name: 'Email', value: displayEmailsSent, color: '#3b82f6' },
            { name: 'WhatsApp', value: displayWaReachouts, color: '#10b981' },
        ];
    }, [displayEmailsSent, displayWaReachouts]);

    const activeServiceDistribution = useMemo(() => 
        realServiceDistribution.filter(d => d.value > 0),
    [realServiceDistribution]);

    const totalOutreach = useMemo(() => 
        realServiceDistribution.reduce((acc, curr) => acc + curr.value, 0),
    [realServiceDistribution]);

    const router = useRouter();

    return (
        <div className="space-y-8 pb-10 relative min-h-[500px]">
            {loading && <LMLoader />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">Master Overview</h1>
                    <p className="text-[var(--label-secondary)]">Holistic view of all your marketing channels performance.</p>
                </div>
                <DateRangePicker onUpdate={({ range }) => setDateRange(range)} />
            </div>

            {/* Top Metric Cards Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Leads"
                    value={loading ? "..." : displayTotalLeads.toLocaleString()}
                    change={SPECTRA_MASTER_METRICS.oldestLeadDate ? `Since ${format(new Date(SPECTRA_MASTER_METRICS.oldestLeadDate), 'MMM d')}` : "Real-time"}
                    isUp={true}
                    icon={<Users className="h-6 w-6" />}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    border="border-blue-500/20"
                />
                <MetricCard
                    title="Total Emails Sent"
                    value={loading ? "..." : displayEmailsSent.toLocaleString()}
                    change="Real-time"
                    isUp={true}
                    icon={<TrendingUp className="h-6 w-6" />}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    border="border-emerald-500/20"
                    onClick={() => router.push('/dashboard/email/sent')}
                />
                <MetricCard
                    title="Total Whatsapp Reachouts"
                    value={loading ? "..." : displayWaReachouts.toLocaleString()}
                    change="Real-time"
                    isUp={true}
                    icon={<MessageCircle className="h-6 w-6" />}
                    color="text-purple-400"
                    bg="bg-purple-500/10"
                    border="border-purple-500/20"
                    onClick={() => router.push('/dashboard/whatsapp/chat')}
                />
                <MetricCard
                    title="Total Replies"
                    value={loading ? "..." : displayReplies.toLocaleString()}
                    change={`${displayReplyRate}% Rate`}
                    isUp={true}
                    icon={<Expand className="h-6 w-6" />}
                    color="text-indigo-400"
                    bg="bg-indigo-500/10"
                    border="border-indigo-500/20"
                    onClick={() => setIsRepliesModalOpen(true)}
                    info="This rate is calculated as (Total Replies / Total WhatsApp Reachouts). Disclaimer: This feature has been installed now. To check original replies and rates, please select the 'Last 3 Months' filter."
                    action={<Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg p-0 border border-white/10 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsRepliesExpanded(!isRepliesExpanded);
                        }}
                    >
                        {isRepliesExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </Button>}
                />
            </div>

            {/* Expanded Replies View */}
            {isRepliesExpanded && (
                <div className="bg-[#0d121f] border border-white/10 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white">Total Replies Details</h2>
                            <p className="text-sm text-slate-400">Detailed view of all replies across channels</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsRepliesExpanded(false)} className="text-slate-300 hover:bg-white/10">
                            <X className="h-4 w-4 mr-2" />
                            Close
                        </Button>
                    </div>
                    <TotalRepliesView leads={combinedReplyLeads} dateRange={dateRange} onViewLead={(lead) => { setIsRepliesExpanded(false); setChatLead(lead); }} />
                </div>
            )}

            {/* Replies Modal */}
            <Dialog open={isRepliesModalOpen} onOpenChange={setIsRepliesModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0d121f] text-white border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Total Replies - Detailed View</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <TotalRepliesView leads={combinedReplyLeads} dateRange={dateRange} onViewLead={(lead) => { setIsRepliesModalOpen(false); setChatLead(lead); }} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* WhatsApp Chat Detail — opened from Total Replies view */}
            <Dialog open={!!chatLead} onOpenChange={(open) => { if (!open) setChatLead(null); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-6 gap-0 bg-[#0d121f] text-white border-white/10">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Channel Reachout Activity Over Time */}
                <Card className="lg:col-span-2 border-white/10 shadow-xl bg-[#0d121f] text-white">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-white">Daily Outreach Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {acquisitionChartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                    No outreach data available for the selected period
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={acquisitionChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#007AFF" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#007AFF" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="leads" stroke="#007AFF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Channel Distribution Donut */}
                <Card className="border-white/10 shadow-xl bg-[#0d121f] text-white">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-white">Channel Volume Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            {totalOutreach === 0 ? (
                                <div className="text-slate-400 text-sm">No channel distribution data</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={activeServiceDistribution}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={85}
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
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value: any) => {
                                                const item = realServiceDistribution.find(d => d.name === value);
                                                const val = item ? item.value : 0;
                                                const pct = totalOutreach > 0 ? ((val / totalOutreach) * 100).toFixed(0) : '0';
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
            className={`bg-[#0d121f]/90 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative group hover:border-white/20 hover:bg-[#121829] transition-all duration-300 flex flex-col justify-between h-full min-h-[145px] ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <CardContent className="p-4 flex flex-col justify-between h-full">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight" title={title}>
                                {title}
                            </p>
                            {info && (
                                <UITooltipProvider>
                                    <UITooltip>
                                        <UITooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-slate-400 cursor-help hover:text-white transition-colors shrink-0" />
                                        </UITooltipTrigger>
                                        <UITooltipContent className="max-w-[250px] bg-slate-900/90 backdrop-blur-xl text-white border border-white/10 p-3 shadow-2xl rounded-xl z-50">
                                            <p className="text-[11px] leading-relaxed">{info}</p>
                                        </UITooltipContent>
                                    </UITooltip>
                                </UITooltipProvider>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {action}
                        <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0 border border-white/5`}>
                            {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}
                        </div>
                    </div>
                </div>

                {/* Big Metric Number */}
                <div className="my-2">
                    <h3 className="text-2xl font-extrabold text-white tracking-tight leading-none">{value}</h3>
                </div>

                {/* Bottom Status Tag */}
                <div className="flex items-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0" />
                        {change}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
