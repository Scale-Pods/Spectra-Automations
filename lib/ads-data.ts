export interface AdCampaign {
    id: string;
    name: string;
    platform: 'meta' | 'google';
    format: 'facebook_feed' | 'instagram_story' | 'google_search' | 'google_pmax' | 'google_display';
    status: 'active' | 'paused' | 'review';
    objective: 'Conversions' | 'Lead Generation' | 'Traffic' | 'Brand Awareness' | 'Sales';
    dailyBudget: number;
    spent: number;
    impressions: number;
    clicks: number;
    ctr: number; // percentage e.g. 3.4
    conversions: number;
    cpa: number; // cost per acquisition
    roas: number; // return on ad spend e.g. 4.8
    headline: string;
    primaryText: string;
    cta: string;
    targetAudience: string;
    startDate: string;
    createdFromAI?: boolean;
}

export interface AdsMetricsSummary {
    totalSpend: number;
    totalRevenue: number;
    overallRoas: number;
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    totalConversions: number;
    avgCpa: number;
    metaSpend: number;
    metaRevenue: number;
    googleSpend: number;
    googleRevenue: number;
}

export const INITIAL_CAMPAIGNS: AdCampaign[] = [
    {
        id: "meta-camp-01",
        name: "ScalePods AI Outreach - Retargeting Q4",
        platform: "meta",
        format: "facebook_feed",
        status: "active",
        objective: "Conversions",
        dailyBudget: 250,
        spent: 4620,
        impressions: 284500,
        clicks: 10520,
        ctr: 3.70,
        conversions: 412,
        cpa: 11.21,
        roas: 5.34,
        headline: "Automate 80% Of Your Outbound Sales Pipeline",
        primaryText: "Stop wasting 15+ hours/week on manual outreach. Spectra's AI agents orchestrate omnichannel Email + WhatsApp pipelines automatically with personalized follow-ups.",
        cta: "Start Free Trial",
        targetAudience: "B2B SaaS Founders, VP Sales, Growth Marketers (US, UK, UAE)",
        startDate: "2026-10-10",
        createdFromAI: true
    },
    {
        id: "goog-camp-01",
        name: "Google Search - High Intent 'Outreach Automation'",
        platform: "google",
        format: "google_search",
        status: "active",
        objective: "Lead Generation",
        dailyBudget: 350,
        spent: 6180,
        impressions: 142000,
        clicks: 6840,
        ctr: 4.82,
        conversions: 538,
        cpa: 11.48,
        roas: 4.65,
        headline: "#1 AI Cold Outreach Platform | 3x More Replies Guaranteed",
        primaryText: "Smart multichannel loops across Email & WhatsApp. Integrate with your CRM in 2 minutes. Get instant demo access today.",
        cta: "Book a Demo",
        targetAudience: "Keywords: 'sales automation software', 'automated cold email tool', 'whatsapp crm integration'",
        startDate: "2026-10-05"
    },
    {
        id: "meta-camp-02",
        name: "Instagram Stories - Founders Case Study Video",
        platform: "meta",
        format: "instagram_story",
        status: "active",
        objective: "Sales",
        dailyBudget: 180,
        spent: 2790,
        impressions: 198000,
        clicks: 6120,
        ctr: 3.09,
        conversions: 215,
        cpa: 12.98,
        roas: 4.88,
        headline: "How 450+ Companies Scale Pipeline on Autopilot",
        primaryText: "Swipe up to discover how modern revenue teams generate qualified meetings without hiring expensive SDR teams.",
        cta: "Learn More",
        targetAudience: "Lookalike 1% of Top Paying Clients (North America & Europe)",
        startDate: "2026-10-14",
        createdFromAI: true
    },
    {
        id: "goog-camp-02",
        name: "Google PMax - Global Omnichannel Expansion",
        platform: "google",
        format: "google_pmax",
        status: "active",
        objective: "Conversions",
        dailyBudget: 300,
        spent: 4210,
        impressions: 345000,
        clicks: 9480,
        ctr: 2.75,
        conversions: 362,
        cpa: 11.63,
        roas: 4.42,
        headline: "Spectra AI Sales Agents | Scale Deals Faster",
        primaryText: "Harness AI to book meetings around the clock. Automated deliverability, inbox warmup, and WhatsApp workflows.",
        cta: "Get Started Now",
        targetAudience: "In-market B2B Tech Buyers & Enterprise Sales Tools",
        startDate: "2026-10-18"
    },
    {
        id: "meta-camp-03",
        name: "Meta Feed - Black Friday Early VIP Offer",
        platform: "meta",
        format: "facebook_feed",
        status: "paused",
        objective: "Sales",
        dailyBudget: 150,
        spent: 650,
        impressions: 48000,
        clicks: 1450,
        ctr: 3.02,
        conversions: 48,
        cpa: 13.54,
        roas: 4.10,
        headline: "Limited Early Access: 40% Off Annual Enterprise Tier",
        primaryText: "Lock in lifetime pricing on the unified outreach platform that replaced 4 disparate sales tools.",
        cta: "Claim Offer",
        targetAudience: "Website Visitors 30 Days (Custom Retargeting Audience)",
        startDate: "2026-10-22",
        createdFromAI: true
    }
];

