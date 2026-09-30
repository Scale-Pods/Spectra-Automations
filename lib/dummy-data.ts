// Spectra Automation Mock / Dummy Frontend Data
// This dataset replaces live database routing until new routing logic is integrated.

export interface DummyLead {
    id: string;
    "Lead ID"?: string;
    name: string;
    Name?: string;
    email: string;
    Email?: string;
    phone: string;
    Phone?: string;
    company: string;
    status: "replied" | "delivered" | "read" | "sent" | "failed";
    replyStatus: "Replied" | "Sent";
    lastContacted: string;
    sentCount: number;
    subject?: string;
    preview?: string;
    sender?: string;
    source_loop?: string;
    created_at?: string;
    messages?: Array<{
        id: string;
        sender: "user" | "bot" | "agent";
        text: string;
        timestamp: string;
    }>;
}

export const SPECTRA_MASTER_METRICS = {
    totalLeads: 1490,
    totalEmailsSent: 12850,
    totalWaReachouts: 8920,
    totalReplies: 1240,
    replyRate: "13.9",
    oldestLeadDate: "2026-06-01T00:00:00.000Z",
    dailyAcquisition: [
        { date: "2026-09-17", leads: 42, count: 42 },
        { date: "2026-09-18", leads: 58, count: 58 },
        { date: "2026-09-19", leads: 35, count: 35 },
        { date: "2026-09-20", leads: 48, count: 48 },
        { date: "2026-09-21", leads: 72, count: 72 },
        { date: "2026-09-22", leads: 89, count: 89 },
        { date: "2026-09-23", leads: 64, count: 64 },
        { date: "2026-09-24", leads: 95, count: 95 },
        { date: "2026-09-25", leads: 110, count: 110 },
        { date: "2026-09-26", leads: 76, count: 76 },
        { date: "2026-09-27", leads: 82, count: 82 },
        { date: "2026-09-28", leads: 104, count: 104 },
        { date: "2026-09-29", leads: 128, count: 128 },
        { date: "2026-09-30", leads: 142, count: 142 },
    ]
};

export const SPECTRA_EMAIL_METRICS = {
    totalEmails: 12850,
    totalSent: 12850,
    firstEmailCount: 12850,
    replyCount: 1780,
    totalReplies: 1780,
    unsubscribedCount: 42,
    totalUnsubscribed: 42,
    totalLeadsCount: 1480,
    totalLeads: 1480,
    replyRate: "13.8",
    unsubRate: "0.3",
    dailyChartData: [
        { date: "2026-09-17", sent: 450, replies: 62 },
        { date: "2026-09-18", sent: 680, replies: 94 },
        { date: "2026-09-19", sent: 520, replies: 71 },
        { date: "2026-09-20", sent: 410, replies: 58 },
        { date: "2026-09-21", sent: 890, replies: 124 },
        { date: "2026-09-22", sent: 940, replies: 138 },
        { date: "2026-09-23", sent: 780, replies: 105 },
        { date: "2026-09-24", sent: 1020, replies: 146 },
        { date: "2026-09-25", sent: 1150, replies: 168 },
        { date: "2026-09-26", sent: 620, replies: 88 },
        { date: "2026-09-27", sent: 540, replies: 74 },
        { date: "2026-09-28", sent: 1100, replies: 152 },
        { date: "2026-09-29", sent: 1350, replies: 195 },
        { date: "2026-09-30", sent: 1400, replies: 205 },
    ]
};

export const SPECTRA_WHATSAPP_METRICS = {
    uniqueSentCount: 8920,
    sentCount: 14250,
    totalReplies: 1240,
    replyRate: "13.9",
    trendData: [
        { date: "Sep 17", sent: 320, replied: 42 },
        { date: "Sep 18", sent: 480, replied: 68 },
        { date: "Sep 19", sent: 390, replied: 51 },
        { date: "Sep 20", sent: 290, replied: 38 },
        { date: "Sep 21", sent: 640, replied: 92 },
        { date: "Sep 22", sent: 710, replied: 104 },
        { date: "Sep 23", sent: 580, replied: 82 },
        { date: "Sep 24", sent: 820, replied: 118 },
        { date: "Sep 25", sent: 910, replied: 135 },
        { date: "Sep 26", sent: 440, replied: 62 },
        { date: "Sep 27", sent: 380, replied: 54 },
        { date: "Sep 28", sent: 890, replied: 128 },
        { date: "Sep 29", sent: 1020, replied: 152 },
        { date: "Sep 30", sent: 1150, replied: 165 },
    ],
    statusPieData: [
        { name: "Direct Replies", value: 1240, color: "#10b981" },
        { name: "Delivered & Sent", value: 12150, color: "#3b82f6" },
        { name: "Read", value: 740, color: "#8b5cf6" },
        { name: "Failed / Bounced", value: 120, color: "#f43f5e" }
    ],
    conversionFunnelData: [
        { stage: "Leads Contacted", count: 8920, fill: "#3b82f6" },
        { stage: "Messages Sent", count: 14250, fill: "#6366f1" },
        { stage: "Replies Received", count: 1240, fill: "#10b981" },
    ]
};

