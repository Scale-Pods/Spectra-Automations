"use client";

import React, { useState } from "react";
import { 
    Heart, 
    MessageCircle, 
    Send, 
    Bookmark, 
    Share2, 
    MoreHorizontal, 
    ExternalLink, 
    ChevronLeft, 
    ChevronRight,
    Wind,
    ShieldCheck,
    CheckCircle2,
    Volume2,
    Play,
    Pause,
    PhoneCall,
    Sparkles
} from "lucide-react";

interface SpectraCreativePreviewProps {
    format: 'image' | 'video' | 'carousel' | 'story';
    headline: string;
    caption: string;
    prompt: string;
    serviceName: string;
    resolution: string;
    audio?: string;
    cta?: string;
    discount?: string;
    location?: string;
}

export function SpectraCreativePreview({
    format,
    headline,
    caption,
    prompt,
    serviceName,
    resolution,
    audio,
    cta = "WhatsApp Us for Instant Quote",
    discount = "AED 199 AC Deep Clean Special",
    location = "Dubai Marina, Palm Jumeirah & Dubai Hills"
}: SpectraCreativePreviewProps) {
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    const carouselSlides = [
        {
            tag: "Problem",
            title: "Is Your Dubai AC Blowing Dusty or Weak Air?",
            sub: "In Dubai's extreme heat, clogged condenser coils and dusty ducts force your AC compressor to work 40% harder.",
            gradient: "from-amber-900 via-rose-950 to-slate-900",
            stat: "DEWA Bills Surge 25%+"
        },
        {
            tag: "The Solution",
            title: "Spectra AC Deep Pressure Coil Wash & Disinfection",
            sub: "Our certified HVAC engineers flush out years of stubborn sand, grease, and microbial mold using hospital-grade biocides.",
            gradient: "from-blue-900 via-indigo-950 to-slate-900",
            stat: "100% Guaranteed Ice-Cold Air"
        },
        {
            tag: "Before & After",
            title: "Breathe Clean, Odor-Free Air in 60 Minutes",
            sub: "Experience immediate relief from morning allergies and stale room odors with our complete duct sanitization.",
            gradient: "from-teal-900 via-cyan-950 to-slate-900",
            stat: "Sub-21°C Room Temp in 15 Mins"
        },
        {
            tag: "Limited Offer",
            title: discount,
            sub: "Includes free gas pressure check, electrical amp check, and 30-day cooling warranty. Zero hidden charges.",
            gradient: "from-violet-900 via-purple-950 to-slate-900",
            stat: "Available in All Dubai Communities"
        }
    ];

    // 1. REEL / SHORT-FORM VIDEO PREVIEW (9:16)
    if (format === 'video') {
        return (
            <div className="relative w-full max-w-[320px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-slate-950 border-4 border-slate-900 shadow-2xl font-sans flex flex-col justify-between text-white p-4 select-none">
                {/* Background Simulated Video Scene */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 opacity-90 z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent z-0 pointer-events-none" />

                {/* Top Overlay */}
                <div className="relative z-10 flex items-center justify-between text-xs pt-2">
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold text-[11px]">Reels · 9:16</span>
                    </div>

                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-all text-white border border-white/10"
                    >
                        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white ml-0.5" />}
                    </button>
                </div>

                {/* Center Dynamic Video Graphic */}
                <div className="relative z-10 space-y-3 text-center my-auto px-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-bold uppercase tracking-wider">
                        <Wind className="h-3 w-3" />
                        Spectra AC Airflow Tech
                    </div>

                    <div className="relative p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-sky-200 font-semibold">
                            <span>Dubai Villa AC Service</span>
                            <span className="text-emerald-400 font-mono">19°C Ice Cold</span>
                        </div>
                        <h4 className="text-sm font-bold leading-tight">
                            {headline || "Emergency AC Repair & Deep Coil Clean in 45 Mins"}
                        </h4>
                        <p className="text-[11px] text-white/80 line-clamp-2">
                            {prompt.slice(0, 100)}...
                        </p>
                    </div>

                    {discount && (
                        <div className="inline-block px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 font-extrabold text-[11px] shadow-lg">
                            🔥 {discount}
                        </div>
                    )}
                </div>

                {/* Right Side Social Floating Icons */}
                <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-4 text-white text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:text-rose-500 transition-colors">
                            <Heart className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] mt-1 font-semibold">2.4k</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                            <MessageCircle className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] mt-1 font-semibold">142</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                            <Send className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] mt-1 font-semibold">Share</span>
                    </div>
                </div>

                {/* Bottom Profile, Caption & CTA */}
                <div className="relative z-10 space-y-2.5 pr-12 pb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold border border-white/30">
                            S
                        </div>
                        <span className="text-xs font-bold">spectradubai</span>
                        <CheckCircle2 className="h-3 w-3 text-sky-400 fill-sky-400 text-white" />
                        <span className="text-[10px] text-white/70">· Sponsored</span>
                    </div>

                    <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                        {caption}
                    </p>

                    {/* Audio Bar Indicator */}
                    <div className="flex items-center gap-2 text-[10px] text-white/70">
                        <Volume2 className="h-3 w-3 text-sky-400" />
                        <span className="truncate">{audio || "Modern & Upbeat Commercial"}</span>
                    </div>

                    {/* WhatsApp Direct CTA Button */}
                    <div className="pt-1">
                        <button className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-slate-950 flex items-center justify-center gap-1.5 shadow-lg transition-all">
                            <span>💬 {cta}</span>
                            <ExternalLink className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. STORY FULL SCREEN AD (9:16)
    if (format === 'story') {
        return (
            <div className="relative w-full max-w-[320px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-slate-950 border-4 border-slate-900 shadow-2xl font-sans flex flex-col justify-between text-white p-4 select-none">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent z-0" />

                {/* Story Top Progress Bars */}
                <div className="relative z-10 space-y-2 pt-1">
                    <div className="grid grid-cols-3 gap-1">
                        <div className="h-1 rounded-full bg-white" />
                        <div className="h-1 rounded-full bg-white/40" />
                        <div className="h-1 rounded-full bg-white/40" />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
                                S
                            </div>
                            <div>
                                <span className="text-xs font-bold block leading-none">Spectra Dubai</span>
                                <span className="text-[10px] text-white/70">Sponsored</span>
                            </div>
                        </div>
                        <MoreHorizontal className="h-4 w-4 text-white/70" />
                    </div>
                </div>

                {/* Story Main Visual Creative */}
                <div className="relative z-10 my-auto text-center space-y-3 px-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-rose-500/90 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-md">
                        24/7 Rapid Response Dubai
                    </span>

                    <h3 className="text-xl font-extrabold leading-tight drop-shadow-md text-white">
                        {headline || "AC Leaking or Not Cooling? We Arrive in 45 Mins."}
                    </h3>

                    <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs text-white/90 space-y-2">
                        <div className="flex items-center justify-around text-center border-b border-white/10 pb-2">
                            <div>
                                <div className="font-bold text-emerald-400">0 Callout Fee</div>
                                <div className="text-[9px] text-white/70">With Any Repair</div>
                            </div>
                            <div className="h-6 w-[1px] bg-white/20" />
                            <div>
                                <div className="font-bold text-sky-400">All Dubai</div>
                                <div className="text-[9px] text-white/70">Villas & Flats</div>
                            </div>
                        </div>
                        <p className="text-[11px] text-white/80 line-clamp-3 leading-relaxed">
                            {caption}
                        </p>
                    </div>
                </div>

                {/* Story Bottom Swipe Up / WhatsApp CTA */}
                <div className="relative z-10 text-center space-y-2 pt-2">
                    <button className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold text-xs text-slate-950 flex items-center justify-center gap-2 shadow-xl">
                        <span>💬 {cta}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[10px] text-white/60 block">
                        Direct WhatsApp to Licensed Dubai HVAC Engineers
                    </span>
                </div>
            </div>
        );
    }

    // 3. CAROUSEL MULTI-SLIDE PREVIEW (1:1 / 4:5)
    if (format === 'carousel') {
        const slide = carouselSlides[carouselIndex];
        return (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm max-w-sm mx-auto overflow-hidden font-sans">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                            S
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-900">spectradubai</span>
                                <CheckCircle2 className="h-3 w-3 text-sky-500 fill-sky-500 text-white" />
                            </div>
                            <span className="text-[10px] text-slate-400 block leading-tight">Sponsored · Carousel</span>
                        </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {carouselIndex + 1} / {carouselSlides.length}
                    </span>
                </div>

                {/* Active Carousel Slide Visual */}
                <div className={`relative aspect-square bg-gradient-to-br ${slide.gradient} p-5 flex flex-col justify-between text-white select-none`}>
                    <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
                            Slide {carouselIndex + 1}: {slide.tag}
                        </span>
                        <span className="text-[10px] font-mono bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-sky-300 font-semibold">
                            {slide.stat}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-base sm:text-lg font-bold leading-tight drop-shadow">
                            {slide.title}
                        </h4>
                        <p className="text-xs text-white/80 leading-relaxed">
                            {slide.sub}
                        </p>
                    </div>

                    {/* Carousel Nav Arrow Buttons */}
                    <div className="flex items-center justify-between pt-2">
                        <button
                            onClick={() => setCarouselIndex((prev) => (prev > 0 ? prev - 1 : carouselSlides.length - 1))}
                            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1">
                            {carouselSlides.map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                                        i === carouselIndex ? 'w-4 bg-white' : 'bg-white/40'
                                    }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => setCarouselIndex((prev) => (prev < carouselSlides.length - 1 ? prev + 1 : 0))}
                            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* CTA Action Banner */}
                <div className="bg-slate-900 text-white p-2.5 px-4 flex items-center justify-between text-xs font-semibold">
                    <span>{cta}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                </div>

                {/* Caption & Interaction */}
                <div className="p-3 space-y-1.5 text-xs">
                    <p className="text-slate-800 leading-relaxed">
                        <span className="font-bold mr-1.5">spectradubai</span>
                        {caption}
                    </p>
                    <div className="text-[10px] text-violet-600 font-medium">
                        #ACMaintenanceDubai #DubaiVillas #PalmJumeirah #DubaiPropertyMaintenance
                    </div>
                </div>
            </div>
        );
    }

    // 4. DEFAULT: SINGLE AD IMAGE (1:1 / 4:5 FEED POST)
    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm max-w-sm mx-auto overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        S
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">Spectra Dubai</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[11px] font-semibold text-violet-600">Follow</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">Sponsored · Property Maintenance</span>
                    </div>
                </div>
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </div>

            {/* Caption (Above Image for Facebook / or standard) */}
            <div className="p-3 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                {caption}
            </div>

            {/* Simulated Ad Image Creative */}
            <div className="relative aspect-square bg-gradient-to-br from-slate-950 via-sky-950 to-indigo-950 p-5 flex flex-col justify-between text-white overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400/25 via-transparent to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                        <Wind className="h-3 w-3 text-sky-300" />
                        AC Deep Clean
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                        {discount}
                    </span>
                </div>

                <div className="relative z-10 space-y-2">
                    <h3 className="text-lg font-extrabold leading-snug drop-shadow-md">
                        {headline || "Ice-Cold Air & Zero Dust In Your Dubai Villa"}
                    </h3>
                    <p className="text-xs text-sky-100/80 line-clamp-2">
                        {location}
                    </p>
                </div>
            </div>

            {/* Link Preview Bar */}
            <div className="bg-slate-50 p-3 flex items-center justify-between border-t border-slate-200/80 gap-3">
                <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block truncate">
                        spectradubai.com
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                        {headline || "Book Certified Dubai AC Servicing"}
                    </h5>
                    <p className="text-[10px] text-slate-500 truncate">
                        24/7 Dubai Emergency Response · Municipality Certified
                    </p>
                </div>
                <button className="flex-shrink-0 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1">
                    <span>💬 WhatsApp</span>
                </button>
            </div>
        </div>
    );
}
