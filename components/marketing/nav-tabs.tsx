"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Megaphone, Zap, Layers, ArrowUpRight } from "lucide-react";

export function MarketingNavTabs() {
    const pathname = usePathname();

    const isAIContent = pathname.startsWith("/dashboard/ai-content");
    const isAdsManager = pathname.startsWith("/dashboard/ads-manager");

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-200/80">
            {/* Main Tabs */}
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/60 backdrop-blur-md border border-slate-300/70 shadow-inner">
                <Link
                    href="/dashboard/ai-content"
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isAIContent
                            ? "bg-white text-violet-700 shadow-md shadow-violet-500/10 font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                    }`}
                >
                    <Sparkles className={`h-4 w-4 ${isAIContent ? "text-violet-600 fill-violet-100" : "text-slate-500"}`} />
                    <span>AI Content Generator</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isAIContent ? "bg-violet-100 text-violet-700" : "bg-slate-200/80 text-slate-600"
                    }`}>
                        Create
                    </span>
                </Link>

                <Link
                    href="/dashboard/ads-manager"
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isAdsManager
                            ? "bg-white text-violet-700 shadow-md shadow-violet-500/10 font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                    }`}
                >
                    <Megaphone className={`h-4 w-4 ${isAdsManager ? "text-violet-600" : "text-slate-500"}`} />
                    <span>Ads Manager</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isAdsManager ? "bg-blue-100 text-blue-700" : "bg-slate-200/80 text-slate-600"
                    }`}>
                        Meta & Google
                    </span>
                </Link>
            </div>

            {/* Platform Status Indicator */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Meta Pixel & Google Tag Active</span>
                </div>
            </div>
        </div>
    );
}
