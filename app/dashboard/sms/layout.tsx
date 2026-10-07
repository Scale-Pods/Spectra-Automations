"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Send,
    BarChart3,
    MessageCircle,
    Mail,
    Mic,
    ChevronDown,
    Smartphone,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const smsSidebarItems = [
    {
        title: "Overview",
        href: "/dashboard/sms",
        icon: LayoutDashboard,
    },
    {
        title: "Messages",
        href: "/dashboard/sms/sent",
        icon: Send,
    },
    {
        title: "Analytics",
        href: "/dashboard/sms/analytics",
        icon: BarChart3,
    },
];

export default function SmsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-slate-900 relative">
            {/* Ambient Light Orbs */}
            <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-violet-400/10 blur-[120px] pointer-events-none z-0" />
            <div className="fixed -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-purple-400/10 blur-[120px] pointer-events-none z-0" />

            {/* SMS Sidebar */}
            <aside className="w-64 flex-col bg-slate-100/95 backdrop-blur-xl border-r border-slate-200/90 hidden md:flex font-sans z-10 shadow-sm">
                {/* Logo Section */}
                <div className="p-6 pb-4 flex justify-center">
                    <div className="relative w-48 h-16">
                        <Image
                            src="/spectra-logo.png"
                            alt="Spectra Automation Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                <div className="px-4 pb-2">
                    {mounted ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 h-10 shadow-sm rounded-xl font-medium"
                                >
                                    <span className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4 text-violet-600" />
                                        <span>SMS Reachout</span>
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[220px]" side="top">
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard" className="cursor-pointer w-full flex items-center">
                                        <LayoutDashboard className="mr-2 h-4 w-4 text-violet-600" /> Master Overview
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/email" className="cursor-pointer w-full flex items-center">
                                        <Mail className="mr-2 h-4 w-4 text-violet-600" /> Email Marketing
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/whatsapp" className="cursor-pointer w-full flex items-center">
                                        <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" /> WhatsApp CRM
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full justify-between bg-slate-50 border border-slate-200 text-slate-900 h-10 shadow-sm rounded-xl opacity-50 font-medium"
                        >
                            <span className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-violet-600" />
                                <span>Loading...</span>
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    )}
                </div>

                <div className="px-4 py-2">
                    <div className="h-[1px] w-full bg-slate-200/80"></div>
                </div>

                <nav className="flex-1 overflow-auto px-4 space-y-2">
                    {smsSidebarItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={`group flex items-center gap-4 rounded-full px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive
                                    ? "active-liquid-pill"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700 transition-colors"}`} />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto p-4 mb-4">
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-[#F8FAFC] p-6 relative z-10">
                {children}
            </main>
        </div>
    );
}
