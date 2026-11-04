export interface MaintenanceService {
    id: string;
    name: string;
    icon: string;
    tagline: string;
    description: string;
}

export const DUBAI_MAINTENANCE_SERVICES: MaintenanceService[] = [
    {
        id: "ac-servicing",
        name: "AC Deep Servicing & Coil Cleaning",
        icon: "Wind",
        tagline: "Beat Dubai's 45°C Heat with Ice-Cold Air",
        description: "Complete pressure washing of condenser coils, gas top-up, filter disinfection, and electrical check."
    },
    {
        id: "duct-cleaning",
        name: "Duct Cleaning & Sanitization",
        icon: "Sparkles",
        tagline: "Breathe Clean, Mold-Free Air in Your Villa",
        description: "Robotic duct brushing, HEPA vacuuming, and eco-friendly antimicrobial fogging for villas & flats."
    },
    {
        id: "amc-contract",
        name: "Annual Maintenance Contract (AMC)",
        icon: "ShieldCheck",
        tagline: "365-Day Worry-Free Villa & Apartment Care",
        description: "Unlimited 24/7 callouts, scheduled quarterly AC tune-ups, plumbing, electrical, and handyman support."
    },
    {
        id: "emergency-repair",
        name: "24/7 Emergency AC Breakdown",
        icon: "AlertTriangle",
        tagline: "On-Site within 45 Minutes Anywhere in Dubai",
        description: "Rapid response emergency team for sudden cooling loss, water leakages, or electrical tripping."
    },
    {
        id: "plumbing-electrical",
        name: "Plumbing & Water Tank Cleaning",
        icon: "Wrench",
        tagline: "Municipality-Approved Tank Disinfection",
        description: "Pipeline leak detection, water pump overhauls, heater replacements, and certified villa tank cleaning."
    },
    {
        id: "fitout-painting",
        name: "Painting, Handyman & Renovation",
        icon: "Paintbrush",
        tagline: "Premium Interior Finish for Dubai Homes",
        description: "Villa repainting, water damage restoration, silicone resealing, carpentry, and handyman repairs."
    }
];

export const DUBAI_LOCATIONS = [
    "Palm Jumeirah",
    "Dubai Marina & JBR",
    "Downtown Dubai & Business Bay",
    "Dubai Hills Estate",
    "Arabian Ranches 1, 2 & 3",
    "Emirates Hills & The Springs",
    "Jumeirah Golf Estates (JGE)",
    "Damac Hills",
    "Jumeirah Islands & JLT",
    "Al Barsha & Um Suqeim",
    "Mirdif & Meydan",
    "All Dubai Areas"
];

export const CREATIVE_FORMATS = [
    {
        id: "image",
        label: "Single Ad Image",
        description: "High-impact visual post for feed or sponsored display",
        badge: "Meta & Google",
        aspect: "1:1 / 4:5"
    },
    {
        id: "video",
        label: "Short-Form Video / Reel",
        description: "Fast-paced reel or TikTok with hooks, music, and subtitles",
        badge: "Instagram & TikTok",
        aspect: "9:16"
    },
    {
        id: "carousel",
        label: "Educational Carousel",
        description: "Multi-slide breakdown (Before/After, 5 Warning Signs, AMC Plans)",
        badge: "Instagram & FB",
        aspect: "1:1 / 4:5"
    },
    {
        id: "story",
        label: "Full-Screen Story Ad",
        description: "Swipe-up / Click to WhatsApp high-urgency vertical creative",
        badge: "IG, FB & Snapchat",
        aspect: "9:16"
    }
];

export const RESOLUTIONS = [
    { id: "1080x1080", label: "1:1 Square (1080x1080)", desc: "Feed Posts & Display", forImage: true, forVideo: false },
    { id: "1080x1350", label: "4:5 Portrait (1080x1350)", desc: "Instagram Sponsored Feed (Highest CTR)", forImage: true, forVideo: false },
    { id: "1920x1080", label: "16:9 Landscape (1920x1080)", desc: "Web Banner & Display Ads", forImage: true, forVideo: true },
    { id: "1080x1920", label: "9:16 Vertical (1080x1920)", desc: "Reels, Stories & TikTok", forImage: false, forVideo: true }
];

