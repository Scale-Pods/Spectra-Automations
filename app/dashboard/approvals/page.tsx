"use client";

import React from "react";
import { ApprovalsGovernancePanel } from "@/components/dashboard/approvals-governance-panel";
import { ShieldCheck, Mail } from "lucide-react";

export default function TeamApprovalsPage() {
    return (
        <div className="space-y-6 pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-violet-600 text-white shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <span>Team Approvals &amp; Governance</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Dual-Channel Pipeline
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Dual-channel human-in-the-loop governance: Gate 1 Commercial Quotation Review &amp; Gate 2 eWorks Job Dispatch.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                        <Mail className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-slate-500">Quote Review:</span>
                        <span className="font-bold text-slate-900 font-mono">marketing@spectradubai.com</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                        <Mail className="h-3.5 w-3.5 text-purple-600" />
                        <span className="text-slate-500">Job Dispatch:</span>
                        <span className="font-bold text-slate-900 font-mono">dispatch@spectradubai.com</span>
                    </div>
                </div>
            </div>

            {/* Interactive Pipeline & Audit Panel */}
            <ApprovalsGovernancePanel />
        </div>
    );
}

