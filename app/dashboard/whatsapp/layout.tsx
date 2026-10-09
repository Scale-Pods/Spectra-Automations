"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Send,
    BarChart3,
    ArrowLeft,
    MessageSquare,
    Mail,
    Mic,
    ChevronDown,
    MessageCircle,
    Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const whatsappSidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard/whatsapp",
        icon: LayoutDashboard,
    },
    {
        title: "Whatsapp Chat",
        href: "/dashboard/whatsapp/chat",
        icon: MessageSquare,
    },
    {
        title: "Lead",
        href: "/dashboard/whatsapp/leads",
        icon: Users,
    },

    {
        title: "Analytics",
        href: "/dashboard/whatsapp/analytics",
        icon: BarChart3,
    },
];

export default function WhatsappLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // If it's the specific chat page, make it a standalone view without the sidebar
    const isSpecificChat = pathname.startsWith("/dashboard/whatsapp/chat/") && pathname !== "/dashboard/whatsapp/chat";
    if (isSpecificChat) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4 sm:p-6 md:p-8">
                <main className="w-full max-w-5xl h-[90vh] bg-[var(--glass-fill)] backdrop-blur-[48px] shadow-[var(--glass-shadow)] rounded-2xl overflow-hidden border border-[var(--separator)] p-2 sm:p-6 flex flex-col relative">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[var(--label-primary)] relative">
            {/* Ambient Light Orbs */}
            <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none z-0" />
            <div className="fixed -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none z-0" />

            {/* WhatsApp Sidebar */}
            <aside className="w-64 flex-col bg-slate-100/95 backdrop-blur-xl border-r border-slate-200/90 hidden md:flex font-sans z-10 shadow-sm">
                {/* Logo Section */}
                <div className="px-5 pt-5 pb-3 flex justify-center">
                    <div className="relative w-full h-14 block rounded-xl bg-white p-2 border border-slate-200 shadow-sm">
                        <Image
                            src="/spectra-wide-logo.png"
                            alt="Spectra Automation Logo"
                            fill
                            className="object-contain p-1"
                            priority
                        />
                    </div>
                </div>

                <div className="px-4 pb-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-between bg-white border border-slate-200/80 text-slate-900 hover:bg-slate-50 h-10 shadow-sm rounded-xl font-medium"
                            >
                                <span className="flex items-center gap-2">
                                    <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                                    <span>Switch Dashboard</span>
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
                </div>

                <div className="px-4 py-2">
                    <div className="h-[1px] w-full bg-slate-200/80"></div>
                </div>

                <nav className="flex-1 overflow-auto px-4 space-y-2">
                    {whatsappSidebarItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={`group flex items-center gap-4 rounded-full px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive
                                    ? "active-liquid-pill"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800 transition-colors"}`} />
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