export const IMAGE_RESOLUTIONS = [
    { id: "1080x1350", label: "4:5 Portrait (1080x1350)", desc: "Recommended · Instagram & Facebook Feed", recommended: true },
    { id: "1080x1080", label: "1:1 Square (1080x1080)", desc: "Standard Feed & Google Display" },
    { id: "1920x1080", label: "16:9 Landscape (1920x1080)", desc: "Google Display, Web Banners & Facebook Link Ads" }
];

export const VIDEO_RESOLUTIONS = [
    { id: "1080x1920", label: "9:16 Vertical (1080x1920)", desc: "Recommended · Instagram Reels, Stories & TikTok", recommended: true },
    { id: "1920x1080", label: "16:9 Horizontal (1920x1080)", desc: "YouTube & In-Feed Video" }
];

export const IMAGE_STYLES = [
    { id: "photorealistic", label: "Photorealistic Commercial", desc: "Ultra-crisp 8K photography in luxury Dubai interiors", badge: "Most Popular" },
    { id: "before_after", label: "Before & After Split", desc: "Side-by-side high-contrast dirty vs sanitized comparison", badge: "High Conversion" },
    { id: "architectural", label: "Architectural 3D Render", desc: "Modern architectural view with glowing cool cyan airflow lines", badge: "Premium Tech" },
    { id: "action_shot", label: "Technician in Action", desc: "Certified Spectra HVAC engineer performing precision maintenance", badge: "Trust Building" }
];

export const IMAGE_LIGHTING_OPTIONS = [
    { id: "villa_daylight", label: "Bright Dubai Villa Daylight", desc: "Natural golden sunlight through floor-to-ceiling glass" },
    { id: "cool_cyan", label: "Cool Ice-Blue & Cyan Accent", desc: "High-tech refreshing cooling aesthetic" },
    { id: "studio_clean", label: "Commercial Studio Lighting", desc: "High-contrast, razor-sharp details and zero clutter" },
    { id: "golden_hour", label: "Warm Sunset / Golden Hour", desc: "Luxury ambient warm glow over Dubai skyline" }
];

export const AUDIO_OPTIONS = [
    { id: "energetic_tech", label: "Modern & Upbeat Commercial", category: "Music" },
    { id: "arabic_chill", label: "Subtle Arabian Ambient Lo-Fi", category: "Music" },
    { id: "cinematic_reveal", label: "Cinematic Dramatic Reveal (Before/After)", category: "Music" },
    { id: "chill_acoustic", label: "Warm Lifestyle & Family Home", category: "Music" },
    { id: "none", label: "No Music / Silent (Ad Graphics)", category: "Mute" }
];

export const VOICEOVER_OPTIONS = [
    { id: "uae_english", label: "Dubai / UAE Neutral English (Warm, Professional)" },
    { id: "british_english", label: "British RP English (Authoritative, Premium)" },
    { id: "arabic_khaliji", label: "Gulf Arabic (خليجي - Local UAE Resonance)" },
    { id: "american_english", label: "American English (Direct Response, Punchy)" },
    { id: "none", label: "No Voiceover (Music / Visual Text Only)" }
];

export interface StudioModelOption {
    id: string;
    name: string;
    provider: 'openai' | 'google';
    desc: string;
    priceEst: string;
    priceUsd: number;
    priceAed: number;
    priceInr?: number;
    badge?: string;
    maxVariants: number;
}

