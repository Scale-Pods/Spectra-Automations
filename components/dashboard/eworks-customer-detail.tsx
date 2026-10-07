"use client";

import React, { useState } from "react";
import { EworksCustomer } from "@/lib/eworks-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    User,
    Briefcase,
    FileText,
    Receipt,
    ShieldCheck,
    Bot,
    ExternalLink,
    Mail,
    Phone,
    MapPin,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    DollarSign,
    Wrench,
    Sparkles,
    Tag,
    Activity,
    Layers
} from "lucide-react";
import { format } from "date-fns";

interface EworksCustomerDetailProps {
    customer: EworksCustomer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EworksCustomerDetail({ customer, open, onOpenChange }: EworksCustomerDetailProps) {
    if (!customer) return null;

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "N/A";
        try {
            return format(new Date(dateStr), "MMM dd, yyyy");
        } catch (e) {
            return dateStr;
        }
    };

    const formatCurrency = (amount?: number | null) => {
        if (amount === undefined || amount === null) return "AED 0.00";
        return `AED ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 text-slate-900 border-slate-200 p-6 shadow-2xl rounded-2xl">
                <DialogHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <User className="h-6 w-6 text-violet-600" />
                                    {customer.full_name || customer.customer_name || "eWorks Customer"}
                                </DialogTitle>
                                <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 font-semibold">
                                    eWorks ID #{customer.eworks_customer_id}
                                </Badge>
                                {customer.retention_segment && (
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold">
                                        <Sparkles className="h-3 w-3 mr-1 text-indigo-600" />
                                        {customer.retention_segment.replace(/_/g, " ")}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 font-medium">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {customer.address_line || "Dubai"}, {customer.city || "Dubai"}, {customer.country || "AE"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {customer.has_email && (
                                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                    <Mail className="h-3 w-3 mr-1" /> Email
                                </Badge>
                            )}
                            {customer.has_phone && (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                    <Phone className="h-3 w-3 mr-1" /> Phone
                                </Badge>
                            )}
                            {customer.is_reachable ? (
                                <Badge className="bg-green-50 text-green-700 border border-green-200 font-medium">
                                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" /> Reachable
                                </Badge>
                            ) : (
                                <Badge className="bg-red-50 text-red-700 border border-red-200 font-medium">
                                    Unreachable
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* Key Quick Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                    <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5">
                        <span className="text-xs text-slate-500 font-medium block">Total Invoiced</span>
                        <span className="text-lg font-extrabold text-emerald-600">{formatCurrency(customer.total_invoiced_value)}</span>
                    </div>
                    <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5">
                        <span className="text-xs text-slate-500 font-medium block">Outstanding Balance</span>
                        <span className={`text-lg font-extrabold ${customer.total_outstanding_balance > 0 ? "text-amber-600" : "text-slate-700"}`}>
                            {formatCurrency(customer.total_outstanding_balance)}
                        </span>
                    </div>
                    <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5">
                        <span className="text-xs text-slate-500 font-medium block">Jobs (Active / Total)</span>
                        <span className="text-lg font-extrabold text-violet-700">
                            {customer.active_job_count} active / {customer.total_job_count} total
                        </span>
                    </div>
                    <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5">
                        <span className="text-xs text-slate-500 font-medium block">AMC Contract</span>
                        <span className="text-lg font-extrabold text-indigo-700 flex items-center gap-1">
                            {customer.has_amc ? (
                                <>
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    {customer.amc_status || "Active"}
                                </>
                            ) : (
                                "No AMC"
                            )}
                        </span>
                    </div>
                </div>

                {/* Multi-Tab Detail View */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-slate-100/90 p-1 border border-slate-200 rounded-xl grid grid-cols-3 md:grid-cols-6 mb-4">
                        <TabsTrigger value="overview" className="text-xs font-semibold data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg">
                            <User className="h-3.5 w-3.5 mr-1" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="jobs" className="text-xs font-semibold data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg">
                            <Briefcase className="h-3.5 w-3.5 mr-1" /> Jobs ({customer.total_job_count})
                        </TabsTrigger>
                        <TabsTrigger value="quotes" className="text-xs font-semibold data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg">
                            <FileText className="h-3.5 w-3.5 mr-1" /> Quotes ({customer.total_quote_count})
                        </TabsTrigger>
                        <TabsTrigger value="invoices" className="text-xs font-semibold data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg">
                            <Receipt className="h-3.5 w-3.5 mr-1" /> Invoices ({customer.total_invoice_count})
                        </TabsTrigger>
                        <TabsTrigger value="service" className="text-xs font-semibold data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg">
                            <Wrench className="h-3.5 w-3.5 mr-1" /> Service & AMC
                        </TabsTrigger>
                        <TabsTrigger value="retention" className="text-xs font-semibold data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg">
                            <Bot className="h-3.5 w-3.5 mr-1" /> Automation
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-violet-700 flex items-center gap-2">
                                        <User className="h-4 w-4" /> Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Full Name</span>
                                        <span className="font-bold text-slate-900">{customer.full_name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Primary Email</span>
                                        <span className="font-semibold text-violet-700">{customer.email || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Mobile (E.164)</span>
                                        <span className="font-semibold text-slate-900">{customer.phone_e164 || customer.mobile_raw || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Telephone</span>
                                        <span className="font-medium text-slate-700">{customer.telephone_raw || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Customer Type ID</span>
                                        <span className="font-medium text-slate-700">{customer.customer_type_id || "Standard"}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-violet-700 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Address & Location
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Address Line</span>
                                        <span className="font-semibold text-slate-900 text-right">{customer.address_line || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">City / Region</span>
                                        <span className="font-semibold text-slate-900">{customer.city || "Dubai"}, {customer.country || "AE"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">eWorks Created On</span>
                                        <span className="font-medium text-slate-700">{formatDate(customer.eworks_created_on)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Last Synced</span>
                                        <span className="font-medium text-slate-700">{formatDate(customer.last_synced_at)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {customer.notes && (
                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-violet-700">Customer Notes</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-slate-700">
                                    {customer.notes}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Jobs Tab */}
                    <TabsContent value="jobs" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                                <span className="text-xs text-slate-500 font-medium">Total Jobs</span>
                                <p className="text-xl font-extrabold text-slate-900">{customer.total_job_count}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                                <span className="text-xs text-slate-500 font-medium">Active Jobs</span>
                                <p className="text-xl font-extrabold text-amber-600">{customer.active_job_count}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                                <span className="text-xs text-slate-500 font-medium">Completed Jobs</span>
                                <p className="text-xl font-extrabold text-emerald-600">{customer.completed_job_count}</p>
                            </div>
                        </div>

                        {/* Active Jobs Section */}
                        {customer.active_jobs && customer.active_jobs.length > 0 && (
                            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-amber-700 flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Active Jobs In Progress
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {customer.active_jobs.map((job) => (
                                        <div key={job.id} className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{job.title}</h4>
                                                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                                                    Type: {job.type} • Scheduled: {job.scheduled_date}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">
                                                    {job.status}
                                                </Badge>
                                                <p className="text-sm font-extrabold text-slate-900 mt-1">{formatCurrency(job.amount)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Latest Job Detailed View */}
                        {customer.latest_job_id && (
                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-violet-700 flex items-center justify-between">
                                        <span>Latest Job Details (Job #{customer.latest_job_id})</span>
                                        <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 font-semibold">
                                            {customer.latest_job_status_text || "Scheduled"}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                                        <h5 className="font-bold text-slate-900">{customer.latest_job_short_description}</h5>
                                        <p className="text-xs text-slate-600 mt-1">{customer.latest_job_description}</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-700">
                                        <div>
                                            <span className="text-slate-500 block font-medium">Job Total</span>
                                            <span className="font-bold text-slate-900 text-sm">{formatCurrency(customer.latest_job_total)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-medium">Start Date</span>
                                            <span className="font-semibold">{formatDate(customer.latest_job_start_date)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-medium">Linked Quote</span>
                                            <span className="font-semibold">{customer.latest_job_quote_id ? `#${customer.latest_job_quote_id}` : "None"}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-medium">Linked Invoice</span>
                                            <span className="font-semibold">{customer.latest_job_invoice_id ? `#${customer.latest_job_invoice_id}` : "None"}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Quotes Tab */}
                    <TabsContent value="quotes" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-violet-700 flex items-center justify-between">
                                        <span>Latest Quote ({customer.latest_quote_ref || "N/A"})</span>
                                        {customer.latest_quote_link && (
                                            <a
                                                href={customer.latest_quote_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center text-xs text-violet-600 hover:text-violet-800 underline font-semibold"
                                            >
                                                View Quote <ExternalLink className="h-3 w-3 ml-1" />
                                            </a>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Quote Reference</span>
                                        <span className="font-bold text-slate-900">{customer.latest_quote_ref || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Total Amount</span>
                                        <span className="font-extrabold text-emerald-600">{formatCurrency(customer.latest_quote_total)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Status</span>
                                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                                            {customer.latest_quote_status_text || "Active"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Quoted Category</span>
                                        <span className="text-slate-800 font-medium">{customer.latest_quoted_service_category || "General Service"}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                                        <span>Date: {formatDate(customer.latest_quote_date)}</span>
                                        <span>Expires: {formatDate(customer.latest_quote_expiry_date)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-indigo-700">Pending & AMC Quotes</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {customer.has_pending_quote ? (
                                        <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-indigo-900">Pending Quote Available</span>
                                                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 font-bold">
                                                    {formatCurrency(customer.latest_pending_quote_total)}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-600 font-medium">
                                                Expiry Date: {formatDate(customer.latest_pending_quote_expiry_date)}
                                            </p>
                                            {customer.latest_pending_quote_link && (
                                                <a
                                                    href={customer.latest_pending_quote_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center text-xs text-indigo-600 hover:underline font-semibold"
                                                >
                                                    Open Remote Quote Link <ExternalLink className="h-3 w-3 ml-1" />
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 font-medium">No active pending quotes.</p>
                                    )}

                                    <div className="pt-2 border-t border-slate-100">
                                        <span className="text-slate-500 text-xs block font-medium">AMC Quote History:</span>
                                        <p className="text-sm text-slate-800 font-semibold mt-1">
                                            {customer.has_amc_quote ? `AMC Quote #${customer.latest_amc_quote_id} (${formatDate(customer.latest_amc_quote_date)})` : "No AMC quotes generated"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Invoices & Financials Tab */}
                    <TabsContent value="invoices" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                                <span className="text-xs text-slate-500 font-medium block">Total Invoiced</span>
                                <span className="text-xl font-extrabold text-slate-900">{formatCurrency(customer.total_invoiced_value)}</span>
                                <span className="text-xs text-slate-500 block mt-1 font-medium">{customer.total_invoice_count} Invoices</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                                <span className="text-xs text-slate-500 font-medium block">Total Received</span>
                                <span className="text-xl font-extrabold text-emerald-600">{formatCurrency(customer.total_received_value)}</span>
                                <span className="text-xs text-slate-500 block mt-1 font-medium">{customer.paid_invoice_count} Paid</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                                <span className="text-xs text-slate-500 font-medium block">Outstanding Balance</span>
                                <span className={`text-xl font-extrabold ${customer.total_outstanding_balance > 0 ? "text-amber-600" : "text-slate-700"}`}>
                                    {formatCurrency(customer.total_outstanding_balance)}
                                </span>
                                <span className="text-xs text-slate-500 block mt-1 font-medium">{customer.unpaid_invoice_count} Unpaid / {customer.overdue_invoice_count} Overdue</span>
                            </div>
                        </div>

                        {customer.has_overdue_invoice && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between text-red-900">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-red-950">Overdue Invoice Alert</h4>
                                        <p className="text-xs text-red-700 font-medium">
                                            Overdue Invoice #{customer.latest_overdue_invoice_id} with balance of {formatCurrency(customer.latest_overdue_invoice_balance_amount)}. Due date: {formatDate(customer.latest_overdue_invoice_due_date)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {customer.latest_invoice_id && (
                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-violet-700">Latest Invoice Summary ({customer.latest_invoice_ref})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                            <span className="text-xs text-slate-500 block font-medium">Invoice Total</span>
                                            <span className="font-extrabold text-slate-900">{formatCurrency(customer.latest_invoice_total)}</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                            <span className="text-xs text-slate-500 block font-medium">Amount Received</span>
                                            <span className="font-extrabold text-emerald-600">{formatCurrency(customer.latest_invoice_received_amount)}</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                            <span className="text-xs text-slate-500 block font-medium">Balance Due</span>
                                            <span className="font-extrabold text-amber-600">{formatCurrency(customer.latest_invoice_balance_amount)}</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                            <span className="text-xs text-slate-500 block font-medium">Status</span>
                                            <Badge className="mt-1 bg-amber-50 text-amber-800 border-amber-200 font-semibold">
                                                {customer.latest_invoice_status_text || "Pending"}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Service History & AMC Tab */}
                    <TabsContent value="service" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4" /> Annual Maintenance Contract (AMC)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">AMC Active Status</span>
                                        <Badge className={customer.has_amc ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold" : "bg-slate-100 text-slate-600"}>
                                            {customer.amc_status || (customer.has_amc ? "ACTIVE" : "NO AMC")}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Contract Start Date</span>
                                        <span className="text-slate-800 font-semibold">{formatDate(customer.amc_start_date)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Contract Expiry Date</span>
                                        <span className="text-slate-800 font-semibold">{formatDate(customer.amc_expiry_date)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                                        <span>Source Job #{customer.amc_source_job_id || "N/A"}</span>
                                        <span>Source Quote #{customer.amc_source_quote_id || "N/A"}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-violet-700 flex items-center gap-2">
                                        <Wrench className="h-4 w-4" /> AC Service & Maintenance History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">AC Service Count</span>
                                        <span className="font-bold text-slate-900">{customer.ac_service_count} Services Logged</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Last AC Service Date</span>
                                        <span className="text-slate-800 font-semibold">{formatDate(customer.last_ac_service_date)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Last Service Date (All Types)</span>
                                        <span className="text-slate-800 font-semibold">{formatDate(customer.last_service_date)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detailed Service Log */}
                        {customer.service_history && customer.service_history.length > 0 && (
                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-violet-700">Historical Service Log</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {customer.service_history.map((srv) => (
                                        <div key={srv.id} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex justify-between items-center text-sm">
                                            <div>
                                                <h5 className="font-bold text-slate-900">{srv.service_name}</h5>
                                                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                                    Technician: {srv.technician || "Assigned Team"} • Date: {formatDate(srv.date)}
                                                </p>
                                            </div>
                                            {srv.cost !== undefined && (
                                                <span className="font-extrabold text-emerald-600">{formatCurrency(srv.cost)}</span>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Automation & Retention Decisions Tab */}
                    <TabsContent value="retention" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                                        <Bot className="h-4 w-4" /> Retention Engine Decision Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Decision Status</span>
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                                            {customer.decision_status || "NO_ACTION"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Action Class</span>
                                        <Badge className="bg-violet-50 text-violet-700 border-violet-200 font-semibold">
                                            {customer.decision_action_class || "NONE"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Retention Segment</span>
                                        <span className="font-bold text-indigo-700">{customer.retention_segment || "Standard"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Next Action</span>
                                        <span className="font-semibold text-amber-700">{customer.next_retention_action || "None"}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                                        <span>Calculated: {formatDate(customer.decision_calculated_at)}</span>
                                        <span>Scheduled: {formatDate(customer.next_retention_action_at)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                        <Layers className="h-4 w-4" /> Sequence & Channel Execution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Sequence Campaign</span>
                                        <span className="font-mono text-xs font-bold text-slate-900">{customer.sequence_id || "SEQ_STANDARD"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Current Step</span>
                                        <span className="font-bold text-slate-900">Step {customer.sequence_step || 1}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Active Channel</span>
                                        <Badge className="bg-purple-50 text-purple-700 border-purple-200 font-semibold capitalize">
                                            {customer.sequence_channel || "email"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Step Status</span>
                                        <span className="font-semibold text-slate-700">{customer.sequence_step_status || "NOT_STARTED"}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* WhatsApp & Email Campaign Touchpoints */}
                        {(customer.whatsapp_1 || customer.email_1 || customer.WA_text || customer.WA_replied) && (
                            <Card className="bg-white border-slate-200 text-slate-900 shadow-sm rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-violet-700 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" /> Multi-Step Campaign Touchpoints
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                        {/* WhatsApp Steps */}
                                        <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl space-y-2">
                                            <h5 className="font-bold text-emerald-900 flex items-center gap-1.5">
                                                <Badge className="bg-emerald-600 text-white text-[10px]">WhatsApp Sequence</Badge>
                                            </h5>
                                            {customer.whatsapp_1 && (
                                                <div className="border-b border-emerald-100 pb-1.5">
                                                    <span className="font-semibold text-emerald-800">Step 1: </span>
                                                    <span className="text-slate-700">{customer.whatsapp_1}</span>
                                                </div>
                                            )}
                                            {customer.whatsapp_2 && (
                                                <div className="border-b border-emerald-100 pb-1.5">
                                                    <span className="font-semibold text-emerald-800">Step 2: </span>
                                                    <span className="text-slate-700">{customer.whatsapp_2}</span>
                                                </div>
                                            )}
                                            {customer.whatsapp_3 && (
                                                <div className="border-b border-emerald-100 pb-1.5">
                                                    <span className="font-semibold text-emerald-800">Step 3: </span>
                                                    <span className="text-slate-700">{customer.whatsapp_3}</span>
                                                </div>
                                            )}
                                            {customer.whatsapp_4 && (
                                                <div>
                                                    <span className="font-semibold text-emerald-800">Step 4: </span>
                                                    <span className="text-slate-700">{customer.whatsapp_4}</span>
                                                </div>
                                            )}
                                            {customer.WA_replied && (
                                                <div className="mt-2 pt-1.5 border-t border-emerald-200 flex justify-between font-medium">
                                                    <span>Reply Status: {customer.WA_replied}</span>
                                                    {customer.WA_sentiment && <span className="text-emerald-700">Sentiment: {customer.WA_sentiment}</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Email Steps */}
                                        <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl space-y-2">
                                            <h5 className="font-bold text-blue-900 flex items-center gap-1.5">
                                                <Badge className="bg-blue-600 text-white text-[10px]">Email Sequence</Badge>
                                            </h5>
                                            {customer.email_1 && (
                                                <div className="border-b border-blue-100 pb-1.5">
                                                    <span className="font-semibold text-blue-800">Step 1: </span>
                                                    <span className="text-slate-700">{customer.email_1}</span>
                                                </div>
                                            )}
                                            {customer.email_2 && (
                                                <div className="border-b border-blue-100 pb-1.5">
                                                    <span className="font-semibold text-blue-800">Step 2: </span>
                                                    <span className="text-slate-700">{customer.email_2}</span>
                                                </div>
                                            )}
                                            {customer.email_3 && (
                                                <div className="border-b border-blue-100 pb-1.5">
                                                    <span className="font-semibold text-blue-800">Step 3: </span>
                                                    <span className="text-slate-700">{customer.email_3}</span>
                                                </div>
                                            )}
                                            {customer.email_4 && (
                                                <div>
                                                    <span className="font-semibold text-blue-800">Step 4: </span>
                                                    <span className="text-slate-700">{customer.email_4}</span>
                                                </div>
                                            )}
                                            {customer.email_unsubscribed && (
                                                <div className="mt-2 pt-1.5 border-t border-blue-200 text-rose-600 font-bold">
                                                    Email Opted Out / Unsubscribed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
