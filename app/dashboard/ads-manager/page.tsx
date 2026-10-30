"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MarketingNavTabs } from "@/components/marketing/nav-tabs";
import { INITIAL_CAMPAIGNS, ADS_SPEND_CHART_DATA, AdCampaign } from "@/lib/ads-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from "recharts";
import {
    Megaphone,
    TrendingUp,
    DollarSign,
    MousePointerClick,
    Eye,
    Plus,
    Filter,
    Play,
    Pause,
    Search,
    RefreshCw,
    CheckCircle2,
    SlidersHorizontal,
    ExternalLink,
    Sparkles,
    Check,
    ArrowUpRight,
    Target,
    Layers,
    AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdsManagerPage() {
    const router = useRouter();

    // Campaigns state
    const [campaigns, setCampaigns] = useState<AdCampaign[]>(INITIAL_CAMPAIGNS);
    const [platformFilter, setPlatformFilter] = useState<'all' | 'meta' | 'google'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPlatform, setNewPlatform] = useState<'meta' | 'google'>('meta');
    const [newName, setNewName] = useState('');
    const [newObjective, setNewObjective] = useState<'Conversions' | 'Lead Generation' | 'Traffic' | 'Brand Awareness' | 'Sales'>('Conversions');
    const [newBudget, setNewBudget] = useState('200');
    const [newHeadline, setNewHeadline] = useState('');
    const [newPrimaryText, setNewPrimaryText] = useState('');
    const [newCta, setNewCta] = useState('Learn More');
    const [newAudience, setNewAudience] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasPendingDraft, setHasPendingDraft] = useState(false);

    // On mount, check if there was a pending AI draft from AI Content Generation page
    useEffect(() => {
        try {
            const pending = localStorage.getItem("SPECTRA_PENDING_AD_DRAFT");
            if (pending) {
                const parsed = JSON.parse(pending);
                setNewHeadline(parsed.headline || '');
                setNewPrimaryText(parsed.primaryText || '');
                setNewCta(parsed.cta || 'Learn More');
                setNewObjective(parsed.objective || 'Conversions');
                setNewAudience(parsed.targetAudience || '');
                setNewName(`${parsed.productName || 'Spectra'} - AI Campaign`);
                if (parsed.platform === 'google' || parsed.platform === 'meta') {
                    setNewPlatform(parsed.platform);
                }
                setHasPendingDraft(true);
                // If URL has action=new-campaign, auto-open modal
                if (window.location.search.includes("action=new-campaign")) {
                    setIsCreateModalOpen(true);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    // Filter campaigns
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(c => {
            if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
            if (statusFilter !== 'all' && c.status !== statusFilter) return false;
            if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.headline.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [campaigns, platformFilter, statusFilter, searchQuery]);

    // Calculate aggregated metrics
    const metrics = useMemo(() => {
        const relevant = campaigns.filter(c => platformFilter === 'all' || c.platform === platformFilter);
        const totalSpend = relevant.reduce((sum, c) => sum + c.spent, 0);
        const totalImpressions = relevant.reduce((sum, c) => sum + c.impressions, 0);
        const totalClicks = relevant.reduce((sum, c) => sum + c.clicks, 0);
        const totalConversions = relevant.reduce((sum, c) => sum + c.conversions, 0);
        const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
        const avgCpa = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : '0.00';
        
        // Weighted ROAS
        const weightedRoas = relevant.length > 0 
            ? (relevant.reduce((sum, c) => sum + (c.roas * c.spent), 0) / (totalSpend || 1)).toFixed(2)
            : '4.82';

        return {
            totalSpend,
            totalImpressions,
            totalClicks,
            totalConversions,
            avgCtr,
            avgCpa,
            roas: weightedRoas
        };
    }, [campaigns, platformFilter]);

    // Toggle active / paused status
    const toggleStatus = (id: string) => {
        setCampaigns(prev => prev.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    status: c.status === 'active' ? 'paused' : 'active'
                };
            }
            return c;
        }));
    };

    // Handle Create Campaign
    const handleCreateCampaign = () => {
        if (!newName.trim()) return;

        setIsSubmitting(true);
        setTimeout(() => {
            const newCamp: AdCampaign = {
                id: `${newPlatform}-camp-${Date.now()}`,
                name: newName,
                platform: newPlatform,
                format: newPlatform === 'meta' ? 'facebook_feed' : 'google_search',
                status: 'active',
                objective: newObjective,
                dailyBudget: parseFloat(newBudget) || 150,
                spent: 0,
                impressions: 0,
                clicks: 0,
                ctr: 0,
                conversions: 0,
                cpa: 0,
                roas: 4.5,
                headline: newHeadline || "High-Converting AI Outreach",
                primaryText: newPrimaryText || "Transform your outbound pipeline with Spectra.",
                cta: newCta,
                targetAudience: newAudience || "Target ICP (B2B SaaS / Growth Marketers)",
                startDate: new Date().toISOString().split('T')[0],
                createdFromAI: true
            };

            setCampaigns([newCamp, ...campaigns]);
            setIsSubmitting(false);
            setIsCreateModalOpen(false);
            localStorage.removeItem("SPECTRA_PENDING_AD_DRAFT");
            setHasPendingDraft(false);
        }, 800);
    };

    return (
        <div className="space-y-6 pb-12 max-w-7xl mx-auto">
            {/* Top Navigation Switcher */}
            <MarketingNavTabs />

            {/* Header Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-violet-600/10 text-violet-600 border border-violet-200">
                            <Megaphone className="h-6 w-6" />
                        </span>
                        Unified Ads Manager
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Track live spend, conversions, and ROAS across Meta Ads (Facebook & Instagram) and Google Ads.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => router.push("/dashboard/ai-content")}
                        variant="outline"
                        className="border-violet-200 text-violet-700 hover:bg-violet-50 font-medium rounded-xl gap-2 text-sm h-10 px-4 bg-white"
                    >
                        <Sparkles className="h-4 w-4 text-violet-600" />
                        <span>AI Copy Studio</span>
                    </Button>

                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-md shadow-violet-500/20 rounded-xl gap-2 text-sm h-10 px-4"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Launch Campaign</span>
                    </Button>
                </div>
            </div>

            {/* Pending Draft Notification banner if available */}
            {hasPendingDraft && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border border-violet-200/80 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-violet-950">
                                AI Content Generated & Ready To Launch
                            </h4>
                            <p className="text-xs text-violet-700/90">
                                Headline: "{newHeadline.slice(0, 55)}..."
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl"
                    >
                        Review & Launch Ad
                    </Button>
                </div>
            )}

            {/* Platform Channel Selector Pills */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="inline-flex p-1 rounded-2xl bg-slate-200/60 backdrop-blur-md border border-slate-300/70">
                    <button
                        onClick={() => setPlatformFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                            platformFilter === 'all'
                                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        All Platforms ({campaigns.length})
                    </button>
                    <button
                        onClick={() => setPlatformFilter('meta')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                            platformFilter === 'meta'
                                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Meta Ads ({campaigns.filter(c => c.platform === 'meta').length})
                    </button>
                    <button
                        onClick={() => setPlatformFilter('google')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                            platformFilter === 'google'
                                ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        Google Ads ({campaigns.filter(c => c.platform === 'google').length})
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Status:</span>
                    <button
                        onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            statusFilter === 'active'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Active Only
                    </button>
                    <button
                        onClick={() => setStatusFilter(statusFilter === 'paused' ? 'all' : 'paused')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            statusFilter === 'paused'
                                ? 'bg-amber-100 text-amber-700 border-amber-300'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Paused
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                
                {/* 1. Total Ad Spend */}
                <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Total Ad Spend</span>
                        <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        ${metrics.totalSpend.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>+14.2% pacing vs target</span>
                    </div>
                </Card>

                {/* 2. Return on Ad Spend (ROAS) */}
                <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Average ROAS</span>
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                        {metrics.roas}x
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <span>Target: 3.50x minimum</span>
                    </div>
                </Card>

                {/* 3. Impressions */}
                <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Impressions</span>
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                            <Eye className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {(metrics.totalImpressions / 1000).toFixed(1)}k
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <span>Across Meta & Google</span>
                    </div>
                </Card>

                {/* 4. Clicks & CTR */}
                <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Clicks & Avg CTR</span>
                        <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                            <MousePointerClick className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {metrics.totalClicks.toLocaleString()}
                        <span className="text-xs font-semibold text-slate-500 ml-1.5">({metrics.avgCtr}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                        <span>+0.8% above benchmark</span>
                    </div>
                </Card>

                {/* 5. Conversions & CPA */}
                <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl p-4 space-y-2 col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Conversions & CPA</span>
                        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                            <Target className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {metrics.totalConversions}
                        <span className="text-xs font-semibold text-slate-500 ml-1.5">(${metrics.avgCpa})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                        <span>Strong acquisition velocity</span>
                    </div>
                </Card>
            </div>

            {/* Visual Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Spend vs Revenue Trend Area Chart */}
                <Card className="lg:col-span-8 border-slate-200/90 bg-white shadow-sm rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Daily Ad Spend vs Pipeline Revenue
                            </h3>
                            <p className="text-xs text-slate-500">
                                14-day aggregated cross-channel performance tracking
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-violet-600" /> Total Spend ($)
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Revenue Generated ($)
                            </span>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={ADS_SPEND_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '12px',
                                        border: '1px solid #E2E8F0',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        fontSize: '12px'
                                    }}
                                />
                                <Area type="monotone" dataKey="totalSpend" stroke="#7C3AED" strokeWidth={2.5} fillOpacity={1} fill="url(#spendGrad)" name="Ad Spend" />
                                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" name="Pipeline Revenue" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Channel Spend Allocation Bar Chart */}
                <Card className="lg:col-span-4 border-slate-200/90 bg-white shadow-sm rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Channel Spend Split
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Meta Ads vs Google Ads budget allocation
                        </p>

                        <div className="h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ADS_SPEND_CHART_DATA.slice(-6)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#FFFFFF',
                                            borderRadius: '10px',
                                            border: '1px solid #E2E8F0',
                                            fontSize: '11px'
                                        }}
                                    />
                                    <Bar dataKey="metaSpend" fill="#2563EB" radius={[4, 4, 0, 0]} name="Meta Ads" />
                                    <Bar dataKey="googleSpend" fill="#059669" radius={[4, 4, 0, 0]} name="Google Ads" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                            <span className="font-semibold text-blue-900 block">Meta Ads</span>
                            <span className="text-sm font-bold text-blue-700">$8,060 spent</span>
                            <span className="text-[10px] text-blue-600 block">5.1x Avg ROAS</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                            <span className="font-semibold text-emerald-900 block">Google Ads</span>
                            <span className="text-sm font-bold text-emerald-700">$10,390 spent</span>
                            <span className="text-[10px] text-emerald-600 block">4.5x Avg ROAS</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Campaign Management Table */}
            <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <span>Active Campaigns</span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {filteredCampaigns.length}
                            </span>
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Manage live status, budget pacing, and conversion efficiency.
                        </CardDescription>
                    </div>

                    {/* Search & Quick Controls */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search campaigns..."
                                className="pl-9 text-xs h-9 rounded-xl border-slate-200"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3.5 px-5">Campaign & Platform</th>
                                <th className="py-3.5 px-4 text-center">Status</th>
                                <th className="py-3.5 px-4">Objective</th>
                                <th className="py-3.5 px-4">Daily Budget / Spent</th>
                                <th className="py-3.5 px-4">Clicks & CTR</th>
                                <th className="py-3.5 px-4">Conversions</th>
                                <th className="py-3.5 px-4">ROAS</th>
                                <th className="py-3.5 px-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                            {filteredCampaigns.map((camp) => (
                                <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                                    
                                    {/* Campaign Name & Platform */}
                                    <td className="py-4 px-5">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                                camp.platform === 'meta'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {camp.platform === 'meta' ? 'M' : 'G'}
                                            </div>
                                            <div className="min-w-0 max-w-xs">
                                                <div className="font-semibold text-slate-900 truncate">
                                                    {camp.name}
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                                    "{camp.headline}"
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                                        camp.platform === 'meta' 
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    }`}>
                                                        {camp.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                                                    </span>
                                                    {camp.createdFromAI && (
                                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-50 text-violet-700 border border-violet-200 font-medium flex items-center gap-1">
                                                            <Sparkles className="h-2.5 w-2.5" /> AI Generated
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Status Switch Toggle */}
                                    <td className="py-4 px-4 text-center">
                                        <button
                                            onClick={() => toggleStatus(camp.id)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                                camp.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${camp.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                            <span className="capitalize">{camp.status}</span>
                                        </button>
                                    </td>

                                    {/* Objective */}
                                    <td className="py-4 px-4 font-medium text-slate-600">
                                        {camp.objective}
                                    </td>

                                    {/* Budget & Spent */}
                                    <td className="py-4 px-4">
                                        <div className="font-semibold text-slate-900">
                                            ${camp.spent.toLocaleString()}
                                            <span className="text-slate-400 font-normal text-[11px]"> / ${camp.dailyBudget}/day</span>
                                        </div>
                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                            <div 
                                                className="h-full bg-violet-600 rounded-full" 
                                                style={{ width: `${Math.min(100, (camp.spent / (camp.dailyBudget * 20)) * 100)}%` }} 
                                            />
                                        </div>
                                    </td>

                                    {/* Clicks & CTR */}
                                    <td className="py-4 px-4">
                                        <div className="font-semibold text-slate-900">
                                            {camp.clicks.toLocaleString()}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            {camp.ctr}% CTR
                                        </div>
                                    </td>

                                    {/* Conversions */}
                                    <td className="py-4 px-4">
                                        <div className="font-semibold text-slate-900">
                                            {camp.conversions}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            ${camp.cpa} CPA
                                        </div>
                                    </td>

                                    {/* ROAS */}
                                    <td className="py-4 px-4">
                                        <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            {camp.roas}x
                                        </span>
                                    </td>

                                    {/* Action Buttons */}
                                    <td className="py-4 px-5 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleStatus(camp.id)}
                                                className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                                            >
                                                {camp.status === 'active' ? (
                                                    <Pause className="h-3.5 w-3.5 text-amber-600 mr-1" />
                                                ) : (
                                                    <Play className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                                                )}
                                                <span>{camp.status === 'active' ? 'Pause' : 'Activate'}</span>
                                            </Button>
                                        </div>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Account Connections & Platform Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Meta Integration */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        M
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900">Meta Business & Pixel</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Connected
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Ad Account ID: <span className="font-mono text-slate-700">act_84920491823</span> · Pixel ID: <span className="font-mono text-slate-700">9281048194</span>
                        </p>
                        <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-1">
                            <span>Conversions API (CAPI): <strong>Verified</strong></span>
                            <span>·</span>
                            <span>Auto-Sync: <strong>Active (5m)</strong></span>
                        </div>
                    </div>
                </div>

                {/* Google Ads Integration */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        G
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900">Google Ads MCC</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Connected
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Customer ID: <span className="font-mono text-slate-700">849-204-1928</span> · Enhanced Conversions: <span className="font-mono text-slate-700">Active</span>
                        </p>
                        <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-1">
                            <span>Tag Manager: <strong>GTM-SP7819</strong></span>
                            <span>·</span>
                            <span>Smart Bidding: <strong>Target ROAS</strong></span>
                        </div>
                    </div>
                </div>

            </div>

            {/* CREATE CAMPAIGN DIALOG MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-xl rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-violet-600" />
                            Launch New Ad Campaign
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Deploy verified ad campaigns to Meta Ads and Google Ads with real-time budget controls.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        {/* Platform Selector */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Target Ad Network</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setNewPlatform('meta')}
                                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-2 ${
                                        newPlatform === 'meta'
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                    Meta Ads (FB & Instagram)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewPlatform('google')}
                                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-2 ${
                                        newPlatform === 'google'
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                                    Google Ads (Search & PMax)
                                </button>
                            </div>
                        </div>

                        {/* Campaign Name */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Campaign Name</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Spectra AI Outreach - High Intent Search Q4"
                                className="text-sm h-10 rounded-xl"
                            />
                        </div>

                        {/* Objective & Daily Budget */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Objective</Label>
                                <select
                                    value={newObjective}
                                    onChange={(e: any) => setNewObjective(e.target.value)}
                                    className="w-full text-xs sm:text-sm p-2 rounded-xl border border-slate-200 focus:border-violet-500"
                                >
                                    <option value="Conversions">Conversions & Sales</option>
                                    <option value="Lead Generation">Lead Generation</option>
                                    <option value="Traffic">Website Traffic</option>
                                    <option value="Brand Awareness">Brand Awareness</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Daily Budget ($)</Label>
                                <Input
                                    type="number"
                                    value={newBudget}
                                    onChange={(e) => setNewBudget(e.target.value)}
                                    placeholder="200"
                                    className="text-sm h-10 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Ad Headline */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-700">Ad Headline</Label>
                                <span className="text-[10px] text-slate-400">{newHeadline.length} chars</span>
                            </div>
                            <Input
                                value={newHeadline}
                                onChange={(e) => setNewHeadline(e.target.value)}
                                placeholder="e.g. Automate 80% Of Your Outbound Sales Pipeline"
                                className="text-sm h-10 rounded-xl"
                            />
                        </div>

                        {/* Primary Text */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Primary Ad Copy / Text</Label>
                            <textarea
                                value={newPrimaryText}
                                onChange={(e) => setNewPrimaryText(e.target.value)}
                                rows={3}
                                placeholder="Enter your high-converting primary body copy..."
                                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-violet-500 resize-none"
                            />
                        </div>

                        {/* Call To Action & Target Audience */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Call To Action (CTA)</Label>
                                <select
                                    value={newCta}
                                    onChange={(e) => setNewCta(e.target.value)}
                                    className="w-full text-xs sm:text-sm p-2 rounded-xl border border-slate-200 focus:border-violet-500"
                                >
                                    <option value="Start Free Trial">Start Free Trial</option>
                                    <option value="Book a Demo">Book a Demo</option>
                                    <option value="Learn More">Learn More</option>
                                    <option value="Claim Offer">Claim Offer</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Audience Segment</Label>
                                <Input
                                    value={newAudience}
                                    onChange={(e) => setNewAudience(e.target.value)}
                                    placeholder="e.g. B2B Founders, Agency Leaders"
                                    className="text-xs sm:text-sm h-10 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="rounded-xl text-slate-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateCampaign}
                            disabled={isSubmitting || !newName.trim()}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    <span>Deploying to Ad Network...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    <span>Deploy & Launch</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
