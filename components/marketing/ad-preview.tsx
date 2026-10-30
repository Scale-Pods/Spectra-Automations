"use client";

import React, { useState } from "react";
import { 
    ThumbsUp, 
    MessageCircle, 
    Share2, 
    MoreHorizontal, 
    Globe, 
    ExternalLink, 
    Heart, 
    Bookmark, 
    Send,
    Search,
    CheckCircle2
} from "lucide-react";

interface AdPreviewProps {
    platform: 'meta' | 'instagram' | 'google';
    headline: string;
    primaryText: string;
    description?: string;
    cta?: string;
    brandName?: string;
    displayUrl?: string;
}

export function AdPreview({
    platform,
    headline,
    primaryText,
    description = "Transform your sales outreach with intelligent omnichannel automation.",
    cta = "Learn More",
    brandName = "Spectra Automation",
    displayUrl = "spectradubai.com"
}: AdPreviewProps) {
    const [expanded, setExpanded] = useState(false);

    if (platform === 'google') {
        return (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm max-w-xl mx-auto font-sans">
                {/* Search query header simulation */}
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 text-xs text-slate-400">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <span>Google Search Result Preview</span>
                </div>

                {/* Google SERP Card */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">Sponsored</span>
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-white text-[9px] font-bold">
                                S
                            </div>
                            <span className="font-medium text-slate-800">{brandName}</span>
                            <span className="text-slate-400">https://www.{displayUrl}</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <h3 className="text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                        {headline || "Spectra AI Sales Automation | #1 Omnichannel Growth Platform"}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[#4d5156] leading-relaxed">
                        {description || primaryText?.slice(0, 160) || "Cut manual outreach by 80%. Automated WhatsApp + Email campaigns that convert leads into confirmed meetings on autopilot."}
                    </p>

                    {/* Sitelinks Extensions */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-slate-100">
                        <div>
                            <span className="text-xs font-medium text-[#1a0dab] hover:underline cursor-pointer block">
                                🚀 Free 14-Day Trial
                            </span>
                            <span className="text-[11px] text-slate-500">Test all AI outreach features free.</span>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-[#1a0dab] hover:underline cursor-pointer block">
                                📊 Enterprise Case Studies
                            </span>
                            <span className="text-[11px] text-slate-500">See 4.8x average ROAS results.</span>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-[#1a0dab] hover:underline cursor-pointer block">
                                💬 WhatsApp CRM Sync
                            </span>
                            <span className="text-[11px] text-slate-500">Two-way verified Meta dialogue.</span>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-[#1a0dab] hover:underline cursor-pointer block">
                                ⚡ Live Product Demo
                            </span>
                            <span className="text-[11px] text-slate-500">Book instant 15-min walkthrough.</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (platform === 'instagram') {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm max-w-sm mx-auto overflow-hidden font-sans">
                {/* IG Top Header */}
                <div className="flex items-center justify-between p-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-violet-700 text-xs">
                                S
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-900">{brandName.toLowerCase().replace(/\s+/g, '')}</span>
                                <CheckCircle2 className="h-3 w-3 text-sky-500 fill-sky-500 text-white" />
                            </div>
                            <span className="text-[10px] text-slate-400 block leading-tight">Sponsored</span>
                        </div>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </div>

                {/* IG Creative Visual */}
                <div className="relative aspect-[4/5] bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-950 flex flex-col justify-end p-5 text-white">
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white/90">
                        1/3
                    </div>
                    <div className="space-y-2 z-10">
                        <span className="px-2.5 py-1 rounded-full bg-violet-500/80 backdrop-blur-md text-[10px] font-semibold uppercase tracking-wider">
                            AI Automation
                        </span>
                        <h4 className="text-xl font-bold leading-tight drop-shadow-md">
                            {headline || "Double Your Qualified Meetings In 30 Days"}
                        </h4>
                        <p className="text-xs text-white/80 line-clamp-2">
                            {description}
                        </p>
                    </div>
                </div>

                {/* IG Call to Action Bar */}
                <div className="bg-violet-600 hover:bg-violet-700 transition-colors p-2.5 flex items-center justify-between text-white text-xs font-semibold px-4 cursor-pointer">
                    <span>{cta}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                </div>

                {/* IG Interaction bar */}
                <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-700">
                            <Heart className="h-5 w-5 hover:text-rose-500 cursor-pointer" />
                            <MessageCircle className="h-5 w-5 hover:text-slate-900 cursor-pointer" />
                            <Send className="h-5 w-5 hover:text-slate-900 cursor-pointer" />
                        </div>
                        <Bookmark className="h-5 w-5 text-slate-700 hover:text-slate-900 cursor-pointer" />
                    </div>

                    <div className="text-xs font-bold text-slate-900">
                        1,428 likes
                    </div>

                    {/* Caption */}
                    <div className="text-xs text-slate-800 leading-relaxed">
                        <span className="font-bold mr-1.5">{brandName.toLowerCase().replace(/\s+/g, '')}</span>
                        {primaryText || "Automate outreach campaigns with precision. Follow up on Email and WhatsApp without lifting a finger."}
                    </div>
                    <div className="text-[10px] text-violet-600 font-medium">
                        #MarketingAutomation #GrowthHacking #B2BOutreach #SalesPipeline
                    </div>
                </div>
            </div>
        );
    }

    // Default: Meta / Facebook Feed Ad
    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm max-w-md mx-auto overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        S
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-900">{brandName}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-xs font-semibold text-violet-600">Follow</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <span>Sponsored</span>
                            <span>·</span>
                            <Globe className="h-3 w-3 text-slate-400" />
                        </div>
                    </div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-slate-400 cursor-pointer" />
            </div>

            {/* Primary Text */}
            <div className="p-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {expanded ? primaryText : (primaryText?.length > 150 ? primaryText.slice(0, 150) + "..." : primaryText)}
                {primaryText?.length > 150 && (
                    <button 
                        onClick={() => setExpanded(!expanded)} 
                        className="text-slate-500 font-medium ml-1 hover:underline text-xs"
                    >
                        {expanded ? "See less" : "See more"}
                    </button>
                )}
            </div>

            {/* Creative Banner */}
            <div className="relative aspect-[16/9] bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-950 flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.3),transparent_70%)]" />
                <div className="relative z-10 space-y-2 max-w-sm">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase">
                        AI Multichannel Engine
                    </span>
                    <h4 className="text-lg font-bold leading-tight">
                        {headline || "Scale Your Pipeline Without Growing Headcount"}
                    </h4>
                </div>
            </div>

            {/* Link Preview Bar */}
            <div className="bg-slate-50 p-3 flex items-center justify-between border-t border-slate-200/80 gap-3">
                <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block truncate">
                        {displayUrl}
                    </span>
                    <h5 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {headline || "Start Converting Cold Leads Today"}
                    </h5>
                    <p className="text-[11px] text-slate-500 truncate">
                        {description}
                    </p>
                </div>
                <button className="flex-shrink-0 px-4 py-2 bg-slate-200/90 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg shadow-sm transition-all">
                    {cta}
                </button>
            </div>

            {/* Facebook Social Bar */}
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1">
                        <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white">👍</span>
                        <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[9px] text-white">❤️</span>
                    </div>
                    <span>428</span>
                </div>
                <div className="flex items-center gap-3">
                    <span>52 comments</span>
                    <span>18 shares</span>
                </div>
            </div>
        </div>
    );
}
