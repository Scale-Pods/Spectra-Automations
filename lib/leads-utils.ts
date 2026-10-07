export interface RawLeadsResponse {
    nr_wf: any[];
    followup: any[];
    nurture: any[];
    master_leads?: any[];
}

export interface ConsolidatedLead {
    id: string;
    lead_id?: string;
    name: string;
    phone: string;
    email: string;
    replied: string;
    current_loop: string;
    source_loop: string;
    stages_passed: string[];
    stage_data: Record<string, any>;
    created_at: string;
    updated_at: string;
    last_contacted?: string;
    sender_email?: string;
    dropped?: string | boolean;
    collapsed_date?: string;
    email_replied?: string;
    whatsapp_replied?: string;
    "W.P_1 TS"?: string;
    "W.P_2 TS"?: string;
    unsubscribed?: string;
    [key: string]: any;
}

function getVal(obj: any, keys: string[]) {
    if (!obj) return undefined;
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    const normalizedTargetKeys = keys.map(k => k.toLowerCase().replace(/[\s._-]/g, ''));
    for (const actualKey in obj) {
        const normalizedActual = actualKey.toLowerCase().replace(/[\s._-]/g, '');
        if (normalizedTargetKeys.includes(normalizedActual)) {
            return obj[actualKey];
        }
    }
    return undefined;
}

function getWhatsAppHistory(l: any) {
    const history: any = {};
    for (let i = 1; i <= 10; i++) {
        history[`W.P_Replied_${i}`] = getVal(l, [`W.P_Replied ${i}`, `W.P_Replied_${i}`]);
        history[`W.P_FollowUp_${i}`] = getVal(l, [`W.P_FollowUp ${i}`, `W.P_FollowUp_${i}`]);
    }
    return history;
}

function checkIsReplied(val: any): boolean {
    if (!val) return false;
    const str = String(val).trim().toLowerCase();
    if (str === '' || str === 'no' || str === 'false' || str === 'null' || str === 'undefined') {
        return false;
    }
    return true;
}

