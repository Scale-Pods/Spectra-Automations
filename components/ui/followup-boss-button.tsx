"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, UserCheck } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface FollowUpBossButtonProps {
    leadId?: string | number | null;
    lead?: any;
    variant?: "button" | "icon" | "badge";
    size?: "default" | "sm" | "xs";
    className?: string;
}

export function extractLeadId(leadId?: string | number | null, lead?: any): string | null {
    if (leadId !== undefined && leadId !== null && String(leadId).trim() !== "") {
        return String(leadId).trim();
    }
    if (lead) {
        const candidate =
            lead.lead_id ||
            lead.leadId ||
            lead["Lead ID"] ||
            lead["lead_id"] ||
            lead.id;
        if (candidate !== undefined && candidate !== null && String(candidate).trim() !== "") {
            return String(candidate).trim();
        }
    }
    return null;
}

export function FollowUpBossButton(_props: any) {
    return null;
}
