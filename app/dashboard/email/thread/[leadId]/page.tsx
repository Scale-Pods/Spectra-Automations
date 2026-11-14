"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { EmailChatDetail } from "@/components/dashboard/email-chat-detail";
import Link from "next/link";
import { ChevronLeft, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailThreadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
    const { leadId } = use(params);
    const decodedLeadId = decodeURIComponent(leadId);
    const router = useRouter();

    return (
        <div className="flex-1 w-full h-[88vh] flex flex-col p-4 sm:p-6 font-sans">
            <div className="mb-4 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/email/leads">
                        <Button variant="outline" size="sm" className="text-xs h-8 rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                            Unique Leads
                        </Button>
                    </Link>
                    <Link href="/dashboard/email/sent">
                        <Button variant="outline" size="sm" className="text-xs h-8 rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                            Emails Sent
                        </Button>
                    </Link>
                </div>
            </div>
            <div className="flex-1 overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm">
                <EmailChatDetail leadId={decodedLeadId} />
            </div>
        </div>
    );
}
