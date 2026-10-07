import { format } from "date-fns";

export interface EmailTableStat {
    name: string;
    totalLeads: number;
    emails: number;
    replies: number;
    unsubscribed: number;
}

export interface EmailMetricsResult {
    totalEmails: number;
    totalSent: number;
    firstEmailCount: number;
    replyCount: number;
    totalReplies: number;
    unsubscribedCount: number;
    totalUnsubscribed: number;
    totalLeadsCount: number;
    totalLeads: number;
    replyRate: string;
    unsubRate: string;
    tableStats: {
        naples: EmailTableStat;
        aspen: EmailTableStat;
        old: EmailTableStat;
        fello: EmailTableStat;
    };
    dailyChartData: { date: string; sent: number; replies: number }[];
}

export function getLeadSourceTableKey(lead: any): 'naples' | 'aspen' | 'old' | 'fello' {
    const src = String(
        lead._source_table ||
        lead.source_table ||
        lead.sourceTable ||
        lead.source_loop ||
        lead.source ||
        lead.campaign ||
        ''
    ).toLowerCase();

    if (src.includes('aspen')) return 'aspen';
    if (src.includes('fello')) return 'fello';
    if (src.includes('old') || src.includes('master')) return 'old';
    if (src.includes('naples')) return 'naples';
    return 'naples';
}

