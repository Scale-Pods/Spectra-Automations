"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, CheckCheck, Clock, XCircle, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import React, { useState, useEffect } from "react";
import { subDays } from "date-fns";
import { consolidateLeads } from "@/lib/leads-utils";
import { LMLoader } from "@/components/spectra-loader";
import { useData } from "@/context/DataContext";
import { FollowUpBossButton } from "@/components/ui/followup-boss-button";

export default function WhatsappSentPage() {
    const { leads: allLeads, loadingLeads } = useData();
    const [dateRange, setDateRange] = useState<any>({ from: subDays(new Date(), 7), to: new Date() });
    const [messages, setMessages] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [stats, setStats] = useState({
        total: 0,
        delivered: 0,
        read: 0,
        failed: 0
    });
    const [apiLoading, setApiLoading] = useState(false);
    const loading = loadingLeads || apiLoading;

    useEffect(() => {
        const fetchData = async () => {
            setApiLoading(true);
            try {
                const res = await fetch('/api/activity?channel=WHATSAPP&limit=500');
                let actMessages: any[] = [];
                if (res.ok) {
                    const data = await res.json();
                    actMessages = data.messages || [];
                }

                const waMessages: any[] = [];
                let deliveredCount = 0;
                let readCount = 0;
                let failedCount = 0;

                // Apply Date Filtering
                const filtered = actMessages.filter((msg: any) => {
                    if (!dateRange?.from) return true;
                    const dateStr = msg.sent_or_received_at || msg.created_at;
                    if (!dateStr) return false;

                    const msgDate = new Date(dateStr);
                    const from = new Date(dateRange.from);
                    from.setHours(0, 0, 0, 0);
                    const to = dateRange.to ? new Date(dateRange.to) : from;
                    to.setHours(23, 59, 59, 999);

                    return msgDate >= from && msgDate <= to;
                });

                filtered.forEach((m: any) => {
                    const isOutbound = m.direction === 'OUTBOUND';
                    const recipient = isOutbound ? m.recipient_address : m.sender_address;
                    const st = (m.status || '').toLowerCase();

                    if (st.includes('read')) readCount++;
                    if (st.includes('delivered') || st.includes('sent')) deliveredCount++;
                    if (st.includes('failed') || st.includes('error')) failedCount++;

                    waMessages.push({
                        id: m.id,
                        recipient: recipient || "WhatsApp Contact",
                        message: m.body_text || m.subject || "WhatsApp Message",
                        status: m.status || (m.direction === 'INBOUND' ? "Read" : "Delivered"),
                        time: m.sent_or_received_at ? new Date(m.sent_or_received_at).toLocaleString() : "Recent",
                        rawDate: m.sent_or_received_at || m.created_at,
                        direction: m.direction
                    });
                });

                setMessages(waMessages);
                setStats({
                    total: waMessages.length,
                    delivered: deliveredCount,
                    read: readCount,
                    failed: failedCount
                });
            } catch (e) {
                console.error("WhatsApp sent processing error", e);
            } finally {
                setApiLoading(false);
            }
        };
        fetchData();
    }, [dateRange]);

    const filteredMessages = messages.filter(msg =>
        msg.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <LMLoader />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Total Sent Messages</h1>
                    <p className="text-[var(--label-secondary)]">History of all outbound WhatsApp communications</p>
                </div>
                <DateRangePicker onUpdate={(val) => setDateRange(val.range)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Sent" value={loading ? "..." : stats.total.toLocaleString()} icon={<Send className="h-4 w-4" />} color="text-blue-600" bg="bg-[rgba(0,122,255,0.08)]" />
                <StatCard title="Delivered" value={loading ? "..." : stats.delivered.toLocaleString()} icon={<CheckCheck className="h-4 w-4" />} color="text-emerald-600" bg="bg-[rgba(52,199,89,0.08)]" />
                <StatCard title="Read" value={loading ? "..." : stats.read.toLocaleString()} icon={<CheckCheck className="h-4 w-4 text-blue-500" />} color="text-amber-600" bg="bg-amber-50" />
                <StatCard title="Failed" value={loading ? "..." : stats.failed.toLocaleString()} icon={<XCircle className="h-4 w-4" />} color="text-rose-600" bg="bg-rose-50" />
            </div>

            <Card className="border-[var(--separator)]">
                <CardHeader className="border-b border-[var(--separator)] flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-lg">Message History</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                        <Input
                            className="pl-10 h-9"
                            placeholder="Search recipients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0 relative min-h-[300px]">
                    <div className="divide-y divide-[var(--separator)]">
                        {loading ? (
                            <LMLoader />
                        ) : filteredMessages.length > 0 ? (
                            filteredMessages.map((msg) => (
                                <div key={msg.id} className="p-4 hover:bg-[var(--bg-app)] transition-colors flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="font-bold text-[var(--label-primary)]">{msg.recipient}</p>
                                        <p className="text-sm text-[var(--label-secondary)] max-w-xl">{msg.message}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] text-[var(--label-tertiary)] uppercase font-bold">{msg.time}</span>
                                            <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${msg.status === 'Read' ? 'text-blue-500' :
                                                msg.status === 'Delivered' ? 'text-emerald-500' :
                                                    msg.status === 'Failed' ? 'text-rose-500' : 'text-[var(--label-tertiary)]'
                                                }`}>
                                                {(msg.status === 'Read' || msg.status === 'Delivered') && <CheckCheck className="h-3 w-3" />}
                                                {msg.status === 'Sent' && <Clock className="h-3 w-3" />}
                                                {msg.status === 'Failed' && <XCircle className="h-3 w-3" />}
                                                {msg.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FollowUpBossButton lead={msg} variant="button" />
                                        <Button variant="ghost" size="sm">Details</Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-[var(--label-tertiary)]">
                                No messages found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon, color, bg }: any) {
    return (
        <Card className="border-[var(--separator)]">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${bg} ${color}`}>{icon}</div>
                <div>
                    <p className="text-xs font-medium text-[var(--label-secondary)] uppercase tracking-wider">{title}</p>
                    <p className="text-xl font-bold text-[var(--label-primary)]">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

