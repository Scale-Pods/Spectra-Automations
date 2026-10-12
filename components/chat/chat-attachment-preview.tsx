"use client";

import React, { useState, useRef } from "react";
import {
    Image as ImageIcon,
    Volume2,
    Mic,
    Video,
    FileText,
    File,
    Download,
    ExternalLink,
    Eye,
    EyeOff,
    Play,
    Pause,
    ZoomIn,
    ZoomOut,
    RotateCw,
    X,
    Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface MessageAttachment {
    id: string;
    message_id?: string | null;
    customer_id?: string | null;
    eworks_customer_id?: number | null;
    filename: string;
    mime_type?: string | null;
    size_bytes?: number | null;
    source_url?: string | null;
    content_id?: string | null;
    attachment_kind?: 'INLINE_IMAGE' | 'ATTACHMENT' | 'BOTH' | string;
    sha256?: string;
    fetch_status?: string;
    processing_status?: string;
    extracted_text?: string | null;
    ai_summary?: string | null;
    error_message?: string | null;
    metadata?: any;
    created_at?: string;
    updated_at?: string;
}

export function formatBytes(bytes?: number | null): string {
    if (!bytes || bytes <= 0) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function getAttachmentCategory(att: MessageAttachment): "image" | "audio" | "video" | "document" | "other" {
    const cat = String(att.metadata?.category || "").toUpperCase();
    if (cat === "IMAGE") return "image";
    if (cat === "AUDIO") return "audio";
    if (cat === "VIDEO") return "video";

    const mime = String(att.mime_type || "").toLowerCase();
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
    if (mime.includes("pdf") || mime.includes("document") || mime.includes("word") || mime.includes("sheet")) return "document";

    const name = String(att.filename || "").toLowerCase();
    if (/\.(png|jpe?g|webp|gif|svg|bmp|ico)$/.test(name)) return "image";
    if (/\.(ogg|mp3|wav|m4a|aac|flac|opus)$/.test(name)) return "audio";
    if (/\.(mp4|webm|mov|mkv|avi|wmv)$/.test(name)) return "video";
    if (/\.(pdf|docx?|xlsx?|csv|pptx?|txt)$/.test(name)) return "document";

    return "other";
}

export function getAttachmentUrls(att: MessageAttachment) {
    let fileId = att.metadata?.drive_file_id;
    if (!fileId && att.source_url) {
        const m = att.source_url.match(/\/d\/([a-zA-Z0-9_-]+)/) || att.source_url.match(/id=([a-zA-Z0-9_-]+)/);
        if (m) fileId = m[1];
    }

    let previewUrl = att.metadata?.url || att.source_url || "";
    let rawDirectUrl = att.metadata?.drive_web_content_link || att.source_url || "";
    let openUrl = att.metadata?.drive_web_view_link || att.source_url || "";
    let downloadUrl = att.metadata?.drive_web_content_link || att.source_url || "";
    let embedUrl = "";

    if (fileId) {
        previewUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
        rawDirectUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        openUrl = `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;
        downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (openUrl) {
        embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(openUrl)}&embedded=true`;
    }

    const category = getAttachmentCategory(att);
    let mime = att.mime_type || "";
    if (!mime) {
        const name = (att.filename || "").toLowerCase();
        if (name.endsWith('.ogg')) mime = 'audio/ogg';
        else if (name.endsWith('.mp3')) mime = 'audio/mpeg';
        else if (name.endsWith('.wav')) mime = 'audio/wav';
        else if (name.endsWith('.mp4')) mime = 'video/mp4';
        else if (name.endsWith('.webm')) mime = 'video/webm';
        else if (name.endsWith('.pdf')) mime = 'application/pdf';
        else if (category === 'audio') mime = 'audio/ogg';
        else if (category === 'video') mime = 'video/mp4';
    }

    // Route audio and video via audio-proxy to ensure CORS and proper Content-Type headers for in-chat playback
    let streamUrl = rawDirectUrl;
    if (rawDirectUrl && (category === 'audio' || category === 'video' || fileId)) {
        streamUrl = `/api/audio-proxy?url=${encodeURIComponent(rawDirectUrl)}&mime_type=${encodeURIComponent(mime)}&filename=${encodeURIComponent(att.filename || 'media')}`;
    }

    return { fileId, previewUrl, streamUrl, rawDirectUrl, openUrl, downloadUrl, embedUrl };
}

interface ChatAttachmentPreviewProps {
    attachments: MessageAttachment[];
    isDarkBubble?: boolean;
}

export function ChatAttachmentPreview({ attachments, isDarkBubble = false }: ChatAttachmentPreviewProps) {
    const [lightboxAtt, setLightboxAtt] = useState<MessageAttachment | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [rotation, setRotation] = useState(0);

    if (!attachments || attachments.length === 0) return null;

    const handleOpenLightbox = (att: MessageAttachment) => {
        setLightboxAtt(att);
        setZoomLevel(1);
        setRotation(0);
    };

    const handleCloseLightbox = () => {
        setLightboxAtt(null);
        setZoomLevel(1);
        setRotation(0);
    };

    return (
        <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 space-y-2.5 w-full">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase opacity-75">
                <span>Attachments ({attachments.length})</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
                {attachments.map((att) => {
                    const category = getAttachmentCategory(att);
                    const urls = getAttachmentUrls(att);
                    const sizeStr = formatBytes(att.size_bytes);

                    if (category === "image") {
                        return (
                            <ImageAttachmentCard
                                key={att.id}
                                att={att}
                                urls={urls}
                                sizeStr={sizeStr}
                                isDarkBubble={isDarkBubble}
                                onOpenLightbox={() => handleOpenLightbox(att)}
                            />
                        );
                    }

                    if (category === "audio") {
                        return (
                            <AudioAttachmentCard
                                key={att.id}
                                att={att}
                                urls={urls}
                                sizeStr={sizeStr}
                                isDarkBubble={isDarkBubble}
                            />
                        );
                    }

                    if (category === "video") {
                        return (
                            <VideoAttachmentCard
                                key={att.id}
                                att={att}
                                urls={urls}
                                sizeStr={sizeStr}
                                isDarkBubble={isDarkBubble}
                            />
                        );
                    }

                    return (
                        <DocumentAttachmentCard
                            key={att.id}
                            att={att}
                            urls={urls}
                            sizeStr={sizeStr}
                            isDarkBubble={isDarkBubble}
                        />
                    );
                })}
            </div>

            {/* Lightbox Dialog for Image viewing */}
            {lightboxAtt && (
                <Dialog open={!!lightboxAtt} onOpenChange={(open) => !open && handleCloseLightbox()}>
                    <DialogContent className="max-w-4xl max-h-[92vh] p-0 overflow-hidden bg-slate-950/95 text-white border-slate-800 backdrop-blur-xl">
                        <DialogHeader className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <ImageIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                                <DialogTitle className="text-sm font-medium truncate text-slate-100">
                                    {lightboxAtt.filename}
                                </DialogTitle>
                                {lightboxAtt.size_bytes && (
                                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700 shrink-0">
                                        {formatBytes(lightboxAtt.size_bytes)}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0 mr-6">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
                                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                                    title="Zoom out"
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
                                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                                    title="Zoom in"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
                                    onClick={() => setRotation((r) => (r + 90) % 360)}
                                    title="Rotate"
                                >
                                    <RotateCw className="h-4 w-4" />
                                </Button>
                                <a
                                    href={getAttachmentUrls(lightboxAtt).openUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>Open in New Tab</span>
                                </a>
                                {getAttachmentUrls(lightboxAtt).downloadUrl && (
                                    <a
                                        href={getAttachmentUrls(lightboxAtt).downloadUrl}
                                        download={lightboxAtt.filename}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        <span>Download</span>
                                    </a>
                                )}
                            </div>
                        </DialogHeader>

                        <div className="relative flex items-center justify-center p-6 min-h-[50vh] max-h-[75vh] overflow-auto bg-black/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={getAttachmentUrls(lightboxAtt).previewUrl}
                                alt={lightboxAtt.filename}
                                className="max-h-[70vh] max-w-full object-contain rounded-md transition-transform duration-200 select-none shadow-2xl"
                                style={{
                                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                                }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

// ─── Image Card Component (Displays image directly inside the chat) ─────────
function ImageAttachmentCard({
    att,
    urls,
    sizeStr,
    isDarkBubble,
    onOpenLightbox,
}: {
    att: MessageAttachment;
    urls: ReturnType<typeof getAttachmentUrls>;
    sizeStr: string;
    isDarkBubble: boolean;
    onOpenLightbox: () => void;
}) {
    const [imgError, setImgError] = useState(false);

    return (
        <div
            className={`group relative rounded-xl overflow-hidden border transition-all ${
                isDarkBubble
                    ? "bg-black/20 border-white/15 hover:border-white/30 text-white"
                    : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100"
            }`}
        >
            {!imgError ? (
                <div
                    className="relative cursor-pointer overflow-hidden max-h-72 bg-black/10 flex items-center justify-center"
                    onClick={onOpenLightbox}
                >
                    {/* Image displayed directly inside the chat */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={urls.previewUrl}
                        alt={att.filename}
                        onError={() => setImgError(true)}
                        className="w-full max-h-72 object-contain sm:object-cover object-center group-hover:scale-[1.01] transition-transform duration-200 rounded-t-xl"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-semibold shadow-lg">
                            <Maximize2 className="h-3.5 w-3.5" />
                            <span>Click to Zoom</span>
                        </span>
                    </div>
                </div>
            ) : (
                <div className="p-4 flex items-center gap-3 bg-slate-100/50 dark:bg-slate-800/50">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <ImageIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{att.filename}</p>
                        <p className="text-[10px] opacity-75">{sizeStr || "Image attachment"}</p>
                    </div>
                </div>
            )}

            <div className="p-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-75" />
                    <span className="truncate text-[11px] font-medium" title={att.filename}>
                        {att.filename}
                    </span>
                    {sizeStr && (
                        <span className="text-[10px] opacity-60 shrink-0 font-mono">
                            • {sizeStr}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={onOpenLightbox}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            isDarkBubble
                                ? "bg-white/15 hover:bg-white/25 text-white"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                        title="View zoom lightbox"
                    >
                        <Eye className="h-3 w-3" />
                        <span>Zoom</span>
                    </button>
                    <a
                        href={urls.openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            isDarkBubble
                                ? "bg-white/20 hover:bg-white/30 text-white"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                        title="Open in new tab"
                    >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open in New Tab</span>
                    </a>
                </div>
            </div>
        </div>
    );
}

// ─── Audio / Voice Note Card (Plays directly inside the chat) ───────────────
function AudioAttachmentCard({
    att,
    urls,
    sizeStr,
    isDarkBubble,
}: {
    att: MessageAttachment;
    urls: ReturnType<typeof getAttachmentUrls>;
    sizeStr: string;
    isDarkBubble: boolean;
}) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("0:00");
    const [duration, setDuration] = useState("0:00");
    const [playError, setPlayError] = useState(false);

    const formatSecs = (sec: number) => {
        if (!sec || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                setPlayError(false);
            }).catch((err) => {
                console.error("Audio in-chat play error:", err);
                setPlayError(true);
            });
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const cur = audioRef.current.currentTime;
        const dur = audioRef.current.duration;
        setCurrentTime(formatSecs(cur));
        if (dur && !isNaN(dur)) {
            setProgress((cur / dur) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        setDuration(formatSecs(audioRef.current.duration));
    };

    return (
        <div
            className={`rounded-xl p-3 border transition-all space-y-2.5 ${
                isDarkBubble
                    ? "bg-black/25 border-white/15 text-white"
                    : "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
            }`}
        >
            <audio
                ref={audioRef}
                src={urls.streamUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                    setIsPlaying(false);
                    setProgress(0);
                }}
                onError={() => setPlayError(true)}
                preload="metadata"
            />

            {/* Custom interactive player widget */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={togglePlay}
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md ${
                        isDarkBubble
                            ? "bg-white text-emerald-800 hover:bg-emerald-50"
                            : "bg-emerald-600 text-white hover:bg-emerald-500"
                    }`}
                    title={isPlaying ? "Pause voice note" : "Play voice note directly inside chat"}
                >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>

                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                            <Mic className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="font-semibold truncate text-[11px]">
                                {att.filename || "Voice Note"}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono opacity-75 shrink-0">
                            {currentTime} / {duration !== "0:00" ? duration : sizeStr || "Audio"}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                        className="h-2 w-full bg-black/15 dark:bg-white/15 rounded-full overflow-hidden cursor-pointer"
                        onClick={(e) => {
                            if (!audioRef.current || !audioRef.current.duration) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const pct = clickX / rect.width;
                            audioRef.current.currentTime = pct * audioRef.current.duration;
                        }}
                    >
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <a
                        href={urls.openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-medium ${
                            isDarkBubble
                                ? "bg-white/15 hover:bg-white/25 text-white"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                        title="Open audio in new tab"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">New Tab</span>
                    </a>
                    {urls.downloadUrl && (
                        <a
                            href={urls.downloadUrl}
                            download={att.filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-lg transition-colors ${
                                isDarkBubble
                                    ? "bg-white/15 hover:bg-white/25 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            }`}
                            title="Download audio file"
                        >
                            <Download className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>
            </div>

            {/* Native browser audio controls inside chat */}
            <div className="pt-1">
                <audio
                    src={urls.streamUrl}
                    controls
                    preload="metadata"
                    className="w-full h-8 accent-emerald-500 opacity-90 rounded"
                />
            </div>

            {playError && (
                <p className="text-[10px] text-amber-500 flex items-center justify-between">
                    <span>Direct playback preview issue.</span>
                    <a href={urls.openUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                        Play in New Tab
                    </a>
                </p>
            )}
        </div>
    );
}

// ─── Video Card Component (Plays directly inside the chat) ───────────────────
function VideoAttachmentCard({
    att,
    urls,
    sizeStr,
    isDarkBubble,
}: {
    att: MessageAttachment;
    urls: ReturnType<typeof getAttachmentUrls>;
    sizeStr: string;
    isDarkBubble: boolean;
}) {
    return (
        <div
            className={`rounded-xl overflow-hidden border p-2.5 transition-all space-y-2.5 ${
                isDarkBubble
                    ? "bg-black/25 border-white/15 text-white"
                    : "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
            }`}
        >
            <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                    <Video className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="font-semibold truncate text-[11px]">{att.filename}</span>
                </div>
                {sizeStr && <span className="text-[10px] opacity-70 font-mono shrink-0">{sizeStr}</span>}
            </div>

            {/* Video Player playing directly inside the chat */}
            <div className="rounded-xl overflow-hidden bg-black/60 shadow-inner">
                <video
                    src={urls.streamUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full max-h-72 rounded-xl object-contain bg-black"
                />
            </div>

            <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                <span className="text-[10px] opacity-70">Video playback inside chat</span>
                <div className="flex items-center gap-1.5 shrink-0">
                    <a
                        href={urls.openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                            isDarkBubble
                                ? "bg-white/20 hover:bg-white/30 text-white"
                                : "bg-blue-600 hover:bg-blue-500 text-white"
                        }`}
                    >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open in New Tab</span>
                    </a>
                    {urls.downloadUrl && (
                        <a
                            href={urls.downloadUrl}
                            download={att.filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                isDarkBubble
                                    ? "bg-white/15 hover:bg-white/25 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            }`}
                        >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Document Card Component (Shows inline preview + Open in New Tab) ─────────
function DocumentAttachmentCard({
    att,
    urls,
    sizeStr,
    isDarkBubble,
}: {
    att: MessageAttachment;
    urls: ReturnType<typeof getAttachmentUrls>;
    sizeStr: string;
    isDarkBubble: boolean;
}) {
    const isPdf = att.filename.toLowerCase().endsWith(".pdf") || att.mime_type?.includes("pdf");
    const [showPreview, setShowPreview] = useState(true);

    return (
        <div
            className={`rounded-xl border transition-all space-y-2.5 p-3 ${
                isDarkBubble
                    ? "bg-black/25 border-white/15 text-white"
                    : "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
            }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isPdf
                                ? "bg-red-500/15 text-red-500"
                                : "bg-blue-500/15 text-blue-500"
                        }`}
                    >
                        {isPdf ? <FileText className="h-5 w-5" /> : <File className="h-5 w-5" />}
                    </div>

                    <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" title={att.filename}>
                            {att.filename}
                        </p>
                        <p className="text-[10px] opacity-60 font-mono">
                            {sizeStr || (isPdf ? "PDF Document" : "Attachment")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {urls.embedUrl && (
                        <button
                            type="button"
                            onClick={() => setShowPreview((s) => !s)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                isDarkBubble
                                    ? "bg-white/15 hover:bg-white/25 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            }`}
                        >
                            {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            <span>{showPreview ? "Hide" : "Preview"}</span>
                        </button>
                    )}
                    <a
                        href={urls.openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors shadow-xs ${
                            isDarkBubble
                                ? "bg-white/25 hover:bg-white/35 text-white"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                        title="Open document in new tab"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open in New Tab</span>
                    </a>
                    {urls.downloadUrl && (
                        <a
                            href={urls.downloadUrl}
                            download={att.filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 rounded-md transition-colors ${
                                isDarkBubble
                                    ? "bg-white/15 hover:bg-white/25 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                            title="Download file"
                        >
                            <Download className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>
            </div>

            {/* Document Preview inside the chat */}
            {showPreview && urls.embedUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-xs">
                    <iframe
                        src={urls.embedUrl}
                        className="w-full h-64 border-0"
                        title={att.filename}
                        loading="lazy"
                    />
                </div>
            )}
        </div>
    );
}
