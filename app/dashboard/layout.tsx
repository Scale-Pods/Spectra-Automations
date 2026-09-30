"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Mail, MessageCircle, Mic, LogOut, ChevronDown, Wallet, BarChart2, Users, Send, Key, ExternalLink, Smartphone, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataProvider, useData } from "@/context/DataContext";
import { calculateDuration } from "@/lib/utils";
import { useMemo } from "react";
import { logout } from "@/app/actions/auth";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Email Marketing",
        href: "/dashboard/email",
        icon: Mail,
    },
    {
        title: "WhatsApp",
        href: "/dashboard/whatsapp",
        icon: MessageCircle,
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DataProvider>
            <DashboardContent>
                {children}
            </DashboardContent>
        </DataProvider>
    );
}

function DashboardContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const dashboardConfig = {
        master: {
            label: "Master Overview",
            icon: LayoutDashboard,
            items: [
                { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
                { title: "Email Marketing", href: "/dashboard/email", icon: Mail },
                { title: "WhatsApp CRM", href: "/dashboard/whatsapp", icon: MessageCircle },
                { title: "Credentials", href: "/dashboard/credentials", icon: Key },
            ]
        },
        email: {
            label: "Email Marketing",
            icon: Mail,
            items: [
                { title: "Overview", href: "/dashboard/email", icon: LayoutDashboard },
                { title: "Analytics", href: "/dashboard/email/analytics", icon: BarChart2 },
            ]
        },
        whatsapp: {
            label: "WhatsApp CRM",
            icon: MessageCircle,
            items: [
                { title: "Overview", href: "/dashboard/whatsapp", icon: LayoutDashboard },
                { title: "Leads", href: "/dashboard/whatsapp/leads", icon: Users },
                { title: "Sent Messages", href: "/dashboard/whatsapp/sent", icon: Send },
            ]
        }
    };

    // Determine current context
    let currentContext = "master";
    if (pathname.startsWith("/dashboard/email")) currentContext = "email";
    else if (pathname.startsWith("/dashboard/whatsapp")) currentContext = "whatsapp";

    const activeConfig = (dashboardConfig as any)[currentContext] || dashboardConfig.master;

    const content = (() => {
        if (pathname.startsWith("/dashboard/email") || pathname.startsWith("/dashboard/whatsapp")) {
            return <>{children}</>;
        }

        return (
            <div className="flex h-screen overflow-hidden bg-[#0a0d14] text-[var(--label-primary)] relative">
                {/* Ambient Light Orbs */}
                <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none z-0" />
                <div className="fixed -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none z-0" />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[140px] pointer-events-none z-0" />

                {/* Sidebar */}
                <aside className="hidden w-64 flex-col bg-[rgba(18,24,41,0.55)] backdrop-blur-[25px] saturate-[180%] border-r border-[rgba(255,255,255,0.1)] md:flex font-sans z-10">
                    {/* Logo Section */}
                    <div className="px-5 pt-5 pb-3 flex justify-center">
                        <Link href="/" className="relative w-full h-14 block rounded-xl bg-white p-2 shadow-lg shadow-black/30 hover:opacity-95 transition-all">
                            <Image
                                src="/spectra-wide-logo.png"
                                alt="Spectra Automation Logo"
                                fill
                                className="object-contain p-1"
                                priority
                            />
                        </Link>
                    </div>

                    <div className="px-4 pb-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    suppressHydrationWarning
                                    variant="outline"
                                    className="w-full justify-between bg-[rgba(255,255,255,0.05)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.15)] text-[var(--label-primary)] hover:bg-[rgba(255,255,255,0.1)] h-10 shadow-sm rounded-xl"
                                >
                                    <span className="flex items-center gap-2">
                                        <activeConfig.icon className="h-4 w-4 text-blue-400" />
                                        <span className="truncate">{activeConfig.label}</span>
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[220px]">
                                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                                    <LayoutDashboard className="mr-2 h-4 w-4" /> Master Overview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/dashboard/email")}>
                                    <Mail className="mr-2 h-4 w-4" /> Email Marketing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/dashboard/whatsapp")}>
                                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp CRM
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="px-4 py-2">
                        <div className="h-[1px] w-full bg-[rgba(255,255,255,0.1)]"></div>
                    </div>

                    <nav className="flex-1 overflow-auto px-4 space-y-2">
                        {activeConfig.items.map((item: any, index: number) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className={`group flex items-center gap-4 rounded-full px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive
                                        ? "active-liquid-pill"
                                        : "text-slate-300 hover:text-white nav-item-glass"
                                        }`}
                                >
                                    <item.icon className={`h-5 w-5 ${isActive ? "text-blue-300" : "text-slate-400 group-hover:text-slate-200 transition-colors"}`} />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="mt-auto p-4 mb-4 space-y-3">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
                            onClick={async () => {
                                await logout();
                                router.push('/');
                                router.refresh();
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex flex-1 flex-col overflow-hidden z-10">
                    <header className="flex h-14 items-center gap-4 border-b border-white/10 bg-[#0b0f19]/60 backdrop-blur-[20px] saturate-[180%] px-6 lg:h-[60px]">
                        <div className="flex flex-1 items-center justify-between">
                            <h1 className="text-lg font-semibold text-white flex items-center">
                                {pathname === "/dashboard" ? "" : (activeConfig.items.find((item: any) => item.href === pathname)?.title || activeConfig.label)}
                                {currentContext === "master" && (
                                    <span className="glass-pill-tag text-blue-300 ml-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                        Powered by ScalePods
                                    </span>
                                )}
                            </h1>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto bg-[var(--bg-app)] p-6 relative">
                        {children}
                    </main>
                </div>
            </div>
        );
    })();

    return (
        <>{content}</>
    );
}
