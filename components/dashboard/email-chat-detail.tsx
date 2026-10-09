"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCw,
    Download,
    Mail,
    User,
    Bot,
    Link as LinkIcon,
    Check,
    Send,
    Inbox,
    Share2,
    X
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { FollowUpBossButton } from "@/components/ui/followup-boss-button";

import { parseMsgDate, cleanMessageContent } from "@/lib/reply-utils";

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
                type: 'subject' as const,
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
                type: 'bot' as const,
                content: text,
                label: 'Agent Email',
                date: null as string | null,
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
                type: 'user' as const,
                content: text,
                label: 'User Reply',
                date: null as string | null,
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
                type: 'bot' as const,
                content: line,
                label: 'Agent Email',
                date: null as string | null,
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

interface EmailChatDetailProps {
    leadId: string;
    onClose?: () => void;
    initialLead?: any;
}

const EMPTY_LEADS: any[] = [];

export function EmailChatDetail({ leadId, onClose, initialLead }: EmailChatDetailProps) {
    let dataContext: any = {};
    try {
        dataContext = useData();
    } catch (e) {
        // fallback
    }
    const { leads: allLeads = EMPTY_LEADS } = dataContext;
    const [lead, setLead] = useState<any | null>(initialLead || null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [copied, setCopied] = useState(false);

    const fetchLeadAndEmailThread = async () => {
        setLoading(true);
        try {
            let foundLead = initialLead;
            if (!foundLead && leadId) {
                foundLead = allLeads.find((l: any) =>
                    String(l["Lead ID"] || l.id) === String(leadId) ||
                    String(l.Email || l.email) === String(leadId)
                );
            }

            if (!foundLead && leadId) {
                try {
                    const leadsRes = await fetch('/api/leads');
                    if (leadsRes.ok) {
                        const data = await leadsRes.json();
                        const allFetched = [
                            ...(data.master_leads || []),
                            ...(data.nr_wf || []),
                            ...(data.followup || []),
                            ...(data.nurture || []),
                            ...(data.activity_leads || []),
                        ];
                        foundLead = allFetched.find((l: any) =>
                            String(l["Lead ID"] || l.id) === String(leadId) ||
                            String(l.Email || l.email) === String(leadId)
                        );
                    }
                } catch (e) {
                    console.error("Error fetching fallback leads in EmailChatDetail:", e);
                }
            }

            const searchTarget = foundLead?.lead_email || foundLead?.Email || foundLead?.email || leadId;
            const res = await fetch(`/api/activity?channel=email&search=${encodeURIComponent(searchTarget)}`);
            let actLogs: any[] = [];
            if (res.ok) {
                const data = await res.json();
                actLogs = data.activities || [];
            }

            if (!foundLead && actLogs.length > 0) {
                const first = actLogs[0];
                foundLead = {
                    "Lead ID": first.lead_id || leadId,
                    "Name": first.lead_name || "Email Lead",
                    "Email": first.lead_email || leadId,
                    "Phone": first.lead_phone || "",
                    status: first.status || "sent",
                };
            }

            setLead(foundLead || { "Name": searchTarget, "Email": searchTarget });

            const parsedMsgs: any[] = [];

            if (foundLead && foundLead.messages && Array.isArray(foundLead.messages) && foundLead.messages.length > 0) {
                foundLead.messages.forEach((m: any, idx: number) => {
                    parsedMsgs.push({
                        type: m.direction === 'INBOUND' ? 'user' : 'bot',
                        content: m.body_text || m.subject || '',
                        label: m.direction === 'INBOUND' ? 'Recipient Reply' : (m.provider || 'Outreach Email'),
                        date: m.sent_or_received_at || m.created_at,
                        sequence: idx + 1
                    });
                });
            } else if (foundLead && (foundLead.content || foundLead.note)) {
                const msgs = parseEmailContent(foundLead.content, foundLead.note);
                msgs.forEach(m => {
                    if (foundLead.created_at && !m.date) m.date = foundLead.created_at;
                });
                parsedMsgs.push(...msgs);
            }

            // 2) Parse activity logs returned from API search
            actLogs.forEach(act => {
                const msgs = parseEmailContent(act.content, act.note);
                msgs.forEach(m => {
                    if (act.created_at && !m.date) m.date = act.created_at;
                });
                parsedMsgs.push(...msgs);
            });

            // 3) Parse legacy column stages (Email_1 ... Email_10) if no messages found
            if (parsedMsgs.length === 0 && foundLead) {
                for (let i = 1; i <= 10; i++) {
                    const e = foundLead[`Email_${i}`] || foundLead[`Email ${i}`];
                    if (e) {
                        parsedMsgs.push({
                            type: 'bot',
                            content: cleanMessageContent(e, `Email #${i}`),
                            label: `Email #${i}`,
                            date: parseMsgDate(foundLead[`Email_${i}_TS`])?.toISOString() || null,
                            sequence: i
                        });
                    }
                }
                const reply = foundLead.email_replied || foundLead["Email Replied"];
                if (reply && String(reply).toLowerCase() !== 'no' && String(reply).trim() !== '') {
                    const replyDate = parseMsgDate(reply) || (foundLead.replied_at ? new Date(foundLead.replied_at) : null);
                    parsedMsgs.push({
                        type: 'user',
                        content: cleanMessageContent(reply, foundLead.summary || foundLead.note || "Lead Replied via Email"),
                        label: 'Recipient Reply',
                        date: replyDate ? replyDate.toISOString() : null,
                        sequence: parsedMsgs.length + 1
                    });
                }
            }

            // Deduplicate messages by content
            const seenContent = new Set<string>();
            const uniqueMsgs = parsedMsgs.filter(m => {
                const key = `${m.type}:${(m.content || '').trim()}`;
                if (seenContent.has(key)) return false;
                seenContent.add(key);
                return true;
            });

            // Sort ascending by timestamp (earliest first, latest last)
            uniqueMsgs.sort((a, b) => {
                const timeA = a.date ? new Date(a.date).getTime() : 0;
                const timeB = b.date ? new Date(b.date).getTime() : 0;
                if (timeA && timeB && timeA !== timeB) {
                    return timeA - timeB;
                }
                return (a.sequence || 0) - (b.sequence || 0);
            });

            setMessages(uniqueMsgs);
        } catch (err) {
            console.error('[EmailChatDetail]', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeadAndEmailThread();
    }, [leadId, initialLead]);

    const copyShareLink = () => {
        // Use eworks_customer_id or lead_email as primary share identifier
        const eworksId = (lead as any)?.eworks_customer_id || (lead as any)?.eworks_id;
        const rawEmail = lead?.["lead_email"] || lead?.["Email"] || lead?.email || leadId;
        const shareId = eworksId || String(rawEmail).trim() || leadId;
        const shareUrl = `${window.location.origin}/share/email/${encodeURIComponent(shareId)}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const leadName = lead?.["Name"] || lead?.name || leadId || "Unknown Contact";
    const leadEmail = lead?.["Email"] || lead?.email || "";
    const subjectText = lead?.subject || lead?.Subject || initialLead?.subject || (messages && messages.length > 0 ? messages.find((m: any) => m.subject)?.subject : null) || "Email Service Outreach";

    return (
        <div className="flex flex-col h-full bg-white text-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-slate-50/80 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold border border-purple-200 shadow-2xs">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 leading-tight">{subjectText}</h3>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                            <span><strong className="text-slate-700">{leadName}</strong> ({leadEmail})</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <FollowUpBossButton lead={lead} variant="button" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyShareLink}
                        className="gap-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100/80 rounded-lg border border-blue-200 font-semibold"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-blue-600" />}
                        {copied ? "Copied!" : "Share Link"}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchLeadAndEmailThread}
                        className="text-slate-600 hover:bg-slate-200/80 rounded-lg h-8 w-8 p-0 flex items-center justify-center border border-slate-200"
                        title="Refresh thread"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg h-8 w-8 p-0 flex items-center justify-center border border-slate-200 transition-colors ml-1"
                            title="Close thread"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                        <RefreshCw className="h-5 w-5 animate-spin mr-2 text-blue-500" /> Loading Email thread...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-2">
                        <Mail className="h-8 w-8 opacity-30 text-blue-500" />
                        <span>No Email activity recorded for this contact yet.</span>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isInbound = msg.type === 'user' || String(msg.direction || '').toUpperCase() === 'INBOUND';
                        const text = msg.content;
                        const formattedDate = msg.date
                            ? new Date(msg.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                            : null;

                        return (
                            <div
                                key={index}
                                className={`flex items-end gap-3 ${isInbound ? 'justify-start' : 'justify-end'} my-3`}
                            >
                                {isInbound && (
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xs font-bold shrink-0 mb-1 shadow-2xs">
                                        <User className="h-4 w-4" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[80%] sm:max-w-[70%] p-4 text-xs sm:text-sm rounded-2xl shadow-xs transition-all ${
                                        isInbound
                                            ? 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                                            : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-xs shadow-md'
                                    }`}
                                >
                                    <div
                                        className={`flex items-center justify-between gap-3 mb-2 pb-1.5 border-b text-[11px] font-medium ${
                                            isInbound
                                                ? 'border-slate-100 text-slate-500'
                                                : 'border-white/15 text-blue-100/90'
                                        }`}
                                    >
                                        <span className={`flex items-center gap-1 font-semibold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-md ${
                                            isInbound
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-white/15 text-white border border-white/20'
                                        }`}>
                                            {isInbound ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                                            {isInbound ? (msg.label || 'Recipient Reply') : (msg.label || 'Outreach Email')}
                                        </span>
                                        {formattedDate && (
                                            <span className="font-mono text-[10px] opacity-80">
                                                {formattedDate}
                                            </span>
                                        )}
                                    </div>
                                    <p className="whitespace-pre-wrap leading-relaxed font-sans font-normal">{text}</p>
                                </div>

                                {!isInbound && (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0 mb-1 shadow-2xs">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
