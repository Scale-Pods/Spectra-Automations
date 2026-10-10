"use client";

import React, { useState, useEffect, use } from "react";
import {
    RefreshCw, MessageSquare, User, Bot, Link as LinkIcon,
    Check, Activity, Database, Zap, ThermometerSun
} from "lucide-react";

// ─── Parse WhatsApp activity content into messages ────────────────────────────
function parseActivityContent(content: string, summary?: string): any[] {
    if (!content) return [];
    
    let normalized = content.replace(/(User|AI|Agent|Bot|Template)\s*(?:\[([^\]]+)\])?\s*:/gi, '\n$&');

    const messages: any[] = [];
    const lines = normalized.split('\n');
    let currentMsg: any = null;
    let seq = 0;
    let lastKey = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (/^W\.P_\d+$/i.test(line) || /^Stage\s*\d+/i.test(line)) continue;

        const match = line.match(/^(User|AI|Agent|Bot|Template)\s*(?:\[([^\]]+)\])?\s*:(.*)$/i);
        if (match) {
            const speaker = match[1].toUpperCase();
            const rawTs = match[2] ? match[2].trim() : null;
            const textPart = match[3] ? match[3].trim() : '';

            const isUser = speaker === 'USER';
            let dateIso: string | null = null;
            if (rawTs) {
                const parsedDate = new Date(rawTs.includes('T') ? rawTs : rawTs.replace(' ', 'T'));
                if (parsedDate && !isNaN(parsedDate.getTime())) {
                    dateIso = parsedDate.toISOString();
                }
            }

            const cleanText = textPart.replace(/\\$/, '').trim();
            const key = `${speaker}:${cleanText}`;
            if (key === lastKey && cleanText !== '') continue;
            lastKey = key;

            currentMsg = {
                type: isUser ? ('user' as const) : ('bot' as const),
                content: cleanText,
                label: isUser ? 'User' : (speaker === 'TEMPLATE' ? 'Template' : 'Spectra AI'),
                date: dateIso,
                sequence: ++seq,
            };
            messages.push(currentMsg);
            continue;
        }

        const tsMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM))/i);
        if (tsMatch) {
            const dateStr = `${tsMatch[1]} ${tsMatch[2]}`;
            const [m, d, y] = dateStr.split(/[\/\s,]+/);
            const timeStr = dateStr.match(/\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)/i)?.[0] || '';
            const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timeStr}`);
            if (!isNaN(parsed.getTime()) && messages.length > 0) {
                messages[messages.length - 1].date = parsed.toISOString();
            }
            continue;
        }

        if (messages.length > 0) {
            const prev = messages[messages.length - 1];
            prev.content = (prev.content ? prev.content + '\n' : '') + line;
        } else {
            currentMsg = {
                type: 'bot' as const,
                content: line.replace(/\\$/, '').trim(),
                label: 'Spectra AI',
                date: null as string | null,
                sequence: ++seq,
            };
            messages.push(currentMsg);
        }
    }

    messages.forEach(msg => {
        if (msg.content) {
            msg.content = msg.content.replace(/\\$/, '').trim();
        }
    });

    return messages;
}

// ─── Status badge color helper ────────────────────────────────────────────────
function getStatusStyle(status: string) {
    const s = (status || '').toLowerCase();
    if (s === 'failed' || s === 'error' || s === 'undelivered') return 'bg-red-500/10 text-red-400 border border-red-500/20';
    if (s === 'delivered' || s === 'completed') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (s === 'replied' || s === 'reply') return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    if (s === 'sent') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    return 'bg-white/5 text-slate-400 border border-white/10';
}

function getTempStyle(temp: string) {
    const t = (temp || '').toLowerCase();
    if (t.includes('hot')) return 'bg-red-500/10 text-red-400 border border-red-500/20';
    if (t.includes('warm')) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    if (t.includes('cold')) return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    return 'bg-white/5 text-slate-400 border border-white/10';
}

export default function PublicWhatsAppSharePage({ params }: { params: Promise<{ leadId: string }> }) {
    const { leadId } = use(params);
    const decodedLeadId = decodeURIComponent(leadId || '');

    const [lead, setLead] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!decodedLeadId) return;

        async function loadData() {
            setLoading(true);
            setError(null);

            const isEmail = decodedLeadId.includes('@');
            const query = isEmail
                ? `channel=whatsapp&email=${encodeURIComponent(decodedLeadId)}`
                : `channel=whatsapp&id=${encodeURIComponent(decodedLeadId)}`;

            try {
                const res = await fetch(`/api/public/share?${query}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                });

                if (!res.ok) {
                    setError('Failed to load conversation data.');
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                setLead(data.lead || { name: decodedLeadId, phone: decodedLeadId });

                const allMessages: any[] = [];
                for (const act of (data.activities || [])) {
                    if (act.direction === 'INBOUND' || act.direction === 'OUTBOUND') {
                        const isUser = act.direction === 'INBOUND' || (act.status && String(act.status).toLowerCase().includes('reply'));
                        allMessages.push({
                            type: isUser ? 'user' : 'bot',
                            content: act.content || act.note || act.summary || '',
                            label: isUser ? 'USER' : (act.channel ? `META_${String(act.channel).toUpperCase()}` : 'META_WHATSAPP'),
                            date: act.created_at || null,
                            sequence: allMessages.length + 1,
                            tsStatus: act.status || 'SENT'
                        });
                    } else if (act.content) {
                        const parsed = parseActivityContent(act.content, act.summary);
                        parsed.forEach(m => {
                            if (!m.date && act.created_at) m.date = act.created_at;
                            if ((act as any).status) (m as any).tsStatus = (act as any).status;
                        });
                        allMessages.push(...parsed);
                    }
                }
                setMessages(allMessages);
            } catch (e) {
                setError('Network error loading conversation.');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [decodedLeadId]);

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const incoming = messages.filter(m => m.type === 'user').length;
    const outgoing = messages.filter(m => m.type === 'bot').length;

    return (
        <div className="h-screen max-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-3 md:p-6 relative overflow-hidden">
            <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-400/10 blur-[120px] pointer-events-none z-0" />
            <div className="fixed -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-400/10 blur-[120px] pointer-events-none z-0" />

            <div className="w-full max-w-6xl h-[85vh] max-h-[800px] bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-xl p-4 sm:p-5 flex flex-col relative z-10 overflow-hidden">

                {/* ── Top Bar ── */}
                <div className="mb-3 flex items-center justify-between shrink-0 flex-wrap gap-2">
                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
                        📱 WhatsApp Conversation • {lead?.name ? `${lead.name} (${lead.phone || decodedLeadId})` : decodedLeadId}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopyLink}
                            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase rounded-lg px-3 py-1.5 transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                        >
                            {copied ? <Check className="h-3 w-3" /> : <LinkIcon className="h-3 w-3" />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>

                {/* ── Main Grid: Chat + Sidebar ── */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden min-h-0">

                    {/* ── Chat Timeline (2/3 width) ── */}
                    <div className="lg:col-span-2 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 h-full min-h-0">
                        <div className="border-b border-slate-200 p-3 px-4 flex justify-between items-center shrink-0 bg-white">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversation Timeline</h3>
                            <div className="text-[10px] text-slate-500 font-bold">{messages.length} Messages</div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/30">
                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
                                    <p className="text-sm font-medium">Loading conversation…</p>
                                </div>
                            ) : error ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <MessageSquare className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <MessageSquare className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">No WhatsApp messages found for this contact.</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    let tsPill: React.ReactNode = null;
                                    if (msg.type === 'bot' && (msg as any).tsStatus) {
                                        const rawStatus = String((msg as any).tsStatus).toUpperCase();
                                        let cls = 'bg-emerald-500/30 text-emerald-100';
                                        if (rawStatus.includes('READ')) cls = 'bg-blue-400/40 text-blue-100';
                                        if (rawStatus.includes('FAILED')) cls = 'bg-red-400/40 text-red-100';
                                        if (rawStatus.includes('DELIVERED')) cls = 'bg-emerald-400/40 text-emerald-100';
                                        if (rawStatus.includes('SENT')) cls = 'bg-white/20 text-emerald-50';
                                        tsPill = (
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${cls}`}>
                                                {rawStatus}
                                            </span>
                                        );
                                    }

                                    return (
                                        <div key={idx} className={`flex flex-col ${msg.type === 'user' ? 'items-start' : 'items-end'}`}>
                                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] ${
                                                msg.type === 'user'
                                                    ? 'bg-[#f8fafc] text-slate-900 border border-slate-200/80 rounded-tl-none'
                                                    : 'bg-emerald-600 text-white rounded-tr-none'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2 gap-3">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                                                        msg.type === 'user' ? 'text-slate-500' : 'text-emerald-100'
                                                    }`}>
                                                        {msg.type === 'user' ? (
                                                            <>
                                                                <User className="h-3 w-3" />
                                                                <span>{msg.label || 'USER'}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Bot className="h-3 w-3" />
                                                                <span>{msg.label || 'META_WHATSAPP'}</span>
                                                            </>
                                                        )}
                                                    </span>
                                                    {tsPill}
                                                </div>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                                    {msg.content}
                                                </p>
                                            </div>
                                            {msg.date && (
                                                <span className="text-[10px] text-slate-500 mt-1 px-1">
                                                    {new Date(msg.date).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ── Right Sidebar (1/3 width) ── */}
                    <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pb-2">

                        {/* Lead Information Card */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-slate-400" /> Lead Information
                            </h3>

                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />
                                    ))}
                                </div>
                            ) : lead ? (
                                <div className="space-y-4 text-sm">

                                    {/* Lead Name & ID */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Profile</p>
                                        <p className="font-bold text-base text-slate-900">{lead.name || 'WhatsApp Contact'}</p>
                                        {lead.eworks_customer_id && (
                                            <span className="inline-block text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded mt-1 font-semibold">
                                                ID: #{lead.eworks_customer_id}
                                            </span>
                                        )}
                                    </div>

                                    {/* Contact Info */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Details</p>
                                        <p className="font-medium text-slate-800 font-mono text-xs">{lead.phone || decodedLeadId}</p>
                                        {lead.email && <p className="text-xs text-slate-600 mt-0.5">{lead.email}</p>}
                                        {lead.address && <p className="text-xs text-slate-500 mt-1">{lead.address}</p>}
                                    </div>

                                    {/* Service & eWorks Data */}
                                    {(lead.category || lead.total_job_count > 0 || lead.total_invoiced_value > 0) && (
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Service Category</p>
                                                <p className="text-xs font-bold text-slate-800 mt-0.5">{lead.category || 'General'}</p>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Completed Jobs</p>
                                                <p className="text-xs font-bold text-slate-800 mt-0.5">{lead.total_job_count || 0}</p>
                                            </div>
                                            {lead.total_invoiced_value > 0 && (
                                                <div className="col-span-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total Invoiced</p>
                                                    <p className="text-xs font-bold text-emerald-700 mt-0.5">AED {Number(lead.total_invoiced_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Status */}
                                    {lead.status && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                    )}

                                    {/* Source Table */}
                                    {lead.source_table && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source Table</p>
                                            <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                                <Database className="h-3 w-3" />
                                                {lead.source_table}
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Type */}
                                    {lead.action_type && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action Type</p>
                                            <p className="text-xs font-bold text-purple-600 flex items-center gap-1">
                                                <Zap className="h-3 w-3" />
                                                {lead.action_type}
                                            </p>
                                        </div>
                                    )}

                                    {/* Lead Temperature */}
                                    {lead.lead_temp && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lead Temperature</p>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getTempStyle(lead.lead_temp)}`}>
                                                <ThermometerSun className="h-3 w-3" />
                                                {lead.lead_temp}
                                            </span>
                                        </div>
                                    )}

                                    {/* Summary */}
                                    {lead.summary && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Summary</p>
                                            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">{lead.summary}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">No lead data found.</p>
                            )}
                        </div>

                        {/* Activity Stats Card */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <Activity className="h-4 w-4 text-slate-400" /> Activity Stats
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'Total Messages', value: messages.length, icon: MessageSquare, color: 'text-slate-900' },
                                    { label: 'Incoming', value: incoming, icon: User, color: 'text-emerald-600' },
                                    { label: 'Outgoing', value: outgoing, icon: Bot, color: 'text-blue-600' },
                                ].map(({ label, value, icon: Icon, color }) => (
                                    <div key={label} className="flex items-center justify-between p-2.5 px-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Icon className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${color}`}>{loading ? '—' : value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