export const SPECTRA_DUMMY_LEADS: DummyLead[] = [
    {
        id: "lead-101",
        "Lead ID": "lead-101",
        name: "Alexander Wright",
        Name: "Alexander Wright",
        email: "alexander.wright@apexsolutions.io",
        Email: "alexander.wright@apexsolutions.io",
        phone: "+1 (555) 234-8901",
        Phone: "+1 (555) 234-8901",
        company: "Apex Solutions",
        status: "replied",
        replyStatus: "Replied",
        lastContacted: "2026-09-30 14:15",
        sentCount: 3,
        subject: "Spectra AI Automation Workflow Demo",
        preview: "Yes, we are interested in setting up automated lead nurturing workflows for our sales reps.",
        sender: "info@scalepods.co",
        created_at: "2026-09-30T14:15:00.000Z",
        messages: [
            { id: "m1", sender: "bot", text: "Template: Hello Alexander! Welcome to Spectra Automation. Would you like to schedule an automated CRM workflow demo?", timestamp: "14:00" },
            { id: "m2", sender: "user", text: "Yes, we are interested in setting up automated lead nurturing workflows for our sales reps.", timestamp: "14:15" }
        ]
    },
    {
        id: "lead-102",
        "Lead ID": "lead-102",
        name: "Sophia Martinez",
        Name: "Sophia Martinez",
        email: "sophia.m@nexusglobal.com",
        Email: "sophia.m@nexusglobal.com",
        phone: "+1 (555) 345-9012",
        Phone: "+1 (555) 345-9012",
        company: "Nexus Global",
        status: "replied",
        replyStatus: "Replied",
        lastContacted: "2026-09-30 13:40",
        sentCount: 4,
        subject: "Scaling Outbound Operations with Spectra",
        preview: "Can you send over the pricing overview for 10,000 monthly WhatsApp reachouts?",
        sender: "info@scalepods.co",
        created_at: "2026-09-30T13:40:00.000Z",
        messages: [
            { id: "m1", sender: "bot", text: "Template: Hi Sophia! Discover how Spectra Automations streamlines omni-channel messaging.", timestamp: "13:30" },
            { id: "m2", sender: "user", text: "Can you send over the pricing overview for 10,000 monthly WhatsApp reachouts?", timestamp: "13:40" }
        ]
    },
    {
        id: "lead-103",
        "Lead ID": "lead-103",
        name: "Marcus Vance",
        Name: "Marcus Vance",
        email: "marcus.vance@vanguardtech.org",
        Email: "marcus.vance@vanguardtech.org",
        phone: "+1 (555) 456-0123",
        Phone: "+1 (555) 456-0123",
        company: "Vanguard Tech",
        status: "delivered",
        replyStatus: "Sent",
        lastContacted: "2026-09-30 12:20",
        sentCount: 2,
        subject: "Spectra Integration Inquiry",
        preview: "Outreach message delivered via Spectra Automation engine.",
        sender: "info@scalepods.co",
        created_at: "2026-09-30T12:20:00.000Z",
        messages: [
            { id: "m1", sender: "bot", text: "Template: Hey Marcus! Check out Spectra's latest automated campaign tools.", timestamp: "12:20" }
        ]
    },
    {
        id: "lead-104",
        "Lead ID": "lead-104",
        name: "Elena Rostova",
        Name: "Elena Rostova",
        email: "elena@luminaai.co",
        Email: "elena@luminaai.co",
        phone: "+1 (555) 567-1234",
        Phone: "+1 (555) 567-1234",
        company: "Lumina AI",
        status: "replied",
        replyStatus: "Replied",
        lastContacted: "2026-09-30 11:05",
        sentCount: 5,
        subject: "AI Campaign Optimization",
        preview: "Our team loved the platform demo! When can we initiate onboarding?",
        sender: "info@scalepods.co",
        created_at: "2026-09-30T11:05:00.000Z",
        messages: [
            { id: "m1", sender: "bot", text: "Template: Hi Elena! Follow up regarding Spectra's automated lead scoring.", timestamp: "10:50" },
            { id: "m2", sender: "user", text: "Our team loved the platform demo! When can we initiate onboarding?", timestamp: "11:05" }
        ]
    },
    {
        id: "lead-105",
        "Lead ID": "lead-105",
        name: "David Chen",
        Name: "David Chen",
        email: "dchen@synergycapital.com",
        Email: "dchen@synergycapital.com",
        phone: "+1 (555) 678-2345",
        Phone: "+1 (555) 678-2345",
        company: "Synergy Capital",
        status: "read",
        replyStatus: "Sent",
        lastContacted: "2026-09-30 10:15",
        sentCount: 2,
        subject: "Spectra Automation Enterprise Solutions",
        preview: "Message read by contact.",
        sender: "info@scalepods.co",
        created_at: "2026-09-30T10:15:00.000Z",
        messages: [
            { id: "m1", sender: "bot", text: "Template: Hello David! Let's automate your client communication pipelines with Spectra.", timestamp: "10:15" }
        ]
    },
    {
        id: "lead-106",
        "Lead ID": "lead-106",
        name: "Rachel Adams",
        Name: "Rachel Adams",
        email: "rachel.adams@horizonventures.com",
        Email: "rachel.adams@horizonventures.com",
        phone: "+1 (555) 789-3456",
        Phone: "+1 (555) 789-3456",
        company: "Horizon Ventures",
        status: "replied",
        replyStatus: "Replied",
        lastContacted: "2026-09-29 16:50",
        sentCount: 3,
        subject: "Automated Email & WhatsApp Dispatch",
        preview: "Please connect with our CTO to setup webhook integrations.",
        sender: "info@scalepods.co",
        created_at: "2026-09-29T16:50:00.000Z",
        messages: [
            { id: "m1", sender: "bot", text: "Template: Hi Rachel! Spectra Automation makes API integrations seamless.", timestamp: "16:30" },
            { id: "m2", sender: "user", text: "Please connect with our CTO to setup webhook integrations.", timestamp: "16:50" }
        ]
    },
    {
        id: "lead-107",
        "Lead ID": "lead-107",
        name: "Jameson Drake",
        Name: "Jameson Drake",
        email: "jdrake@titanlogistics.io",
        Email: "jdrake@titanlogistics.io",
        phone: "+1 (555) 890-4567",
        Phone: "+1 (555) 890-4567",
        company: "Titan Logistics",
        status: "sent",
        replyStatus: "Sent",
        lastContacted: "2026-09-29 14:10",
        sentCount: 1,
        subject: "Spectra Logistics Automation",
        preview: "Introductory campaign message dispatched.",
        sender: "info@scalepods.co",
        created_at: "2026-09-29T14:10:00.000Z",
        messages: [
            { id: "m1", sender: "bot", text: "Template: Hey Jameson! Accelerate customer updates with Spectra WhatsApp bots.", timestamp: "14:10" }
        ]
    }
];