export const STUDIO_AI_MODELS: StudioModelOption[] = [
    // OpenAI Models
    {
        id: "gpt-image-1-mini",
        name: "OpenAI · gpt-image-1-mini",
        provider: "openai",
        desc: "Cheapest OpenAI option. Good for quick drafts.",
        priceEst: "~$0.008 (AED 0.03) / image (est.)",
        priceUsd: 0.008,
        priceAed: 0.03,
        priceInr: 0.03,
        maxVariants: 4
    },
    {
        id: "gpt-image-1",
        name: "OpenAI · gpt-image-1",
        provider: "openai",
        desc: "Reliable all-rounder. Strong at diagrams and clean graphic work.",
        priceEst: "~$0.042 (AED 0.15) / image (est.)",
        priceUsd: 0.042,
        priceAed: 0.15,
        priceInr: 0.15,
        badge: "Popular",
        maxVariants: 4
    },
    {
        id: "gpt-image-1.5",
        name: "OpenAI · gpt-image-1.5",
        provider: "openai",
        desc: "Between gpt-image-1 and the newest gpt-image-2.",
        priceEst: "~$0.034 (AED 0.12) / image (est.)",
        priceUsd: 0.034,
        priceAed: 0.12,
        priceInr: 0.12,
        maxVariants: 4
    },
    {
        id: "gpt-image-2",
        name: "OpenAI · gpt-image-2",
        provider: "openai",
        desc: "OpenAI's newest image model — cheaper per token than gpt-image-1 despite being newer.",
        priceEst: "~$0.032 (AED 0.12) / image (est.)",
        priceUsd: 0.032,
        priceAed: 0.12,
        priceInr: 0.12,
        badge: "Newest",
        maxVariants: 4
    },

    // Google Models ("Nano Banana" family)
    {
        id: "gemini-2.5-flash-image",
        name: "Google · Gemini 2.5 Flash Image",
        provider: "google",
        desc: "\"Nano Banana\" — the original. Google now recommends the Lite successor instead.",
        priceEst: "~$0.039 (AED 0.14) / image (est.)",
        priceUsd: 0.039,
        priceAed: 0.14,
        priceInr: 0.14,
        maxVariants: 1
    },
    {
        id: "gemini-flash-image",
        name: "Google · Gemini Flash Image",
        provider: "google",
        desc: "Fast, cheap, strong prompt following (\"Nano Banana 2 Lite\").",
        priceEst: "~$0.034 (AED 0.12) / image (est.)",
        priceUsd: 0.034,
        priceAed: 0.12,
        priceInr: 0.12,
        badge: "Recommended",
        maxVariants: 1
    },
    {
        id: "gemini-3.1-flash-image",
        name: "Google · Gemini 3.1 Flash Image",
        provider: "google",
        desc: "\"Nano Banana 2\" — newer and pricier than the Lite version above.",
        priceEst: "~$0.067 (AED 0.25) / image (est.)",
        priceUsd: 0.067,
        priceAed: 0.25,
        priceInr: 0.25,
        maxVariants: 1
    },
    {
        id: "gemini-3-pro-image",
        name: "Google · Gemini 3 Pro Image",
        provider: "google",
        desc: "\"Nano Banana Pro\" — best quality in the family, up to 4K.",
        priceEst: "~$0.134 (AED 0.49) / image (est.)",
        priceUsd: 0.134,
        priceAed: 0.49,
        priceInr: 0.49,
        badge: "Up to 4K",
        maxVariants: 1
    }
];

export interface VideoModelOption {
    id: 'veo-3.1-fast' | 'veo-3.1-lite' | 'veo-3.1-standard';
    name: string;
    provider: string;
    desc: string;
    badge?: string;
    ratesUsd: {
        '720p': number;
        '1080p': number;
        '4k': number;
    };
}

