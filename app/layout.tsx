import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Spectra Automation | AI Automation",
    description: "AI-Powered Marketing & Operations managed by ScalePods",
    icons: {
        icon: '/spectra-logo.png',
        shortcut: '/spectra-logo.png',
        apple: '/spectra-logo.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className="light">
            <body className="font-sans antialiased">{children}</body>
        </html>
    );
}