export const SPECTRA_RECEIVED_EMAILS = [
    {
        id: "rec-1",
        lead_name: "Alexander Wright",
        sender_email: "alexander.wright@apexsolutions.io",
        subject: "Re: Spectra AI Automation Workflow Demo",
        preview: "Yes, we are interested in setting up automated lead nurturing workflows for our sales reps.",
        date: "2026-09-30 14:15",
        leadId: "lead-101"
    },
    {
        id: "rec-2",
        lead_name: "Sophia Martinez",
        sender_email: "sophia.m@nexusglobal.com",
        subject: "Re: Scaling Outbound Operations with Spectra",
        preview: "Can you send over the pricing overview for 10,000 monthly WhatsApp reachouts?",
        date: "2026-09-30 13:40",
        leadId: "lead-102"
    },
    {
        id: "rec-3",
        lead_name: "Elena Rostova",
        sender_email: "elena@luminaai.co",
        subject: "Re: AI Campaign Optimization",
        preview: "Our team loved the platform demo! When can we initiate onboarding?",
        date: "2026-09-30 11:05",
        leadId: "lead-104"
    },
    {
        id: "rec-4",
        lead_name: "Rachel Adams",
        sender_email: "rachel.adams@horizonventures.com",
        subject: "Re: Automated Email & WhatsApp Dispatch",
        preview: "Please connect with our CTO to setup webhook integrations.",
        date: "2026-09-29 16:50",
        leadId: "lead-106"
    }
];

export const SPECTRA_UNSUBSCRIBED_EMAILS = [
    {
        id: "unsub-1",
        name: "Kevin Sterling",
        email: "kevin@sterlingtech.com",
        unsubscribedAt: "2026-09-28 11:20",
        reason: "User opted out via unsubscribe link"
    },
    {
        id: "unsub-2",
        name: "Samantha Reed",
        email: "samantha@reedanalytics.org",
        unsubscribedAt: "2026-09-25 09:45",
        reason: "No longer managing email campaigns"
    }
];

export const SPECTRA_BOUNCED_EMAILS = [
    {
        id: "bounce-1",
        name: "Invalid Address Test",
        email: "bounced-user@nonexistent-domain.xyz",
        bouncedAt: "2026-09-29 18:30",
        code: "550 5.1.1 Host destination mailbox not found"
    }
];