export const ADS_SPEND_CHART_DATA = [
    { date: "Oct 15", metaSpend: 310, googleSpend: 420, totalSpend: 730, conversions: 62, revenue: 3420 },
    { date: "Oct 16", metaSpend: 340, googleSpend: 460, totalSpend: 800, conversions: 71, revenue: 3950 },
    { date: "Oct 17", metaSpend: 390, googleSpend: 490, totalSpend: 880, conversions: 80, revenue: 4320 },
    { date: "Oct 18", metaSpend: 430, googleSpend: 540, totalSpend: 970, conversions: 92, revenue: 4980 },
    { date: "Oct 19", metaSpend: 480, googleSpend: 580, totalSpend: 1060, conversions: 104, revenue: 5410 },
    { date: "Oct 20", metaSpend: 520, googleSpend: 610, totalSpend: 1130, conversions: 112, revenue: 5920 },
    { date: "Oct 21", metaSpend: 560, googleSpend: 650, totalSpend: 1210, conversions: 118, revenue: 6350 },
    { date: "Oct 22", metaSpend: 610, googleSpend: 690, totalSpend: 1300, conversions: 126, revenue: 6810 },
    { date: "Oct 23", metaSpend: 590, googleSpend: 710, totalSpend: 1300, conversions: 130, revenue: 6990 },
    { date: "Oct 24", metaSpend: 640, googleSpend: 740, totalSpend: 1380, conversions: 138, revenue: 7350 },
    { date: "Oct 25", metaSpend: 680, googleSpend: 770, totalSpend: 1450, conversions: 145, revenue: 7890 },
    { date: "Oct 26", metaSpend: 710, googleSpend: 820, totalSpend: 1530, conversions: 154, revenue: 8420 },
    { date: "Oct 27", metaSpend: 750, googleSpend: 850, totalSpend: 1600, conversions: 162, revenue: 8910 },
    { date: "Oct 28", metaSpend: 780, googleSpend: 880, totalSpend: 1660, conversions: 169, revenue: 9240 },
];

export const SAMPLE_AI_PRESETS = [
    {
        name: "Spectra AI Automation",
        objective: "Conversions",
        productName: "Spectra Sales Suite",
        description: "AI-driven omnichannel sales platform combining cold email warmup, automated WhatsApp engagement, and CRM contact synchronization.",
        audience: "B2B Founders, VP of Sales, Demand Gen Agencies, RevOps Leaders",
        tone: "Direct Response & High Converting",
        cta: "Start Free Trial"
    },
    {
        name: "High-Ticket Real Estate",
        objective: "Lead Generation",
        productName: "Elysian Palm Residences",
        description: "Ultra-luxury waterfront villas with private private berths and 14% projected annual yields in Dubai Marina.",
        audience: "HNW Individuals, International Property Investors, Expats",
        tone: "Exclusive & Prestigious",
        cta: "Download Brochure"
    },
    {
        name: "SaaS Cold Email Tool",
        objective: "Conversions",
        productName: "InboxMax AI",
        description: "Never land in spam again. AI rotate multiple domains and automated mailbox ramp-up with guaranteed 98% inbox placement.",
        audience: "Outbound SDRs, Growth Hackers, Digital Marketing Agencies",
        tone: "Urgent & High Energy",
        cta: "Get 50% Off First Month"
    }
];
