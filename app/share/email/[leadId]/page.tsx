"use client";

import React, { useState, useEffect, use, useRef } from "react";
import {
    RefreshCw, Mail, User, Bot, Link as LinkIcon,
    Check, Activity, Database, Zap, AlertCircle, Inbox
} from "lucide-react";
import { cleanMessageContent, parseMsgDate } from "@/lib/reply-utils";
import { ChatAttachmentPreview, MessageAttachment } from "@/components/chat/chat-attachment-preview";
import { linkAttachmentsToMessages } from "@/lib/attachment-utils";

function parseEmailContent(content: string, note?: string): any[] {
    if (!content && !note) return [];
    const messages: any[] = [];
    const rawText = content || note || "";
    const lines = rawText.split('\n');
    let seq = 0;
    let lastMessageKey = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('Subject: ')) {
            messages.push({
                type: 'subject',
                content: line.substring('Subject: '.length),
                sequence: ++seq
            });
            continue;
        }

        const dtMatch = line.match(/^(?:Date\s*&\s*Time|Date|Timestamp):\s*(.*)$/i);
        if (dtMatch) {
            const rawDt = dtMatch[1].trim();
            if (messages.length > 0) {
                const parsedDate = parseMsgDate(rawDt);
                messages[messages.length - 1].date = parsedDate ? parsedDate.toISOString() : rawDt;
            }
            continue;
        }

        if (line.startsWith('Outbound Email:') || line.startsWith('Email Sent:') || line.startsWith('Template:') || line.startsWith('Agent:') || line.startsWith('Agent :')) {
            const text = cleanMessageContent(line.replace(/^(Outbound Email|Email Sent|Template|Agent\s*:)\s*/, ''), 'Agent Email');
            messages.push({
                type: 'bot',
                content: text,
                label: 'Agent Email',
                date: null,
                sequence: ++seq
            });
            lastMessageKey = 'bot';
            continue;
        }

        if (line.startsWith('Inbound Email:') || line.startsWith('Inbound Reply:') || line.startsWith('User:') || line.startsWith('Email Reply:') || line.startsWith('Reply:')) {
            const text = cleanMessageContent(line.replace(/^(Inbound Email|Inbound Reply|User|Email Reply|Reply):\s*/, ''), 'User Reply');
            const key = `user:${text}`;
            if (key === lastMessageKey) continue;
            messages.push({
                type: 'user',
                content: text,
                label: 'Contact Reply',
                date: null,
                sequence: ++seq
            });
            lastMessageKey = key;
            continue;
        }

        const parsedDate = parseMsgDate(line);
        if (parsedDate && messages.length > 0) {
            messages[messages.length - 1].date = parsedDate.toISOString();
            continue;
        }

        if (messages.length > 0) {
            messages[messages.length - 1].content += '\n' + line;
        } else {
            messages.push({
                type: 'bot',
                content: line,
                label: 'Agent Email',
                date: null,
                sequence: ++seq
            });
        }
    }

    messages.forEach(msg => {
        if (msg.content) {
            msg.content = cleanMessageContent(msg.content, msg.type === 'user' ? 'Lead Replied' : 'Email Sent');
        }
    });

    return messages;
}