export const VIDEO_AI_MODELS: VideoModelOption[] = [
    {
        id: 'veo-3.1-fast',
        name: 'Google · Veo 3.1 Fast',
        provider: 'google',
        desc: 'Balanced high-velocity rendering with rich cinematic camera control.',
        badge: 'Recommended',
        ratesUsd: { '720p': 0.10, '1080p': 0.12, '4k': 0.30 }
    },
    {
        id: 'veo-3.1-lite',
        name: 'Google · Veo 3.1 Lite',
        provider: 'google',
        desc: 'Cost-optimized for social reels, quick story variations & rapid storyboards.',
        badge: 'Lowest Cost',
        ratesUsd: { '720p': 0.06, '1080p': 0.08, '4k': 0.20 }
    },
    {
        id: 'veo-3.1-standard',
        name: 'Google · Veo 3.1 Standard',
        provider: 'google',
        desc: 'Maximum cinematic fidelity, fluid real-world physics and fine depth of field.',
        badge: 'Highest Quality',
        ratesUsd: { '720p': 0.40, '1080p': 0.40, '4k': 0.60 }
    }
];

export function calculateVideoJobCost(
    engine: 'veo-3.1-fast' | 'veo-3.1-lite' | 'veo-3.1-standard' = 'veo-3.1-fast',
    resolution: '720p' | '1080p' | '4k' = '1080p',
    shotCount: number = 3,
    durationS: number = 4
) {
    const model = VIDEO_AI_MODELS.find(m => m.id === engine) || VIDEO_AI_MODELS[0];
    const rateUsd = model.ratesUsd[resolution] ?? 0.12;
    const totalDurationS = Math.max(shotCount, 1) * Math.max(durationS, 1);
    const totalUsd = +(totalDurationS * rateUsd).toFixed(2);
    const totalAed = +(totalUsd * 3.6725).toFixed(2);
    const rateAed = +(rateUsd * 3.6725).toFixed(2);
    return {
        rateUsd,
        rateAed,
        totalDurationS,
        totalUsd,
        totalAed,
        formattedRate: `$${rateUsd.toFixed(2)} (AED ${rateAed.toFixed(2)})/s`,
        formattedTotal: `$${totalUsd.toFixed(2)} (AED ${totalAed.toFixed(2)})`,
        modelName: model.name
    };
}

export function getModelCost(modelId?: string) {
    const found = STUDIO_AI_MODELS.find(m => m.id === modelId) || STUDIO_AI_MODELS[1]; // default gpt-image-1
    return {
        priceUsd: found.priceUsd,
        priceAed: found.priceAed,
        priceInr: found.priceAed,
        priceEst: found.priceEst,
        name: found.name,
        provider: found.provider
    };
}

export function calculateJobCost(modelId?: string, imageCount: number = 1) {
    const cost = getModelCost(modelId);
    const count = Math.max(Number(imageCount) || 1, 1);
    const totalUsd = +(count * cost.priceUsd).toFixed(3);
    const totalAed = +(count * cost.priceAed).toFixed(2);
    return {
        perImageUsd: cost.priceUsd,
        perImageAed: cost.priceAed,
        perImageInr: cost.priceAed,
        totalUsd,
        totalAed,
        totalInr: totalAed,
        formattedPerImage: `$${cost.priceUsd.toFixed(3)} (AED ${cost.priceAed.toFixed(2)})`,
        formattedTotal: `$${totalUsd.toFixed(3)} (AED ${totalAed.toFixed(2)})`,
        count,
        modelName: cost.name,
        provider: cost.provider
    };
}

