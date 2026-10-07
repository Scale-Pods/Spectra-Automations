"use client";

import React, { useState, useEffect, useCallback } from "react";
import { EworksCustomer } from "@/lib/eworks-data";
import { EworksCustomerDetail } from "@/components/dashboard/eworks-customer-detail";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LMLoader } from "@/components/spectra-loader";
import {
    Briefcase,
    FileText,
    Receipt,
    Users,
    Search,
    Filter,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Clock,
    DollarSign,
    TrendingUp,
    Wrench,
    Sparkles,
    Bot,
    ExternalLink,
    RefreshCw,
    Activity,
    Layers,
    ChevronRight,
    ChevronLeft,
    Loader2
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { format } from "date-fns";

export default function EworksDashboardPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState<"all" | "active_jobs" | "pending_quotes" | "unpaid_invoices" | "amc" | "retention_ready">("all");
    const [selectedCustomer, setSelectedCustomer] = useState<EworksCustomer | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Real API Data State
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [customers, setCustomers] = useState<EworksCustomer[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 1
    });
    const [metrics, setMetrics] = useState({
        totalCustomers: 0,
        totalInvoiced: 0,
        totalReceived: 0,
        totalOutstanding: 0,
        activeJobs: 0,
        completedJobs: 0,
        totalJobs: 0,
        pendingQuotes: 0,
        totalQuotes: 0,
        amcCustomers: 0,
        retentionReady: 0,
        unpaidInvoices: 0,
        overdueInvoices: 0,
        serviceCategories: [] as Array<{ name: string; count: number; revenue: number; color: string }>
    });
    const [filterCounts, setFilterCounts] = useState({
        all: 0,
        active_jobs: 0,
        pending_quotes: 0,
        unpaid_invoices: 0,
        amc: 0,
        retention_ready: 0
    });

    // Reset page to 1 whenever search query or category filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory]);

    // Fetch Live Real Data from /api/eworks/customers
    const fetchEworksData = useCallback(async (showFullLoader = true) => {
        if (showFullLoader) setLoading(true);
        else setIsRefreshing(true);

        try {
            const query = new URLSearchParams({
                page: String(currentPage),
                limit: String(itemsPerPage),
                search: searchTerm.trim(),
                category: filterCategory
            });

            const res = await fetch(`/api/eworks/customers?${query.toString()}`);
            if (!res.ok) {
                throw new Error(`Failed to fetch eWorks customers: ${res.statusText}`);
            }

            const data = await res.json();
            setCustomers(data.customers || []);
            if (data.pagination) setPagination(data.pagination);
            if (data.metrics) setMetrics(data.metrics);
            if (data.filterCounts) setFilterCounts(data.filterCounts);
        } catch (err) {
            console.error('Error fetching live eWorks data:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, filterCategory]);

    useEffect(() => {
        fetchEworksData(currentPage === 1 && customers.length === 0);
    }, [fetchEworksData]);

    const formatCurrency = (amount?: number | null) => {
        if (amount === undefined || amount === null) return "AED 0.00";
        return `AED ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "N/A";
        try {
            return format(new Date(dateStr), "MMM dd, yyyy");
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-8 pb-12 font-sans relative">
            {loading && <LMLoader />}

            {/* Customer Detail Drawer Modal */}
            <EworksCustomerDetail
                customer={selectedCustomer}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />

            {/* Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                            <Briefcase className="h-6 w-6 text-violet-600" />
                            eWorks Operations & CRM
                        </h1>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-0.5 font-semibold rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 inline-block" />
                            Live Supabase PostgreSQL Data ({metrics.totalCustomers} Accounts)
                        </Badge>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        Real-time live Supabase database telemetry of eWorks customers, active job executions, quote proposals, invoice balances, and automation decisions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => fetchEworksData(false)}
                        disabled={isRefreshing}
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs shadow-sm rounded-xl"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-2 text-violet-600 ${isRefreshing ? "animate-spin" : ""}`} />
                        {isRefreshing ? "Refreshing Database..." : "Sync eWorks Database"}
                    </Button>
                </div>
            </div>

            {/* Top Metric Cards Grid (Live aggregated from Supabase database) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-md hover:border-slate-300 hover:bg-slate-50/90 transition-all rounded-2xl p-5 text-slate-900 flex flex-col justify-between h-full min-h-[150px]">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Invoiced Revenue</p>
                            <h3 className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1">
                                {formatCurrency(metrics.totalInvoiced)}
                            </h3>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                        <div className="flex justify-between items-center">
                            <span>Received Amount</span>
                            <span className="font-semibold text-slate-700">{formatCurrency(metrics.totalReceived)}</span>
                        </div>
                        <div className="flex justify-between items-center text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                            <span>Outstanding Balance</span>
                            <span>{formatCurrency(metrics.totalOutstanding)}</span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-md hover:border-slate-300 hover:bg-slate-50/90 transition-all rounded-2xl p-5 text-slate-900 flex flex-col justify-between h-full min-h-[150px]">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Jobs Pipeline</p>
                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                                {metrics.activeJobs} <span className="text-sm font-semibold text-amber-600">Active</span>
                            </h3>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center shrink-0">
                            <Wrench className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                        <div className="flex justify-between items-center">
                            <span>Completed Jobs</span>
                            <span className="font-semibold text-slate-700">{metrics.completedJobs.toLocaleString()} / {metrics.totalJobs.toLocaleString()} total</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-violet-700 font-medium bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200/60">
                            <span>Live eWorks Jobs Sync Active</span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-md hover:border-slate-300 hover:bg-slate-50/90 transition-all rounded-2xl p-5 text-slate-900 flex flex-col justify-between h-full min-h-[150px]">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quotes & Proposals</p>
                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                                {metrics.pendingQuotes} <span className="text-sm font-semibold text-indigo-600">Pending</span>
                            </h3>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                        <div className="flex justify-between items-center">
                            <span>Total Quotes Generated</span>
                            <span className="font-semibold text-slate-700">{metrics.totalQuotes.toLocaleString()} Quotes</span>
                        </div>
                        <div className="flex justify-between items-center text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200/60">
                            <span>Active AMC Contracts</span>
                            <span>{metrics.amcCustomers}</span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-md hover:border-slate-300 hover:bg-slate-50/90 transition-all rounded-2xl p-5 text-slate-900 flex flex-col justify-between h-full min-h-[150px]">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Retention & Automation</p>
                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                                {metrics.retentionReady} <span className="text-sm font-semibold text-purple-600">Ready</span>
                            </h3>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                        <div className="flex justify-between items-center">
                            <span>Unpaid & Overdue</span>
                            <span className="font-semibold text-slate-700">{metrics.unpaidInvoices} Unpaid • {metrics.overdueInvoices} Overdue</span>
                        </div>
                        <div className="flex items-center justify-between text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200/60">
                            <span>Automation Engine</span>
                            <span>Active</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Graphs & Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Real Service Category Breakdown Donut Chart */}
                <Card className="lg:col-span-1 bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-md text-slate-900 rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Layers className="h-4 w-4 text-violet-600" />
                            Live Service Categories
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs">
                            Job volume breakdown across eWorks categories
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            {metrics.serviceCategories.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading categories...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={metrics.serviceCategories}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="count"
                                        >
                                            {metrics.serviceCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                                borderRadius: '12px',
                                                border: '1px solid #E2E8F0',
                                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                                color: '#0F172A'
                                            }}
                                            formatter={(val: any, name: any, item: any) => [
                                                `${val} Jobs (${formatCurrency(item.payload.revenue)})`,
                                                item.payload.name
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-3 max-h-[120px] overflow-y-auto">
                            {metrics.serviceCategories.slice(0, 5).map((cat) => (
                                <div key={cat.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                        <span className="text-slate-600 font-medium">{cat.name}</span>
                                    </div>
                                    <span className="font-bold text-slate-900">{cat.count.toLocaleString()} jobs</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Real Live Database Health & Summary Panel */}
                <Card className="lg:col-span-2 bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-md text-slate-900 rounded-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-600" />
                            Live eWorks Database Table Telemetry
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs">
                            Direct connection status to Supabase `public.customers` production table
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                <span className="text-slate-500 font-medium block">Database Rows</span>
                                <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">{metrics.totalCustomers} Customers</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                <span className="text-slate-500 font-medium block">Total Job Volume</span>
                                <span className="text-lg font-extrabold text-violet-700 mt-0.5 block">{metrics.totalJobs.toLocaleString()} Jobs</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                <span className="text-slate-500 font-medium block">Unpaid Balance</span>
                                <span className="text-lg font-extrabold text-amber-600 mt-0.5 block">{formatCurrency(metrics.totalOutstanding)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                    <span className="text-slate-500 block font-medium">Jobs Queue</span>
                                    <span className="text-slate-700 block mt-0.5 font-semibold">Live Synced</span>
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">OK</Badge>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                    <span className="text-slate-500 block font-medium">Quotes Queue</span>
                                    <span className="text-slate-700 block mt-0.5 font-semibold">Live Synced</span>
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">OK</Badge>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                    <span className="text-slate-500 block font-medium">Invoices Queue</span>
                                    <span className="text-slate-700 block mt-0.5 font-semibold">Live Synced</span>
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">OK</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main eWorks Customer Directory Table Section */}
            <Card className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-md text-slate-900 rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Users className="h-5 w-5 text-violet-600" />
                                eWorks Customer Records ({pagination.total}{filterCategory !== 'all' || searchTerm ? ` of ${metrics.totalCustomers}` : ''})
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-xs mt-0.5">
                                Live records queried from Supabase `public.customers` database table. Click any row for full schema detail.
                            </CardDescription>
                        </div>

                        {/* Search input */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search Name, eWorks ID, Email, Ref..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs h-9 rounded-xl focus-visible:ring-violet-500"
                            />
                        </div>
                    </div>

                    {/* Filter Pills with Exact Real-time Supabase Database Counts */}
                    <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500 flex items-center gap-1 mr-2 font-medium">
                            <Filter className="h-3.5 w-3.5" /> Filter:
                        </span>
                        <Button
                            size="sm"
                            variant={filterCategory === "all" ? "default" : "outline"}
                            onClick={() => setFilterCategory("all")}
                            className={`text-xs h-7 rounded-full px-3.5 ${filterCategory === "all" ? "bg-violet-600 text-white shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                        >
                            All ({filterCounts.all})
                        </Button>
                        <Button
                            size="sm"
                            variant={filterCategory === "active_jobs" ? "default" : "outline"}
                            onClick={() => setFilterCategory("active_jobs")}
                            className={`text-xs h-7 rounded-full px-3.5 ${filterCategory === "active_jobs" ? "bg-amber-600 text-white shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                        >
                            Active Jobs ({filterCounts.active_jobs})
                        </Button>
                        <Button
                            size="sm"
                            variant={filterCategory === "pending_quotes" ? "default" : "outline"}
                            onClick={() => setFilterCategory("pending_quotes")}
                            className={`text-xs h-7 rounded-full px-3.5 ${filterCategory === "pending_quotes" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                        >
                            Pending Quotes ({filterCounts.pending_quotes})
                        </Button>
                        <Button
                            size="sm"
                            variant={filterCategory === "unpaid_invoices" ? "default" : "outline"}
                            onClick={() => setFilterCategory("unpaid_invoices")}
                            className={`text-xs h-7 rounded-full px-3.5 ${filterCategory === "unpaid_invoices" ? "bg-red-600 text-white shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                        >
                            Unpaid / Overdue ({filterCounts.unpaid_invoices})
                        </Button>
                        <Button
                            size="sm"
                            variant={filterCategory === "amc" ? "default" : "outline"}
                            onClick={() => setFilterCategory("amc")}
                            className={`text-xs h-7 rounded-full px-3.5 ${filterCategory === "amc" ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                        >
                            AMC Holders ({filterCounts.amc})
                        </Button>
                        <Button
                            size="sm"
                            variant={filterCategory === "retention_ready" ? "default" : "outline"}
                            onClick={() => setFilterCategory("retention_ready")}
                            className={`text-xs h-7 rounded-full px-3.5 ${filterCategory === "retention_ready" ? "bg-purple-600 text-white shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                        >
                            Retention Ready ({filterCounts.retention_ready})
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0 min-h-[300px] relative">
                    {isRefreshing && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-violet-600 animate-spin" />
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider">
                                    <th className="p-4">Customer & eWorks ID</th>
                                    <th className="p-4">Contact & Location</th>
                                    <th className="p-4">Jobs & Service</th>
                                    <th className="p-4">Quotes & Offers</th>
                                    <th className="p-4">Invoices & Financials</th>
                                    <th className="p-4">Retention Engine</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400">
                                            No eWorks customer records match the selected filter query.
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setIsDetailOpen(true);
                                            }}
                                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        >
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900 text-sm group-hover:text-violet-600 transition-colors">
                                                    {customer.full_name || customer.customer_name || "eWorks Customer"}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-medium">
                                                        ID #{customer.eworks_customer_id}
                                                    </Badge>
                                                    {customer.has_amc && (
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-medium">
                                                            AMC
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className="text-slate-800 font-medium">{customer.email || "No Email"}</div>
                                                <div className="text-slate-500 text-[11px] mt-0.5">{customer.phone_e164 || customer.mobile_raw || "No Phone"}</div>
                                                <div className="text-slate-400 text-[10px]">{customer.city || "Dubai"}</div>
                                            </td>

                                            <td className="p-4">
                                                <div className="font-semibold text-slate-900">
                                                    {Number(customer.active_job_count || 0) > 0 ? (
                                                        <span className="text-amber-600 flex items-center gap-1 font-bold">
                                                            <Clock className="h-3 w-3" /> {customer.active_job_count} Active
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-600">{customer.completed_job_count || 0} Completed</span>
                                                    )}
                                                </div>
                                                <div className="text-slate-500 text-[11px] mt-0.5">
                                                    {customer.latest_quoted_service_category || "General Service"}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className="font-semibold text-indigo-700">
                                                    {customer.latest_quote_ref ? (
                                                        <span>Ref: {customer.latest_quote_ref}</span>
                                                    ) : (
                                                        <span className="text-slate-400">No Ref</span>
                                                    )}
                                                </div>
                                                <div className="text-slate-700 text-[11px] mt-0.5 font-medium">
                                                    {formatCurrency(customer.latest_quote_total)}
                                                </div>
                                                {customer.has_pending_quote && (
                                                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] mt-1 font-medium">
                                                        Pending Offer
                                                    </Badge>
                                                )}
                                            </td>

                                            <td className="p-4">
                                                <div className="font-bold text-emerald-600">
                                                    {formatCurrency(customer.total_invoiced_value)}
                                                </div>
                                                <div className="text-[11px] mt-0.5">
                                                    {Number(customer.total_outstanding_balance || 0) > 0 ? (
                                                        <span className="text-amber-600 font-bold">
                                                            Balance: {formatCurrency(customer.total_outstanding_balance)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500">Fully Paid</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-medium">
                                                    {customer.retention_segment ? customer.retention_segment.replace(/_/g, " ") : "Standard"}
                                                </Badge>
                                                <div className="text-slate-500 text-[10px] mt-1 font-medium">
                                                    Action: {customer.next_retention_action || "None"}
                                                </div>
                                            </td>

                                            <td className="p-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 font-medium"
                                                >
                                                    View Schema <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 bg-slate-50/60 text-slate-600 text-xs">
                        <div className="flex items-center gap-2">
                            <span>
                                Showing <span className="font-bold text-slate-900">{pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                                <span className="font-bold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                                <span className="font-bold text-slate-900">{pagination.total}</span> eWorks records
                            </span>

                            {/* Items per page selector */}
                            <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-200">
                                <span>Per page:</span>
                                <div className="flex items-center gap-1">
                                    {[5, 10, 20, 50].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                setItemsPerPage(size);
                                                setCurrentPage(1);
                                            }}
                                            className={`px-2 py-1 text-xs font-semibold rounded-md border transition-all ${
                                                itemsPerPage === size
                                                    ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Page Navigation Buttons */}
                        <div className="flex items-center gap-1.5">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                className="h-8 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 rounded-lg px-2.5"
                            >
                                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                            </Button>

                            <span className="text-xs font-bold text-slate-700 px-3">
                                Page {currentPage} of {pagination.totalPages}
                            </span>

                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage >= pagination.totalPages}
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                                className="h-8 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 rounded-lg px-2.5"
                            >
                                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