function parseMsgDate(content: any): Date | null {
    if (!content) return null;
    if (typeof content === 'number') return new Date(content);
    const s = String(content).trim();
    if (!s) return null;

    const ddmmyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (ddmmyyyy) {
        const day = ddmmyyyy[1].padStart(2, '0');
        const month = ddmmyyyy[2].padStart(2, '0');
        const year = ddmmyyyy[3];
        const hh = (ddmmyyyy[4] || '00').padStart(2, '0');
        const mm = (ddmmyyyy[5] || '00').padStart(2, '0');
        const ss = (ddmmyyyy[6] || '00').padStart(2, '0');
        const d = new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}.000Z`);
        if (!isNaN(d.getTime())) return d;
    }

    const lines = s.split('\n');
    const lastLine = lines[lines.length - 1].trim();
    const dateObj = new Date(lastLine.replace(' ', 'T'));
    if (!isNaN(dateObj.getTime()) && lastLine.includes('-') && lastLine.includes(':')) {
        return dateObj;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

export function calculateEmailMetrics(
    allLeads: any[],
    dateRange?: { from?: Date; to?: Date }
): EmailMetricsResult {
    const fromD = dateRange?.from ? new Date(dateRange.from) : null;
    const toD = dateRange?.to ? new Date(dateRange.to) : (fromD ? new Date(fromD) : null);
    if (fromD) fromD.setHours(0, 0, 0, 0);
    if (toD) toD.setHours(23, 59, 59, 999);

    const checkDate = (d: Date | null) => {
        if (!fromD || !toD) return true;
        if (!d || isNaN(d.getTime())) return true;
        return d >= fromD && d <= toD;
    };

    function checkIsNonEmpty(val: any): boolean {
        if (val === null || val === undefined) return false;
        const str = String(val).trim();
        return str !== '' && str !== '[]' && str !== 'null' && str !== 'undefined';
    }

    function checkIsReplied(val: any): boolean {
        if (val === null || val === undefined) return false;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'object') return Object.keys(val).length > 0;
        const str = String(val).trim().toLowerCase();
        return str !== '' && str !== '[]' && str !== 'no' && str !== 'false' && str !== 'null' && str !== 'undefined';
    }

    let totalEmails = 0;
    let firstEmailCount = 0;
    let replyCount = 0;
    let unsubscribedCount = 0;
    let totalLeadsCount = 0;

    const tableStats = {
        naples: { name: "Naples", totalLeads: 0, emails: 0, replies: 0, unsubscribed: 0 },
        aspen: { name: "Aspen", totalLeads: 0, emails: 0, replies: 0, unsubscribed: 0 },
        old: { name: "Old Leads", totalLeads: 0, emails: 0, replies: 0, unsubscribed: 0 },
        fello: { name: "Fello", totalLeads: 0, emails: 0, replies: 0, unsubscribed: 0 },
    };

    const dailyMap: Record<string, { date: string; sent: number; replies: number }> = {};
    const processedIds = new Set<string>();

    (allLeads || []).forEach((lead: any) => {
        const rawId = String(lead.eworks_customer_id || lead.email || lead.id || '').replace(/^(intro|master|nurture|followup|act-tbl|act-messages|act)-/i, '');
        if (rawId && processedIds.has(rawId)) return;
        if (rawId) processedIds.add(rawId);

        const tableKey = getLeadSourceTableKey(lead);
        let leadHasEmail = false;

        // Count non-empty email_1..email_4 steps
        ['email_1', 'email_2', 'email_3', 'email_4'].forEach((col, idx) => {
            if (checkIsNonEmpty(lead[col]) || checkIsNonEmpty(lead[`${col}_status`])) {
                totalEmails++;
                tableStats[tableKey].emails++;
                leadHasEmail = true;
                if (idx === 0) firstEmailCount++;

                const emailDate = lead.created_at || lead.eworks_created_on ? new Date(lead.created_at || lead.eworks_created_on) : null;
                if (emailDate && !isNaN(emailDate.getTime()) && checkDate(emailDate)) {
                    const dateKey = format(emailDate, "MMM dd");
                    if (!dailyMap[dateKey]) {
                        dailyMap[dateKey] = { date: dateKey, sent: 0, replies: 0 };
                    }
                    dailyMap[dateKey].sent++;
                }
            }
        });

        // Check Email Replies
        if (checkIsReplied(lead.email_reply)) {
            leadHasEmail = true;
            replyCount++;
            tableStats[tableKey].replies++;

            let replyDate: Date | null = null;
            if (Array.isArray(lead.email_reply)) {
                lead.email_reply.forEach((r: any) => {
                    const dStr = r.received_at || r.sent_at || r.created_at;
                    if (dStr) {
                        const d = new Date(dStr);
                        if (!isNaN(d.getTime())) replyDate = d;
                    }
                });
            } else if (typeof lead.email_reply === 'object') {
                const dStr = lead.email_reply.received_at || lead.email_reply.sent_at || lead.email_reply.created_at;
                if (dStr) {
                    const d = new Date(dStr);
                    if (!isNaN(d.getTime())) replyDate = d;
                }
            }
            if (!replyDate && (lead.updated_at || lead.created_at)) {
                replyDate = new Date(lead.updated_at || lead.created_at);
            }

            if (replyDate && !isNaN(replyDate.getTime()) && checkDate(replyDate)) {
                const dateKey = format(replyDate, "MMM dd");
                if (!dailyMap[dateKey]) {
                    dailyMap[dateKey] = { date: dateKey, sent: 0, replies: 0 };
                }
                dailyMap[dateKey].replies++;
            }
        }

        // Check Unsubscribed
        if (lead.email_unsubscribed === true || (lead.unsubscribed && String(lead.unsubscribed).toLowerCase().includes("yes"))) {
            leadHasEmail = true;
            unsubscribedCount++;
            tableStats[tableKey].unsubscribed++;
        }

        if (leadHasEmail || (lead.email && String(lead.email).trim() !== '' && String(lead.email).toLowerCase() !== 'no email')) {
            totalLeadsCount++;
            tableStats[tableKey].totalLeads++;
        }
    });

    const dailyChartData = Object.values(dailyMap);
    const replyRate = totalEmails > 0 ? ((replyCount / totalEmails) * 100).toFixed(1) : "0.0";
    const unsubRate = totalEmails > 0 ? ((unsubscribedCount / totalEmails) * 100).toFixed(1) : "0.0";

    return {
        totalEmails,
        totalSent: totalEmails,
        firstEmailCount,
        replyCount,
        totalReplies: replyCount,
        unsubscribedCount,
        totalUnsubscribed: unsubscribedCount,
        totalLeadsCount: totalLeadsCount || (allLeads ? allLeads.length : 0),
        totalLeads: totalLeadsCount || (allLeads ? allLeads.length : 0),
        replyRate,
        unsubRate,
        tableStats,
        dailyChartData,
    };
}