export default function PublicEmailSharePage({ params }: { params: Promise<{ leadId: string }> }) {
    const { leadId } = use(params);
    const decodedLeadId = decodeURIComponent(leadId || '');

    const [lead, setLead] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!decodedLeadId) return;

        async function loadData() {
            setLoading(true);
            setError(null);

            const isEmail = decodedLeadId.includes('@');
            const query = isEmail
                ? `channel=email&email=${encodeURIComponent(decodedLeadId)}&customer_id=${encodeURIComponent(decodedLeadId)}&id=${encodeURIComponent(decodedLeadId)}`
                : `channel=email&customer_id=${encodeURIComponent(decodedLeadId)}&id=${encodeURIComponent(decodedLeadId)}`;

            try {
                const res = await fetch(`/api/public/share?${query}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' },
                });

                if (!res.ok) {
                    setError('Failed to load email thread data.');
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                const loadedLead = data.lead || { id: decodedLeadId, customer_id: decodedLeadId, name: decodedLeadId, email: decodedLeadId };
                setLead(loadedLead);
                setAttachments(data.attachments || []);

                // Fallback fetch if attachments not in response
                if (!data.attachments || data.attachments.length === 0) {
                    const custId = loadedLead.customer_id || loadedLead.id || decodedLeadId;
                    try {
                        const attRes = await fetch(`/api/messages/attachments?customer_id=${encodeURIComponent(custId)}`);
                        if (attRes.ok) {
                            const attData = await attRes.json();
                            setAttachments(attData.attachments || []);
                        }
                    } catch (e) {
                        console.error('Failed to fetch fallback attachments', e);
                    }
                }

                const allMessages: any[] = [];
                for (const act of (data.activities || [])) {
                    if (act.direction === 'INBOUND' || act.direction === 'OUTBOUND') {
                        const isUser = act.direction === 'INBOUND' || (act.status && String(act.status).toLowerCase().includes('reply'));
                        const cleanText = cleanMessageContent(act.content || act.note || act.summary || '', isUser ? 'User Reply' : 'Email Sent');
                        if (cleanText) {
                            allMessages.push({
                                id: act.id,
                                raw: act,
                                type: isUser ? 'user' : 'bot',
                                content: cleanText,
                                label: isUser ? 'Contact Reply' : 'Agent Email',
                                date: act.created_at || null,
                                sequence: allMessages.length + 1
                            });
                        }
                    } else if (act.content || act.note) {
                        const parsed = parseEmailContent(act.content, act.note);
                        parsed.forEach(m => {
                            if (!m.date && act.created_at) m.date = act.created_at;
                            (m as any).raw = act;
                        });
                        allMessages.push(...parsed);
                    }
                }

                if (allMessages.length === 0 && loadedLead) {
                    for (let i = 1; i <= 10; i++) {
                        const e = loadedLead[`Email_${i}`] || loadedLead[`Email ${i}`];
                        if (e) {
                            allMessages.push({
                                type: 'bot',
                                content: cleanMessageContent(e, `Email #${i}`),
                                label: `Email #${i}`,
                                date: parseMsgDate(loadedLead[`Email_${i}_TS`])?.toISOString() || null,
                                sequence: i
                            });
                        }
                    }
                    const reply = loadedLead.email_replied || loadedLead["Email Replied"];
                    if (reply && String(reply).toLowerCase() !== 'no' && String(reply).trim() !== '') {
                        const replyDate = parseMsgDate(reply) || (loadedLead.replied_at ? new Date(loadedLead.replied_at) : null);
                        allMessages.push({
                            type: 'user',
                            content: cleanMessageContent(reply, loadedLead.summary || loadedLead.note || "Lead Replied via Email"),
                            label: 'Contact Reply',
                            date: replyDate ? replyDate.toISOString() : null,
                            sequence: allMessages.length + 1
                        });
                    }
                }

                setMessages(allMessages);
            } catch (e) {
                setError('Network error loading email thread.');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [decodedLeadId]);

    // Link attachments to messages (matching by exact message_id or AI summary content)
    const messagesWithAttachments = React.useMemo(() => {
        const { messagesWithAttachments: mapped, unlinkedAttachments } = linkAttachmentsToMessages(messages, attachments);
        if (unlinkedAttachments.length > 0 && mapped.length > 0) {
            const lastInbound = [...mapped].reverse().find(m => m.type === 'user');
            if (lastInbound) {
                lastInbound.attachments = [...(lastInbound.attachments || []), ...unlinkedAttachments];
            } else {
                mapped[mapped.length - 1].attachments = [
                    ...(mapped[mapped.length - 1].attachments || []),
                    ...unlinkedAttachments
                ];
            }
        }
        return mapped;
    }, [messages, attachments]);

    useEffect(() => {
        if (messagesWithAttachments.length > 0) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messagesWithAttachments]);

    const handleCopyLink = () => {
        const uniqueCustomerId = lead?.customer_id || lead?.id || decodedLeadId;
        const url = `${window.location.origin}/share/email/${encodeURIComponent(uniqueCustomerId)}`;
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const incoming = messages.filter(m => m.type === 'user').length;
    const outgoing = messages.filter(m => m.type === 'bot').length;

    return (
        <div className="h-screen max-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-3 md:p-6 relative overflow-hidden">
            <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-violet-400/10 blur-[120px] pointer-events-none z-0" />
            <div className="fixed -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-purple-400/10 blur-[120px] pointer-events-none z-0" />

            <div className="w-full max-w-6xl h-[85vh] max-h-[800px] bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-xl p-4 sm:p-5 flex flex-col relative z-10 overflow-hidden">

                {/* Top Bar */}
                <div className="mb-3 flex items-center justify-between shrink-0 flex-wrap gap-2">
                    <span className="text-xs font-mono text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full font-semibold">
                        ✉️ Email Thread • {lead?.name ? `${lead.name} (${lead.email || decodedLeadId})` : decodedLeadId}
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

                {/* Main Grid: Chat + Sidebar */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden min-h-0">

                    {/* Email Timeline (2/3 width) */}
                    <div className="lg:col-span-2 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 h-full min-h-0">
                        <div className="border-b border-slate-200 p-3 px-4 flex justify-between items-center shrink-0 bg-white">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Thread</h3>
                            <div className="text-[10px] text-slate-500 font-bold">{messages.length} Messages</div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/30">
                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
                                    <p className="text-sm font-medium">Loading email thread…</p>
                                </div>
                            ) : error ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <AlertCircle className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            ) : messagesWithAttachments.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <Inbox className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">No email messages found for this contact.</p>
                                </div>
                            ) : (
                                <>
                                    {messagesWithAttachments.map((msg, idx) => {
                                        if (msg.type === 'subject') return (
                                            <div key={idx} className="text-xs text-slate-500 font-bold uppercase text-center py-1">
                                                Subject: {msg.content}
                                            </div>
                                        );
                                        return (
                                            <div key={idx} className={`flex flex-col ${msg.type === 'user' ? 'items-start' : 'items-end'}`}>
                                                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${msg.type === 'user'
                                                    ? 'bg-[#1a2035] text-white border border-slate-700/50 rounded-tl-none'
                                                    : 'bg-violet-600 text-white rounded-tr-none'}`}
                                                >
                                                    <p className={`text-[10px] font-bold uppercase mb-1 ${msg.type === 'user' ? 'text-violet-300' : 'text-violet-200'}`}>
                                                        {msg.type === 'user'
                                                            ? <span className="flex items-center gap-1"><User className="h-3 w-3 text-violet-400" />Contact Reply</span>
                                                            : <span className="flex items-center gap-1"><Bot className="h-3 w-3 text-violet-200" />Agent Email</span>}
                                                    </p>
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                        <ChatAttachmentPreview
                                                            attachments={msg.attachments}
                                                            isDarkBubble={msg.type !== 'user'}
                                                        />
                                                    )}
                                                </div>
                                                {msg.date && (
                                                    <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                                                        {new Date(msg.date).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Details (1/3 width) */}
                    <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-1 min-h-0">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                <div className="h-10 w-10 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">
                                    {String(lead?.name || lead?.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-sm font-bold text-slate-900 truncate">
                                        {lead?.name || 'Unknown Contact'}
                                    </h2>
                                    {lead?.eworks_customer_id && (
                                        <p className="text-[10px] font-mono text-slate-500">
                                            eWorks ID: #{lead.eworks_customer_id}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {lead ? (
                                <div className="space-y-3">
                                    {/* Customer Profile */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Profile</p>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                            <Mail className="h-3 w-3" />
                                            {lead.category || 'General Service'}
                                        </span>
                                    </div>

                                    {/* Contact Details */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Details</p>
                                        <div className="space-y-1 text-xs text-slate-600 font-mono">
                                            {lead.email && <p className="truncate">Email: {lead.email}</p>}
                                            {lead.phone && <p>Phone: {lead.phone}</p>}
                                            {lead.address && <p>Addr: {lead.address}</p>}
                                            {lead.city && <p>City: {lead.city}</p>}
                                            {lead.total_invoiced_value > 0 && (
                                                <p className="font-semibold text-emerald-600">Invoiced: AED {Number(lead.total_invoiced_value).toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Source Table */}
                                    {lead.source_table && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source Table</p>
                                            <p className="text-xs font-mono text-slate-600 flex items-center gap-1">
                                                <Database className="h-3 w-3 text-slate-400" />
                                                {lead.source_table}
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Type */}
                                    {lead.action_type && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action Type</p>
                                            <p className="text-xs font-bold text-violet-600 flex items-center gap-1">
                                                <Zap className="h-3 w-3" />
                                                {lead.action_type}
                                            </p>
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
                                <Activity className="h-4 w-4 text-violet-600" />
                                Activity Overview
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                    <p className="text-lg font-bold text-violet-600">{messages.length}</p>
                                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Messages</p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                    <p className="text-lg font-bold text-purple-600">{incoming}</p>
                                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Inbound Replies</p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 col-span-2">
                                    <p className="text-lg font-bold text-slate-700">{outgoing}</p>
                                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Outbound Emails</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