export function consolidateLeads(data: RawLeadsResponse): ConsolidatedLead[] {
    const consolidatedLeads: ConsolidatedLead[] = [];

    // 1. Map nr_wf (Intro Loop)
    if (Array.isArray(data.nr_wf)) {
        data.nr_wf.forEach((l: any, idx: number) => {
            const stages: string[] = [];
            const stage_data: Record<string, any> = {};

            ["Email_1", "Email_2", "Email_3"].forEach((key) => {
                const val = l[key];
                if (val !== undefined && val !== null && String(val).trim() !== "") {
                    stages.push(key);
                    stage_data[key] = val;
                }
            });

            const wpKeys = ["W.P_1", "W.P_2"];
            wpKeys.forEach((key, i) => {
                const val = getVal(l, [key]);
                if (val) {
                    const stageName = `WhatsApp ${i + 1}`;
                    stages.push(stageName);
                    stage_data[stageName] = val;
                }
            });

            const others = ["Voice 1", "Voice 2", "FollowUp 48 Hr"];
            others.forEach(key => {
                const val = getVal(l, [key]);
                if (val) {
                    stages.push(key);
                    stage_data[key] = val;
                }
            });

            const isReplied = checkIsReplied(l.WA_replied || l.replied || l.WP_Replied_track);

            consolidatedLeads.push({
                ...l, // Preserve ALL database row properties (WA_text, WA_sentiment, WA_note, quotes, etc.)
                id: `intro-${l.id || getVal(l, ["Lead ID"]) || idx}`,
                lead_id: l.id || getVal(l, ["Lead ID"]),
                name: String(l.full_name || l.customer_name || getVal(l, ["Name"]) || "Lead"),
                phone: String(l.phone_e164 || l.mobile_raw || getVal(l, ["Phone"]) || ""),
                email: String(l.email || getVal(l, ["Email"]) || "No Email"),
                replied: isReplied ? (l.WA_replied || "Yes") : "No",
                current_loop: "Intro",
                source_loop: "Intro",
                stages_passed: stages,
                stage_data,
                created_at: l.created_at || l.eworks_created_on || getVal(l, ["Created At"]) || new Date().toISOString(),
                updated_at: l.updated_at || l.eworks_last_updated_on || getVal(l, ["Updated At"]),
                last_contacted: l.last_contacted_at || getVal(l, ["Last Contacted"]),
                sender_email: getVal(l, ["Senders email", "sender_email"]),
                email_replied: l["Email_Replied"] ?? null,
                whatsapp_replied: isReplied ? (l.WA_replied || "Replied") : null,
                "W.P_1": l.WA_text || getVal(l, ["W.P_1", "WhatsApp 1", "WhatsApp_1"]),
                "W.P_2": getVal(l, ["W.P_2", "WhatsApp 2"]),
                "W.P_3": getVal(l, ["W.P_3", "WhatsApp 3"]),
                "W.P_4": getVal(l, ["W.P_4", "WhatsApp 4"]),
                "W.P_FollowUp": getVal(l, ["W.P_FollowUp"]),
                "W.P_Replied": isReplied ? (l.WA_replied || "Replied") : null,
                "W.P_1 TS": getVal(l, ["W.P_1 TS", "WhatsApp 1 TS", "W.P_FollowUp TS", "WP_FollowUp TS"]),
                "W.P_2 TS": getVal(l, ["W.P_2 TS", "WhatsApp 2 TS"]),
                unsubscribed: getVal(l, ["Unsubscribed", "Unsubscribed text"]) || "No",
                WP_Replied_track: isReplied ? (l.WA_replied || "Replied") : null,
                ...getWhatsAppHistory(l)
            });
        });
    }

    // 2. Map followup (Follow Up Loop)
    if (Array.isArray(data.followup)) {
        data.followup.forEach((l: any, idx: number) => {
            const stages: string[] = [];
            const stage_data: Record<string, any> = {};

            for (let i = 1; i <= 3; i++) {
                const key = `Email_${i}`;
                const val = l[key];
                if (val !== undefined && val !== null && String(val).trim() !== "") {
                    stages.push(key);
                    stage_data[key] = val;
                }
            }

            const others = ["Voice 1", "Voice 2", "FollowUp 48 Hr"];
            others.forEach(key => {
                const val = getVal(l, [key]);
                if (val) {
                    stages.push(key);
                    stage_data[key] = val;
                }
            });

            const wpVal = getVal(l, ["W.P_FollowUp"]);
            if (wpVal) {
                stages.push("WhatsApp FollowUp");
                stage_data["WhatsApp FollowUp"] = wpVal;
            }

            const isReplied = checkIsReplied(l.WA_replied || l.replied || l.WP_Replied_track);

            consolidatedLeads.push({
                ...l, // Preserve ALL database row properties
                id: `followup-${l.id || getVal(l, ["Lead ID"]) || idx}`,
                lead_id: l.id || getVal(l, ["Lead ID"]),
                name: String(l.full_name || l.customer_name || getVal(l, ["Name"]) || "Lead"),
                phone: String(l.phone_e164 || l.mobile_raw || getVal(l, ["Phone"]) || ""),
                email: String(l.email || getVal(l, ["Email"]) || "No Email"),
                replied: isReplied ? (l.WA_replied || "Yes") : "No",
                current_loop: "Follow Up",
                source_loop: "Follow Up",
                stages_passed: stages,
                stage_data,
                created_at: l.created_at || l.eworks_created_on || getVal(l, ["Created At"]) || new Date().toISOString(),
                updated_at: l.updated_at || l.eworks_last_updated_on || getVal(l, ["Updated At"]),
                last_contacted: l.last_contacted_at || getVal(l, ["Last Contacted"]),
                dropped: getVal(l, ["Dropped"]),
                sender_email: getVal(l, ["Senders email"]),
                email_replied: l["Email_Replied"] ?? null,
                whatsapp_replied: isReplied ? (l.WA_replied || "Replied") : null,
                "W.P_1": l.WA_text || getVal(l, ["W.P_1", "WhatsApp 1", "WhatsApp_1"]),
                "W.P_2": getVal(l, ["W.P_2", "WhatsApp 2"]),
                "W.P_3": getVal(l, ["W.P_3", "WhatsApp 3"]),
                "W.P_4": getVal(l, ["W.P_4", "WhatsApp 4"]),
                "W.P_FollowUp": getVal(l, ["W.P_FollowUp"]),
                "W.P_Replied": isReplied ? (l.WA_replied || "Replied") : null,
                "W.P_1 TS": getVal(l, ["W.P_1 TS", "W.P_1  TS", "WhatsApp 1 TS", "W.P_FollowUp TS", "WP_FollowUp TS"]),
                "W.P_2 TS": getVal(l, ["W.P_2 TS", "WhatsApp 2 TS"]),
                "W.P_3 TS": getVal(l, ["W.P_3 TS"]),
                "W.P_4 TS": getVal(l, ["W.P_4 TS"]),
                unsubscribed: getVal(l, ["Unsubscribed", "Unsubscribed text"]) || "No",
                WP_Replied_track: isReplied ? (l.WA_replied || "Replied") : null,
                ...getWhatsAppHistory(l)
            });
        });
    }

    // 3. Map nurture (Nurture Loop)
    if (Array.isArray(data.nurture)) {
        data.nurture.forEach((l: any, idx: number) => {
            const stages: string[] = [];
            const stage_data: Record<string, any> = {};

            for (let i = 1; i <= 9; i++) {
                const key = `Email_${i}`;
                const val = l[key];
                if (val !== undefined && val !== null && String(val).trim() !== "") {
                    stages.push(key);
                    stage_data[key] = val;
                }
            }

            for (let i = 1; i <= 6; i++) {
                const val = getVal(l, [`W.P_${i}`]);
                if (val) {
                    const stageName = `WhatsApp ${i}`;
                    stages.push(stageName);
                    stage_data[stageName] = val;
                }
            }

            const others = ["Voice 1", "Voice 2", "FollowUp 48 Hr"];
            others.forEach(key => {
                const val = getVal(l, [key]);
                if (val) {
                    stages.push(key);
                    stage_data[key] = val;
                }
            });

            const wpFollowVal = getVal(l, ["W.P_FollowUp"]);
            if (wpFollowVal) {
                stages.push("WhatsApp FollowUp");
                stage_data["WhatsApp FollowUp"] = wpFollowVal;
            }

            let currentWeek = "";
            if (getVal(l, ["Week 1"])) currentWeek = "Week 1";
            if (getVal(l, ["Week 2"])) currentWeek = "Week 2";
            if (getVal(l, ["Week 3"])) currentWeek = "Week 3";

            const isReplied = checkIsReplied(l.WA_replied || l.replied || l.WP_Replied_track);

            consolidatedLeads.push({
                ...l, // Preserve ALL database row properties
                id: `nurture-${l.id || getVal(l, ["Lead ID"]) || idx}`,
                lead_id: l.id || getVal(l, ["Lead ID"]),
                name: String(l.full_name || l.customer_name || getVal(l, ["Name"]) || "Lead"),
                phone: String(l.phone_e164 || l.mobile_raw || getVal(l, ["Phone"]) || ""),
                email: String(l.email || getVal(l, ["Email"]) || "No Email"),
                replied: isReplied ? (l.WA_replied || "Yes") : "No",
                current_loop: "Nurture",
                source_loop: "Nurture Loop",
                stages_passed: stages,
                stage_data,
                current_week: currentWeek,
                created_at: l.created_at || l.eworks_created_on || getVal(l, ["Created At"]) || new Date().toISOString(),
                updated_at: l.updated_at || l.eworks_last_updated_on || getVal(l, ["Updated At"]),
                last_contacted: l.last_contacted_at || getVal(l, ["Last Contacted"]),
                dropped: getVal(l, ["Dropped"]),
                sender_email: getVal(l, ["Senders email"]),
                email_replied: l["Email_Replied"] ?? null,
                whatsapp_replied: isReplied ? (l.WA_replied || "Replied") : null,
                "W.P_1": l.WA_text || getVal(l, ["W.P_1", "WhatsApp 1", "WhatsApp_1"]),
                "W.P_2": getVal(l, ["W.P_2", "WhatsApp 2"]),
                "W.P_3": getVal(l, ["W.P_3", "WhatsApp 3"]),
                "W.P_4": getVal(l, ["W.P_4", "WhatsApp 4"]),
                "W.P_5": getVal(l, ["W.P_5", "WhatsApp 5"]),
                "W.P_6": getVal(l, ["W.P_6", "WhatsApp 6"]),
                "W.P_7": getVal(l, ["W.P_7"]),
                "W.P_8": getVal(l, ["W.P_8"]),
                "W.P_9": getVal(l, ["W.P_9"]),
                "W.P_10": getVal(l, ["W.P_10"]),
                "W.P_11": getVal(l, ["W.P_11"]),
                "W.P_12": getVal(l, ["W.P_12"]),
                "W.P_FollowUp": getVal(l, ["W.P_FollowUp"]),
                "W.P_Replied": isReplied ? (l.WA_replied || "Replied") : null,
                "W.P_1 TS": getVal(l, ["W.P_1 TS", "WhatsApp 1 TS", "W.P_FollowUp TS", "WP_FollowUp TS"]),
                "W.P_2 TS": getVal(l, ["W.P_2 TS", "WhatsApp 2 TS"]),
                "W.P_3 TS": getVal(l, ["W.P_3 TS"]),
                "W.P_4 TS": getVal(l, ["W.P_4 TS"]),
                "W.P_5 TS": getVal(l, ["W.P_5 TS"]),
                "W.P_6 TS": getVal(l, ["W.P_6 TS"]),
                unsubscribed: getVal(l, ["Unsubscribed", "Unsubscribed text"]) || "No",
                WP_Replied_track: isReplied ? (l.WA_replied || "Replied") : null,
                ...getWhatsAppHistory(l)
            });
        });
    }

    // 4. Map master_leads
    if (Array.isArray((data as any).master_leads)) {
        (data as any).master_leads.forEach((l: any, idx: number) => {
            const isReplied = checkIsReplied(l.WA_replied || l.replied || l.WP_Replied_track);
            consolidatedLeads.push({
                ...l, // Preserve ALL database row properties
                id: `master-${l.id || getVal(l, ["Lead ID"]) || idx}`,
                name: String(l.full_name || l.customer_name || getVal(l, ["Name"]) || "Lead"),
                phone: String(l.phone_e164 || l.mobile_raw || getVal(l, ["Phone"]) || ""),
                email: String(l.email || getVal(l, ["Email"]) || "No Email"),
                replied: isReplied ? (l.WA_replied || "Yes") : "No",
                current_loop: "Master",
                source_loop: "Master Leads",
                stages_passed: [],
                stage_data: {},
                created_at: l.created_at || l.eworks_created_on || getVal(l, ["Created At"]) || new Date().toISOString(),
                updated_at: l.updated_at || l.eworks_last_updated_on || getVal(l, ["Updated At"]),
                lead_status: l.decision_status || getVal(l, ["lead_status", "Lead Status"])
            });
        });
    }

    // 5. Map activity_leads
    if (Array.isArray((data as any).activity_leads)) {
        (data as any).activity_leads.forEach((act: any, idx: number) => {
            const isActivityReplied = checkIsReplied(act.replied || act.WA_replied || act.status || act.replied_at);

            consolidatedLeads.push({
                ...act,
                id: act.id ? `act-${act._source_table || 'tbl'}-${act.id}` : `act-${idx}`,
                lead_id: act.lead_id || act.id,
                name: String(act.lead_name || act.customer_name || act.full_name || "Lead"),
                phone: String(act.lead_phone || act.customer_phone || act.phone_e164 || ""),
                email: String(act.lead_email || act.email || "No Email"),
                replied: isActivityReplied ? 'Yes' : 'No',
                current_loop: act._source_table || act.channel || "Activity Stream",
                source_loop: act._source_table || act.channel || "Activity Stream",
                stages_passed: [],
                stage_data: {},
                created_at: act.created_at || act.updated_at || new Date().toISOString(),
                updated_at: act.updated_at || act.created_at,
                _source_table: act._source_table,
                channel: act.channel,
                action_type: act.action_type,
                status: act.status,
                content: act.content,
                note: act.note,
                summary: act.summary,
                lead_temp: act.lead_temp,
                vapi_account: act.vapi_account,
                workflow_name: act.workflow_name,
                replied_at: act.replied_at,
                unsubscribed: act.unsubscribed || (act.status && String(act.status).toLowerCase().includes('unsubscribed') ? 'Yes' : 'No'),
            });
        });
    }

    return consolidatedLeads;
}

