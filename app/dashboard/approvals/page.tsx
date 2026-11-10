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
                            Live Pipeline
                        </span>
                    </h1>
                </div>

                <div className="flex items-center gap-2 text-xs bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <Mail className="h-3.5 w-3.5 text-violet-600" />
                    <span className="text-slate-500">Governance Inbox:</span>
                    <span className="font-bold text-slate-900">marketing@spectradubai.com</span>
                </div>
            </div>

            {/* Interactive Pipeline & Audit Panel */}
            <ApprovalsGovernancePanel />
        </div>
    );
}