export const SPECTRA_DUBAI_PRESETS = [
    {
        name: "Summer AC Deep Clean Special",
        format: "image",
        serviceId: "ac-servicing",
        prompt: "Show a luxurious Dubai villa living room with floor-to-ceiling glass looking out at Burj Khalifa or Palm Jumeirah. In the center, high-tech glowing clean cool air flows from a pristine concealed AC vent. Include a subtle split showing dirty clogged filters vs sparkling clean sanitized cooling coils. Text overlay: 'Beat Dubai Summer: 40% Off AC Deep Servicing + Free Gas Check'.",
        platforms: ["instagram", "facebook", "google"],
        resolution: "1080x1350",
        imageStyle: "photorealistic",
        imageLighting: "villa_daylight",
        cta: "WhatsApp Us for Free AC Inspection",
        discount: "AED 199 Special (Was AED 350)"
    },
    {
        name: "Before/After Clogged AC Coil Split",
        format: "image",
        serviceId: "ac-servicing",
        prompt: "High-contrast commercial split photo. Left: filthy clogged Dubai AC coil choked with desert dust, mold, and humidity sludge with red warning badge 'DEWA Bill Spiking'. Right: gleaming silver sanitized coil treated with hospital-grade antimicrobial wash with green badge 'Ice-Cold 19.5°C Airflow'. Sharp 8k macro photography.",
        platforms: ["instagram", "facebook"],
        resolution: "1080x1080",
        imageStyle: "before_after",
        imageLighting: "cool_cyan",
        cta: "Book Chemical Coil Wash",
        discount: "AED 199 Chemical Coil Clean"
    },
    {
        name: "Villa AMC Peace of Mind Video Reel",
        format: "video",
        serviceId: "amc-contract",
        prompt: "Fast-paced, high-energy 15-second reel starting with a homeowner in Arabian Ranches sweating over a leaking AC ceiling, then cutting to professional Spectra Dubai technicians in smart branded navy uniforms arriving in a branded van with specialized gear. Quick satisfaction shots: clean ducts, ice-cold thermostat showing 21°C, happy family relaxing. End with Spectra Dubai AMC gold warranty shield.",
        platforms: ["instagram", "facebook", "tiktok"],
        resolution: "1080x1920",
        audio: "cinematic_reveal",
        voiceover: "british_english",
        cta: "Download Villa AMC Packages",
        discount: "Get 2 Months Free on Annual Contracts"
    },
    {
        name: "5 Signs Your AC Has Mold Carousel",
        format: "carousel",
        serviceId: "duct-cleaning",
        prompt: "5-slide educational swipe carousel. Slide 1: 'Does your Dubai home smell dusty when AC turns on?' Slide 2: Real macro photo of mold inside dark duct vs sanitized silver duct. Slide 3: Symptoms: morning allergies, sneezing, rising DEWA electricity bills. Slide 4: Spectra's 4-step medical grade duct fogging. Slide 5: WhatsApp QR code + 24/7 Dubai booking hotline.",
        platforms: ["instagram", "facebook"],
        resolution: "1080x1080",
        imageStyle: "photorealistic",
        imageLighting: "studio_clean",
        cta: "Book Duct Sanitization",
        discount: "Free Indoor Air Quality Test with Booking"
    },
    {
        name: "24/7 Emergency AC Breakdown Story",
        format: "story",
        serviceId: "emergency-repair",
        prompt: "High-urgency full screen story. Flashing subtle siren indicator: 'AC Stopped Cooling at Night in Dubai?' Bold headline: 'Spectra Emergency Response - At Your Door in 45 Mins Anywhere in Dubai'. Quick trust badges: Certified HVAC Engineers, 100% Genuine Spare Parts, Guaranteed Cold Air Tonight. Big green button: 'Tap to WhatsApp Technician Now'.",
        platforms: ["instagram", "facebook", "snapchat"],
        resolution: "1080x1920",
        audio: "energetic_tech",
        voiceover: "uae_english",
        cta: "Emergency WhatsApp Dispatch",
        discount: "Zero Callout Fee with Repair"
    },
    {
        name: "Water Tank Disinfection & Plumbing",
        format: "image",
        serviceId: "plumbing-electrical",
        prompt: "High-end commercial photo of villa rooftop water tank inspection in Dubai. Certified Spectra technician in safety gear testing crystalline pure drinking water with digital clarity tester. Background shows Dubai Marina skyline. Text overlay: 'Municipality-Approved Villa Water Tank Deep Cleaning - Free Water Quality Test'.",
        platforms: ["instagram", "facebook", "whatsapp"],
        resolution: "1080x1350",
        imageStyle: "action_shot",
        imageLighting: "golden_hour",
        cta: "Schedule Villa Tank Cleaning",
        discount: "AED 399 Villa Tank Disinfection"
    }
];
