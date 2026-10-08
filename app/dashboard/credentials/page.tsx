"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Mic, ExternalLink, Copy, Eye, EyeOff, Wallet, Phone, BarChart3, Smartphone } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { useData } from "@/context/DataContext";

export default function CredentialsPage() {
    const router = useRouter();

    const emailList = [
        "tech@spectradubai.com",
        "marketing@spectradubai.com"
    ];

    const whatsappNumbers = [
        "+971 5XXXX8044"
    ];

    return (
        <div className="space-y-8 pb-10 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">Credentials Management</h1>
                    <p className="text-[var(--label-secondary)]">View your active integrations, email senders, and WhatsApp lines.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* WhatsApp Section */}
                <CredentialSection
                    title="WhatsApp Business API"
                    description="Active WhatsApp outreach lines and Meta Business accounts."
                    icon={MessageCircle}
                    iconColor="text-emerald-600"
                    iconBg="bg-[rgba(52,199,89,0.08)]"
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        {whatsappNumbers.map((phone, idx) => (
                            <ReadOnlyField key={idx} label={`WhatsApp Line ${idx + 1}`} value={phone} />
                        ))}
                    </div>
                </CredentialSection>

                {/* Email Section */}
                <CredentialSection
                    title="Email Integration"
                    description="Active sender accounts used for email outreach campaigns."
                    icon={Mail}
                    iconColor="text-rose-600"
                    iconBg="bg-rose-50"
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        {emailList.map((email, idx) => (
                            <ReadOnlyField key={idx} label={`Sender Account ${idx + 1}`} value={email} />
                        ))}
                    </div>
                </CredentialSection>
            </div>
        </div>
    );
}

function CredentialSection({ title, description, icon: Icon, iconColor, iconBg, children, action }: any) {
    return (
        <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden">
            <CardHeader className="border-b border-[var(--separator)] bg-[var(--bg-app)]/30 pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-[var(--label-primary)]">{title}</CardTitle>
                            <CardDescription className="mt-1">{description}</CardDescription>
                        </div>
                    </div>
                    {action && <div>{action}</div>}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {children}
            </CardContent>
        </Card>
    );
}

function ReadOnlyField({ label, value, isPassword }: { label: string, value: string, isPassword?: boolean }) {
    const [show, setShow] = useState(false);

    const displayValue = isPassword && !show
        ? "••••••••••••••••••••••••"
        : value;

    return (
        <div className="space-y-2">
            <Label className="text-xs font-bold text-[var(--label-tertiary)] uppercase tracking-wider">{label}</Label>
            <div className="relative group">
                <div className="flex items-center w-full rounded-md border border-[var(--separator)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--label-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]">
                    <span className={`flex-1 truncate ${isPassword && !show ? 'font-mono tracking-widest' : 'font-sans'}`}>
                        {displayValue}
                    </span>
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPassword && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-[var(--label-tertiary)] hover:text-[var(--label-primary)]" onClick={() => setShow(!show)}>
                                {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[var(--label-tertiary)] hover:text-[var(--label-primary)]"
                            onClick={() => navigator.clipboard.writeText(value)}
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
