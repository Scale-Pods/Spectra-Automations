"use client";

import React from "react";
import Image from "next/image";

interface SpectraLoaderProps {
    fullScreen?: boolean;
    contained?: boolean;
    className?: string;
}

export const SpectraLoader = ({ fullScreen = false, contained = false, className = "" }: SpectraLoaderProps) => {
    let positionClasses = "fixed top-14 lg:top-[60px] left-0 md:left-64 right-0 bottom-0";
    if (fullScreen) {
        positionClasses = "fixed inset-0";
    } else if (contained) {
        positionClasses = "absolute inset-0 min-h-[300px]";
    }

    return (
        <div className={`${positionClasses} z-[100] flex items-center justify-center bg-[#F8FAFC]/85 backdrop-blur-md transition-all duration-500 ${className}`}>
            <div className="relative flex flex-col items-center justify-center">

                {/* Animated Background Glow */}
                <div className="absolute w-64 h-64 bg-yellow-500/20 rounded-full blur-[80px] animate-pulse"></div>

                {/* Logo Container */}
                <div className="relative flex items-center justify-center p-4">
                    {/* Spinning Border Halo */}
                    <div className="absolute -inset-2 rounded-2xl border border-yellow-500/40 animate-pulse"></div>

                    {/* Logo Card */}
                    <div className="w-64 h-24 bg-white rounded-2xl border-2 border-yellow-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)] relative overflow-hidden group p-3">
                        {/* Mirror Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12"></div>

                        {/* Spectra Logo Image */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            <Image
                                src="/spectra-wide-logo.png"
                                alt="Spectra Automation Logo"
                                width={220}
                                height={75}
                                className="object-contain max-h-full p-1"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Advanced Text Section */}
                <div className="mt-8 text-center space-y-3">
                    <div className="flex flex-col items-center">
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase">
                            <span className="text-yellow-500">SPECTRA</span>
                            <span className="text-[var(--label-primary)] ml-2">AUTOMATION</span>
                        </h2>
                        <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mt-1"></div>
                    </div>

                    <p className="text-[10px] font-bold tracking-[0.4em] text-red-600 uppercase">
                        Please wait while we load your dashboard
                    </p>

                    {/* Loading Indicator */}
                    <div className="flex items-center justify-center gap-1.5 mt-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LMLoader = SpectraLoader;
export const RyanLoader = SpectraLoader;

export default SpectraLoader;
