"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { MarketingNavTabs } from "@/components/marketing/nav-tabs";
import { 
    DUBAI_MAINTENANCE_SERVICES, 
    DUBAI_LOCATIONS, 
    CREATIVE_FORMATS, 
    IMAGE_RESOLUTIONS,
    VIDEO_RESOLUTIONS,
    IMAGE_STYLES,
    IMAGE_LIGHTING_OPTIONS,
    AUDIO_OPTIONS, 
    VOICEOVER_OPTIONS, 
    SPECTRA_DUBAI_PRESETS,
    STUDIO_AI_MODELS,
    StudioModelOption,
    calculateJobCost,
    VIDEO_AI_MODELS,
    VideoModelOption,
    calculateVideoJobCost
} from "@/lib/spectra-maintenance-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
    Sparkles, 
    Wind, 
    Zap, 
    Copy, 
    Check, 
    RefreshCw, 
    ExternalLink, 
    Volume2, 
    Music, 
    CheckCircle2, 
    Layers, 
    Video, 
    Image as ImageIcon, 
    FileText, 
    Smartphone, 
    Code, 
    ArrowRight,
    Settings,
    ShieldCheck,
    MapPin,
    AlertCircle,
    Download,
    Camera,
    Sun,
    Palette,
    Megaphone,
    Flame,
    Tag,
    ChevronDown,
    ChevronUp,
    Cpu,
    Eye,
    History,
    CheckCircle,
    Clock,
    X,
    Plus,
    Trash2,
    Coins,
    Receipt,
    ArrowLeft,
    Lock,
    Play,
    Film,
    Mic,
    VolumeX,
    Captions
} from "lucide-react";

export default function AIContentStudioPage() {
    const router = useRouter();

    // 1. Creative Format Selection
    const [format, setFormat] = useState<'image' | 'video' | 'carousel' | 'story'>('image');

    // 2. Service & Dubai Community Focus
    const [selectedServiceId, setSelectedServiceId] = useState('ac-servicing');
    const [selectedLocation, setSelectedLocation] = useState('Dubai Marina & JBR');
    const [specialOffer, setSpecialOffer] = useState('AED 199 AC Deep Clean (Was AED 350)');

    // 3. Creative Description & Platforms
    const [prompt, setPrompt] = useState('');
    const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
    const [promptEnhancedNotification, setPromptEnhancedNotification] = useState(false);
    const [platforms, setPlatforms] = useState<string[]>(['instagram', 'facebook']);
    const [resolution, setResolution] = useState('1080x1350');

    // 4. Model & Pipeline Specifications
    const [selectedModel, setSelectedModel] = useState<string>('gpt-image-1');
    const [providerFilter, setProviderFilter] = useState<'all' | 'openai' | 'google'>('all');
    const [variantCount, setVariantCount] = useState<number>(1);
    const [referenceImageUrl, setReferenceImageUrl] = useState<string>('');
    const [showReferenceInput, setShowReferenceInput] = useState<boolean>(false);

    // Image-specific specifications
    const [imageStyle, setImageStyle] = useState('photorealistic');
    const [imageLighting, setImageLighting] = useState('villa_daylight');
    const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, cartoon, 3d render distortion, watermark, dirty uniform, cluttered tools, extra limbs');
    const [showAdvancedImageOptions, setShowAdvancedImageOptions] = useState(false);

    // Carousel slides state
    const [carouselSlides, setCarouselSlides] = useState<Array<{ idx: number; title: string; caption: string; image_prompt: string }>>([
        {
            idx: 0,
            title: "Does Your Dubai AC Smell Dusty?",
            caption: "High summer humidity causes mold & mildew to build up inside ductwork and coils.",
            image_prompt: "Close up macro of dusty Dubai AC vent with subtle red warning badge in modern villa living room"
        },
        {
            idx: 1,
            title: "Clogged Coils Spike DEWA Bills",
            caption: "When condenser coils are coated in desert sand, compressors work 35% harder.",
            image_prompt: "Split photo showing filthy clogged AC coil coated in sand vs pristine silver sanitized coil"
        },
        {
            idx: 2,
            title: "Spectra Certified Hospital-Grade Clean",
            caption: "Certified HVAC engineers arrive on-site within 45 minutes across Dubai.",
            image_prompt: "Professional Spectra HVAC technician in crisp navy uniform using pressure washer on modern villa unit"
        }
    ]);

    // Video-specific pipeline state (Veo engines, shots & workflows)
    const [videoEngine, setVideoEngine] = useState<'veo-3.1-fast' | 'veo-3.1-lite' | 'veo-3.1-standard'>('veo-3.1-fast');
    const [videoShotCount, setVideoShotCount] = useState<number>(3);
    const [videoDurationS, setVideoDurationS] = useState<number>(4);
    const [videoResolution, setVideoResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
    const [videoWantsVoiceover, setVideoWantsVoiceover] = useState<boolean>(true);
    const [videoWantsMusic, setVideoWantsMusic] = useState<boolean>(false);
    const [videoWantsSubtitles, setVideoWantsSubtitles] = useState<boolean>(true);
    const [videoSubtitleStyle, setVideoSubtitleStyle] = useState<'bold_yellow' | 'clean_white' | 'karaoke_pop'>('bold_yellow');
    const [activeVideoJob, setActiveVideoJob] = useState<any>(null);
    const [isGeneratingVideoBrief, setIsGeneratingVideoBrief] = useState<boolean>(false);
    const [isRenderingVideo, setIsRenderingVideo] = useState<boolean>(false);
    const [isRefreshingVideoStatus, setIsRefreshingVideoStatus] = useState<boolean>(false);
    const [videoStatusFeedback, setVideoStatusFeedback] = useState<string | null>(null);
    const [recentVideoJobs, setRecentVideoJobs] = useState<any[]>([]);
    const [historyFilter, setHistoryFilter] = useState<'all' | 'images' | 'videos'>('all');
    const [editingShotIdx, setEditingShotIdx] = useState<number | null>(null);

    // 5. Webhook & Job Pipeline State
    const [webhookUrl, setWebhookUrl] = useState('');
    const [videoBriefWebhookUrl, setVideoBriefWebhookUrl] = useState('');
    const [videoRenderWebhookUrl, setVideoRenderWebhookUrl] = useState('');
    const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
    const [tempWebhookUrl, setTempWebhookUrl] = useState('');
    const [tempVideoBriefWebhookUrl, setTempVideoBriefWebhookUrl] = useState('');
    const [tempVideoRenderWebhookUrl, setTempVideoRenderWebhookUrl] = useState('');

    // Active Job & Generation Lifecycle
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeJob, setActiveJob] = useState<any>(null);
    const [jobStatus, setJobStatus] = useState<'idle' | 'pending' | 'generating' | 'done' | 'failed'>('idle');
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

    // Sequential Generation Steps (1: Asset Format -> 2: Model & Direction -> 3: Brief & Generate)
    const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

    const [webhookResult, setWebhookResult] = useState<any>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [showPayloadModal, setShowPayloadModal] = useState(false);
    const [activeOutputTab, setActiveOutputTab] = useState<'visual_assets' | 'copy' | 'visual_prompt' | 'history' | 'webhook'>('visual_assets');
    const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});

    // Resilient display URL resolver: routes via server proxy (bypasses private bucket, domain mismatch, and CORS)
    const getDisplayImageUrl = (url: string | null | undefined) => {
        if (!url) return '';
        const targetDomain = 'https://cnjdinmwpfqkbfarsbxv.supabase.co';
        const corrected = url.replace(/https:\/\/[a-z0-9]+\.supabase\.co/i, targetDomain);
        return `/api/ai/image-proxy?url=${encodeURIComponent(corrected)}`;
    };

    // Polling interval refs
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const videoPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // 6. Generated Copy Output for Spectra Dubai
    const [generatedOutput, setGeneratedOutput] = useState<any>({
        headline: "Beat Dubai's 45°C Heat | AC Deep Servicing & Coil Cleaning",
        caption: "Is your Dubai AC blowing dusty air or struggling to cool your villa? In extreme desert humidity, clogged condenser coils force your compressor to work overtime, spiking DEWA bills.\n\n✨ Spectra Dubai's Certified HVAC Engineers deliver:\n✅ Complete chemical pressure coil wash\n✅ Hospital-grade duct & filter sanitization\n✅ Free gas pressure & electrical check\n✅ 45-minute rapid arrival across Dubai\n\n⚡ Special Offer: AED 199 (Regular AED 350) + 30-Day Cooling Guarantee. Tap WhatsApp to secure your slot today!\n\n#DubaiMaintenance #SpectraDubai #DubaiACRepair #DubaiVillas #PalmJumeirah",
        hook: "Stop paying high DEWA bills until you see this 1 AC maintenance fix in Dubai...",
        visualPrompt: "Hyper-realistic commercial photography of a modern Dubai villa interior, floor-to-ceiling windows showing Dubai Marina skyline in background, pristine clean HVAC ceiling slot diffuser with glowing cool cyan airflow lines, professional HVAC technician in clean navy Spectra uniform holding digital temperature gauge showing 19.5°C, warm ambient lighting, 8k resolution, Hasselblad H6D-100c, f/2.8, photorealistic --ar 4:5 --v 6.1 --style raw",
        ctaText: "WhatsApp Certified Engineer Now",
        whatsappMessage: "Hi Spectra Dubai, I would like to book the AED 199 AC Deep Clean offer for my villa.",
        adStrengthScore: 98
    });

    const isImageFormat = format === 'image';
    const isVideoFormat = format === 'video' || format === 'story';

    // Current selected model metadata
    const activeModelObj = useMemo(() => {
        return STUDIO_AI_MODELS.find(m => m.id === selectedModel) || STUDIO_AI_MODELS[0];
    }, [selectedModel]);

    // Filtered models by provider
    const filteredModels = useMemo(() => {
        if (providerFilter === 'all') return STUDIO_AI_MODELS;
        return STUDIO_AI_MODELS.filter(m => m.provider === providerFilter);
    }, [providerFilter]);

    // Computed Job and Per-Image Exact Cost
    const activeJobCost = useMemo(() => {
        if (!activeJob) {
            const count = format === 'carousel' ? carouselSlides.length : (activeModelObj.maxVariants === 1 ? 1 : variantCount);
            return calculateJobCost(selectedModel, count);
        }
        const imgCount = activeJob.post_type === 'carousel' 
            ? (Array.isArray(activeJob.slides_json) && activeJob.slides_json.length > 0 ? activeJob.slides_json.length : 1)
            : (Array.isArray(activeJob.image_urls) && activeJob.image_urls.length > 0 ? activeJob.image_urls.length : (activeJob.variants || 1));
        return calculateJobCost(activeJob.model || selectedModel, imgCount);
    }, [activeJob, selectedModel, variantCount, activeModelObj, format, carouselSlides]);

    // Computed Video Job Exact Cost (Veo rates per second in USD & AED)
    const activeVideoCost = useMemo(() => {
        if (activeVideoJob && activeVideoJob.estimated_cost_usd) {
            const usd = Number(activeVideoJob.estimated_cost_usd);
            const aed = +(usd * 3.6725).toFixed(2);
            return {
                rateUsd: 0.12,
                rateAed: 0.44,
                totalDurationS: (activeVideoJob.shots_json?.length || videoShotCount) * videoDurationS,
                totalUsd: usd,
                totalAed: aed,
                formattedRate: `$0.12 (AED 0.44)/s`,
                formattedTotal: `$${usd.toFixed(2)} (AED ${aed.toFixed(2)})`,
                modelName: activeVideoJob.engine || videoEngine
            };
        }
        return calculateVideoJobCost(videoEngine, videoResolution, videoShotCount, videoDurationS);
    }, [activeVideoJob, videoEngine, videoResolution, videoShotCount, videoDurationS]);

    // Ensure variant count stays within selected model capability
    useEffect(() => {
        if (activeModelObj.maxVariants === 1 && variantCount > 1) {
            setVariantCount(1);
        }
    }, [activeModelObj, variantCount]);

    // Load saved webhook URLs & recent jobs on mount
    useEffect(() => {
        const savedUrl = localStorage.getItem("SPECTRA_STUDIO_WEBHOOK_URL");
        const savedBrief = localStorage.getItem("SPECTRA_VIDEO_BRIEF_WEBHOOK_URL");
        const savedRender = localStorage.getItem("SPECTRA_VIDEO_RENDER_WEBHOOK_URL");

        if (savedUrl) {
            setWebhookUrl(savedUrl);
            setTempWebhookUrl(savedUrl);
        }
        if (savedBrief) {
            setVideoBriefWebhookUrl(savedBrief);
            setTempVideoBriefWebhookUrl(savedBrief);
        } else if (savedUrl) {
            const derived = savedUrl.replace(/spectra-studio-generate/g, 'spectra-video-brief');
            setVideoBriefWebhookUrl(derived);
            setTempVideoBriefWebhookUrl(derived);
        }
        if (savedRender) {
            setVideoRenderWebhookUrl(savedRender);
            setTempVideoRenderWebhookUrl(savedRender);
        } else if (savedUrl) {
            const derived = savedUrl.replace(/spectra-studio-generate/g, 'spectra-video-render');
            setVideoRenderWebhookUrl(derived);
            setTempVideoRenderWebhookUrl(derived);
        }

        fetchRecentJobs();
        fetchRecentVideoJobs();

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (videoPollingIntervalRef.current) clearInterval(videoPollingIntervalRef.current);
        };
    }, []);

    // Fetch recent studio image jobs from API
    const fetchRecentJobs = async () => {
        try {
            const res = await fetch('/api/ai/studio-jobs?limit=20');
            const data = await res.json();
            if (data.success && Array.isArray(data.jobs)) {
                setRecentJobs(data.jobs);
                if (!activeJob && data.jobs.length > 0) {
                    const latest = data.jobs[0];
                    setActiveJob(latest);
                    setJobStatus(latest.status);
                    if (latest.enhanced_image_prompt) {
                        setGeneratedOutput((prev: any) => ({
                            ...prev,
                            visualPrompt: latest.enhanced_image_prompt
                        }));
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to load recent studio jobs", e);
        }
    };

    // Fetch recent video jobs from API
    const fetchRecentVideoJobs = async () => {
        try {
            const res = await fetch('/api/ai/video-jobs?limit=20');
            const data = await res.json();
            if (data.success && Array.isArray(data.jobs)) {
                setRecentVideoJobs(data.jobs);
                if (!activeVideoJob && data.jobs.length > 0) {
                    setActiveVideoJob(data.jobs[0]);
                }
            }
        } catch (e) {
            console.warn("Failed to load recent video jobs", e);
        }
    };

    // Poll studio image job status until done or failed
    const startPollingJob = (jobId: string) => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/ai/studio-jobs?id=${jobId}`);
                const data = await res.json();

                if (data.success && data.job) {
                    const current = data.job;
                    setActiveJob(current);
                    setJobStatus(current.status);

                    if (current.status === 'done') {
                        setIsGenerating(false);
                        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                        setActiveOutputTab('visual_assets');
                        fetchRecentJobs();
                    } else if (current.status === 'failed') {
                        setIsGenerating(false);
                        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                        fetchRecentJobs();
                    }
                }
            } catch (err) {
                console.error("Polling error for job", jobId, err);
            }
        }, 2500);
    };

    // Poll video job status until completed or failed
    const startPollingVideoJob = (jobId: string) => {
        if (videoPollingIntervalRef.current) clearInterval(videoPollingIntervalRef.current);

        videoPollingIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/ai/video-jobs?id=${jobId}&sync=true`);
                const data = await res.json();
                if (data.success && data.job) {
                    const current = data.job;
                    setActiveVideoJob(current);

                    const finalUrl = current.output_video_url || current.final_video_url;
                    if (current.status === 'completed' || current.status === 'done' || finalUrl) {
                        setIsRenderingVideo(false);
                        if (videoPollingIntervalRef.current) clearInterval(videoPollingIntervalRef.current);
                        fetchRecentVideoJobs();
                    } else if (current.status === 'failed') {
                        setIsRenderingVideo(false);
                        if (videoPollingIntervalRef.current) clearInterval(videoPollingIntervalRef.current);
                        fetchRecentVideoJobs();
                    }
                }
            } catch (err) {
                console.error("Polling error for video job", jobId, err);
            }
        }, 3000);
    };

    // Explicitly refresh status from Railway video engine with dynamic jobId
    const handleRefreshVideoStatus = async (targetJobId?: string) => {
        const jId = targetJobId || activeVideoJob?.id;
        if (!jId) return;
        setIsRefreshingVideoStatus(true);
        setVideoStatusFeedback(null);
        try {
            const res = await fetch(`/api/ai/video-jobs?id=${jId}&sync=true`);
            const data = await res.json();
            if (data.success && data.job) {
                const updated = data.job;
                setActiveVideoJob(updated);
                setRecentVideoJobs(prev => prev.map(j => j.id === updated.id ? updated : j));

                const finalUrl = updated.output_video_url || updated.final_video_url;
                if (updated.status === 'completed' || finalUrl) {
                    setIsRenderingVideo(false);
                    setVideoStatusFeedback('Video render completed! Ready to preview & download.');
                } else if (updated.status === 'rendering') {
                    const pct = updated.render_progress?.percent;
                    setVideoStatusFeedback(pct !== undefined ? `Rendering in progress: ${pct}% complete` : 'Rendering clips on Railway Veo engine...');
                } else if (updated.status === 'failed') {
                    setIsRenderingVideo(false);
                    setVideoStatusFeedback(`Render failed: ${updated.error_detail || 'Please check engine logs'}`);
                } else {
                    setVideoStatusFeedback(`Status updated: ${updated.status || 'Success'}`);
                }
                setTimeout(() => setVideoStatusFeedback(null), 5000);
            }
        } catch (err) {
            console.error('Failed to refresh video status:', err);
            setVideoStatusFeedback('Could not query video engine. Retrying in background...');
            setTimeout(() => setVideoStatusFeedback(null), 4000);
        } finally {
            setIsRefreshingVideoStatus(false);
        }
    };

    // Adjust resolution automatically when format changes
    const handleFormatChange = (newFormat: 'image' | 'video' | 'carousel' | 'story') => {
        setFormat(newFormat);
        if (newFormat === 'image') {
            setResolution('1080x1350');
        } else if (newFormat === 'carousel') {
            setResolution('1080x1080');
        } else if (newFormat === 'video' || newFormat === 'story') {
            setResolution('1080x1920');
        }
    };

    // Platform toggle helper
    const togglePlatform = (p: string) => {
        if (platforms.includes(p)) {
            if (platforms.length > 1) {
                setPlatforms(platforms.filter(x => x !== p));
            }
        } else {
            setPlatforms([...platforms, p]);
        }
    };

    // Quick Prompt enhancer tag append
    const appendPromptTag = (tagText: string) => {
        if (!prompt) {
            setPrompt(tagText);
        } else if (!prompt.includes(tagText)) {
            setPrompt(prev => `${prev.trim()}, ${tagText}`);
        }
    };

    // One-Click AI Prompt Enhancer
    const handleEnhancePrompt = async () => {
        if (!prompt.trim() || isEnhancingPrompt) return;
        setIsEnhancingPrompt(true);
        try {
            const aspectStr = resolution === '1080x1920' ? '9:16' : resolution === '1080x1080' ? '1:1' : resolution === '1080x1350' ? '4:5' : '16:9';
            const res = await fetch('/api/ai/enhance-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    model: selectedModel,
                    aspect_ratio: aspectStr,
                    format
                })
            });
            const data = await res.json();
            if (data.success && data.enhancedPrompt) {
                setPrompt(data.enhancedPrompt);
                setPromptEnhancedNotification(true);
                setTimeout(() => setPromptEnhancedNotification(false), 4000);
            }
        } catch (err) {
            console.error("Enhance prompt error:", err);
        } finally {
            setIsEnhancingPrompt(false);
        }
    };

    // Apply quick preset
    const applyPreset = (preset: any) => {
        setFormat(preset.format);
        setSelectedServiceId(preset.serviceId);
        setPrompt(preset.prompt);
        setPlatforms(preset.platforms);
        setResolution(preset.resolution);
        
        if (preset.discount) setSpecialOffer(preset.discount);

        if (preset.format === 'image' || preset.format === 'carousel') {
            if (preset.imageStyle) setImageStyle(preset.imageStyle);
            if (preset.imageLighting) setImageLighting(preset.imageLighting);
        } else {
            setVideoWantsMusic(preset.audio !== 'none');
            setVideoWantsVoiceover(preset.voiceover !== 'none');
        }

        const service = DUBAI_MAINTENANCE_SERVICES.find(s => s.id === preset.serviceId);
        setGeneratedOutput({
            ...generatedOutput,
            headline: `${service?.name || "AC Servicing"} | Spectra Dubai Fast Dispatch`,
            caption: `Beat the heat in your Dubai villa or apartment with Spectra Dubai. ${service?.description}\n\n⚡ ${preset.discount || "Special Summer Rates"}. Certified engineers on-site within 45 mins.\n\nBook directly via WhatsApp in 30 seconds!\n\n#DubaiMaintenance #SpectraDubai #DubaiAC`,
            hook: `Dubai homeowners: here's how to keep your AC running at peak efficiency all year round.`,
            visualPrompt: preset.prompt,
            whatsappMessage: `Hi Spectra Dubai, I would like to book the ${preset.discount || service?.name} for my property.`
        });

        // Advance directly to Step 3 for generation
        setActiveStep(3);
    };

    // Copy helper
    const copyText = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Save Webhook URLs
    const saveWebhookSettings = () => {
        setWebhookUrl(tempWebhookUrl);
        localStorage.setItem("SPECTRA_STUDIO_WEBHOOK_URL", tempWebhookUrl);

        const briefUrlToSave = tempVideoBriefWebhookUrl.trim() || tempWebhookUrl.replace(/spectra-studio-generate/g, 'spectra-video-brief');
        const renderUrlToSave = tempVideoRenderWebhookUrl.trim() || tempWebhookUrl.replace(/spectra-studio-generate/g, 'spectra-video-render');

        setVideoBriefWebhookUrl(briefUrlToSave);
        localStorage.setItem("SPECTRA_VIDEO_BRIEF_WEBHOOK_URL", briefUrlToSave);

        setVideoRenderWebhookUrl(renderUrlToSave);
        localStorage.setItem("SPECTRA_VIDEO_RENDER_WEBHOOK_URL", renderUrlToSave);

        setIsWebhookModalOpen(false);
    };

    // -------------------------------------------------------------
    // VIDEO WORKFLOW 1: GENERATE VIDEO BRIEF & VOICEOVER
    // -------------------------------------------------------------
    const handleGenerateVideoBrief = async () => {
        setIsGeneratingVideoBrief(true);
        setWebhookResult(null);

        const currentService = DUBAI_MAINTENANCE_SERVICES.find(s => s.id === selectedServiceId);
        const aspectStr = resolution === '1080x1080' ? '1:1' : resolution === '1080x1920' ? '9:16' : '9:16';

        try {
            const res = await fetch('/api/ai/video-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_brief',
                    topic: prompt.trim() || `${currentService?.name || 'AC Deep Servicing'} in ${selectedLocation}`,
                    platform: platforms[0] || 'instagram',
                    aspectRatio: aspectStr,
                    shotCount: videoShotCount,
                    durationS: videoDurationS,
                    wantsVoiceover: videoWantsVoiceover,
                    wantsMusic: videoWantsMusic,
                    wantsSubtitles: videoWantsSubtitles,
                    subtitleStyle: videoSubtitleStyle,
                    engine: videoEngine,
                    resolution: videoResolution,
                    videoType: 'generated_clips',
                    styleDirection: 'Cinematic, ultra-sharp 4K commercial lighting, clean Dubai villa interior',
                    brandName: 'Spectra Property Maintenance Dubai',
                    brandDescription: 'Dubai luxury villa & commercial HVAC, plumbing, and property care',
                    briefWebhookUrl: videoBriefWebhookUrl.trim()
                })
            });

            const data = await res.json();
            if (data.success && data.job) {
                setActiveVideoJob(data.job);
                setActiveOutputTab('visual_assets');
                setWebhookResult({
                    success: true,
                    message: data.webhookDispatched
                        ? `Video brief created (#${data.job.id.slice(0, 8)}) and voiceover synthesized via n8n`
                        : `Video brief & storyboard ready (#${data.job.id.slice(0, 8)}). Ready to render clips.`
                });
                fetchRecentVideoJobs();
            } else {
                setWebhookResult({
                    success: false,
                    error: data.error || 'Failed to generate video brief'
                });
            }
        } catch (err: any) {
            console.error('Video brief creation error:', err);
            setWebhookResult({
                success: false,
                error: err.message || 'Failed to contact video brief service'
            });
        } finally {
            setIsGeneratingVideoBrief(false);
        }
    };

    // -------------------------------------------------------------
    // VIDEO WORKFLOW 2: RENDER FINAL VIDEO WITH VEO ENGINE
    // -------------------------------------------------------------
    const handleRenderVideo = async (jobIdToRender?: string) => {
        const targetJobId = jobIdToRender || activeVideoJob?.id;
        if (!targetJobId) return;

        setIsRenderingVideo(true);
        try {
            const res = await fetch('/api/ai/video-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'render',
                    jobId: targetJobId,
                    wantsSubtitles: videoWantsSubtitles,
                    subtitleStyle: videoSubtitleStyle,
                    shots_json: activeVideoJob?.shots_json,
                    voiceover_script: activeVideoJob?.voiceover_script,
                    renderWebhookUrl: videoRenderWebhookUrl.trim()
                })
            });

            const data = await res.json();
            if (data.success) {
                setActiveVideoJob((prev: any) => prev ? ({ ...prev, status: 'rendering' }) : prev);
                setWebhookResult({
                    success: true,
                    message: `Video render started (#${targetJobId.slice(0, 8)}). Veo AI generating clips and stitching final MP4.`
                });
                startPollingVideoJob(targetJobId);
            } else {
                setWebhookResult({
                    success: false,
                    error: data.error || 'Failed to trigger video render'
                });
                setIsRenderingVideo(false);
            }
        } catch (err: any) {
            console.error('Video render trigger error:', err);
            setWebhookResult({
                success: false,
                error: err.message || 'Failed to contact render service'
            });
            setIsRenderingVideo(false);
        }
    };

    // Update single shot prompt or text in active video job
    const handleUpdateShot = (shotIdx: number, field: 'prompt' | 'onScreenText', val: string) => {
        if (!activeVideoJob || !Array.isArray(activeVideoJob.shots_json)) return;
        const updated = activeVideoJob.shots_json.map((s: any, idx: number) => {
            if (idx === shotIdx) {
                return { ...s, [field]: val };
            }
            return s;
        });
        setActiveVideoJob({ ...activeVideoJob, shots_json: updated });
    };

    // Add or remove carousel slide
    const addCarouselSlide = () => {
        if (carouselSlides.length >= 6) return;
        const nextIdx = carouselSlides.length;
        setCarouselSlides([
            ...carouselSlides,
            {
                idx: nextIdx,
                title: `Slide ${nextIdx + 1}: Maintenance Tip`,
                caption: "Detailing key benefits and preventative protection for Dubai properties.",
                image_prompt: "High-end commercial photography of clean luxury villa interior in Dubai"
            }
        ]);
    };

    const removeCarouselSlide = (idxToRemove: number) => {
        if (carouselSlides.length <= 2) return;
        const filtered = carouselSlides
            .filter((_, i) => i !== idxToRemove)
            .map((slide, i) => ({ ...slide, idx: i }));
        setCarouselSlides(filtered);
    };

    const updateCarouselSlide = (idx: number, field: string, val: string) => {
        setCarouselSlides(carouselSlides.map((s, i) => i === idx ? { ...s, [field]: val } : s));
    };

    // Export to Ads Manager
    const handleExportToAdsManager = (imageUrl?: string) => {
        const primaryImage = imageUrl || (activeJob?.image_urls && activeJob.image_urls[0]) || null;
        const adDraft = {
            headline: generatedOutput.headline,
            primaryText: generatedOutput.caption,
            cta: isImageFormat ? "Get Offer" : "Learn More",
            objective: "Conversions",
            targetAudience: `Homeowners & Villa Residents in ${selectedLocation}`,
            productName: DUBAI_MAINTENANCE_SERVICES.find(s => s.id === selectedServiceId)?.name || "Spectra AC Servicing",
            platform: platforms.includes('facebook') || platforms.includes('instagram') ? 'meta' : 'google',
            imageUrl: primaryImage
        };

        try {
            localStorage.setItem("SPECTRA_PENDING_AD_DRAFT", JSON.stringify(adDraft));
            router.push("/dashboard/ads-manager?action=new-campaign");
        } catch (e) {
            console.error(e);
        }
    };

    // Download copy deck
    const handleDownloadDeck = () => {
        const textContent = `=====================================================
SPECTRA DUBAI - AI CREATIVE ASSET DECK
Generated: ${new Date().toLocaleString()}
Target Area: ${selectedLocation}
Format: ${format.toUpperCase()} (${resolution})
Model: ${selectedModel}
Service: ${DUBAI_MAINTENANCE_SERVICES.find(s => s.id === selectedServiceId)?.name}
Job ID: ${activeJob?.id || 'Draft'}
=====================================================

--- AD HEADLINE ---
${generatedOutput.headline}

--- SCROLL-STOPPING HOOK ---
${generatedOutput.hook}

--- PRIMARY AD TEXT / SOCIAL CAPTION ---
${generatedOutput.caption}

--- WHATSAPP CALL TO ACTION ---
Button Text: ${generatedOutput.ctaText}
Direct Message: "${generatedOutput.whatsappMessage}"

--- AI VISUAL PROMPT ---
Original Prompt:
${generatedOutput.visualPrompt}

Enhanced Prompt (by GPT-4.1-mini):
${activeJob?.enhanced_image_prompt || 'N/A'}

--- GENERATED ASSET URLS ---
${(activeJob?.image_urls || []).join('\n') || 'None generated yet'}

--- COST & BILLING BREAKDOWN ---
Model: ${activeJobCost.modelName} (${activeJobCost.provider.toUpperCase()})
Unit Rate: ${activeJobCost.formattedPerImage} per image
Images Generated: ${activeJobCost.count}
Total Job Cost: ${activeJobCost.formattedTotal} (AED)
`;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `spectra-dubai-${format}-creative-deck.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Download an image directly
    const handleDownloadImage = async (url: string, index: number) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `spectra-studio-${activeJob?.id?.slice(0, 8) || 'asset'}-${index + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (e) {
            window.open(url, '_blank');
        }
    };

    // Primary Action: Insert Job in Supabase & Dispatch to Webhook
    const handleGenerateAndDispatch = async () => {
        setIsGenerating(true);
        setJobStatus('pending');
        setWebhookResult(null);

        const currentService = DUBAI_MAINTENANCE_SERVICES.find(s => s.id === selectedServiceId);
        const styleObj = IMAGE_STYLES.find(s => s.id === imageStyle);
        const lightingObj = IMAGE_LIGHTING_OPTIONS.find(l => l.id === imageLighting);

        // 1. Synthesize tailored output based on format, service, and Dubai angle
        const newHeadline = format === 'video' 
            ? `Spectra AC Maintenance | 45-Min Emergency Arrival in Dubai` 
            : format === 'carousel'
            ? `5 Signs Your Dubai AC Is Clogged & Spiking DEWA Bills`
            : `${currentService?.name || 'AC Deep Servicing'} | Spectra Dubai Maintenance`;

        const newCaption = `Keep your Dubai home cool, mold-free, and energy-efficient. In Dubai's summer climate, regular AC coil and duct disinfection is essential to protect indoor air quality and slash DEWA bills.\n\n✨ Why 1,200+ Dubai Villa & Apartment Owners Rely on Spectra:\n✅ Certified HVAC & Facilities Engineers\n✅ Chemical coil pressure washing & free gas top-up\n✅ Rapid arrival within 45 mins across ${selectedLocation}\n✅ 30-Day cooling & workmanship warranty\n\n⚡ ${specialOffer}\n👉 Chat directly with our Dubai operations desk on WhatsApp to confirm your slot!\n\n#DubaiMaintenance #SpectraDubai #DubaiACRepair #DubaiVillas #${selectedLocation.replace(/[^a-zA-Z]/g, '')}`;

        const newVisualPrompt = isImageFormat
            ? `High-end commercial photography of ${currentService?.name} in a luxury Dubai villa in ${selectedLocation}. Modern architecture with floor-to-ceiling glass, ${lightingObj?.label || 'natural daylight'}. Professional HVAC technician in crisp navy Spectra uniform, ${styleObj?.desc || 'razor-sharp 8k details'}, Hasselblad H6D-100c, f/2.8, photorealistic --ar ${resolution === '1080x1080' ? '1:1' : resolution === '1080x1350' ? '4:5' : '16:9'} --v 6.1 --style raw`
            : `Cinematic 4K 60fps vertical commercial video reel showcasing ${currentService?.name} in Dubai. High-energy opening hook showing sweating homeowner with clogged AC, smooth transition to certified Spectra technician arriving in branded Mercedes Sprinter van in ${selectedLocation}, precision chemical wash, clean ice-cold 19°C airflow reveal, luxury villa backdrop.`;

        const updatedOutput = {
            headline: newHeadline,
            caption: newCaption,
            hook: `Stop paying high DEWA bills until you see this 1 AC maintenance fix in Dubai...`,
            visualPrompt: prompt.trim() || newVisualPrompt,
            ctaText: "WhatsApp Certified Engineer Now",
            whatsappMessage: `Hi Spectra Dubai, I saw your ad and would like to claim the ${specialOffer} in ${selectedLocation}.`,
            adStrengthScore: 98
        };
        setGeneratedOutput(updatedOutput);

        // Aspect ratio string expected by n8n workflow
        const aspectStr = resolution === '1080x1920' ? '9:16' : resolution === '1080x1080' ? '1:1' : resolution === '1080x1350' ? '4:5' : '16:9';

        // 2. Dispatch to dedicated studio-jobs API (Inserts in Supabase + Triggers n8n)
        try {
            const res = await fetch('/api/ai/studio-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    post_type: format === 'carousel' ? 'carousel' : 'image',
                    topic: `${currentService?.name || 'Maintenance'} in ${selectedLocation}`,
                    image_prompt: prompt.trim() || updatedOutput.visualPrompt,
                    model: selectedModel,
                    aspect_ratio: aspectStr,
                    variants: activeModelObj.maxVariants === 1 ? 1 : variantCount,
                    reference_image_url: referenceImageUrl.trim() || null,
                    slides_json: format === 'carousel' ? carouselSlides : [],
                    webhookUrl: webhookUrl.trim()
                })
            });

            const data = await res.json();
            if (data.success && data.job) {
                setActiveJob(data.job);
                setJobStatus(data.job.status || 'pending');
                setWebhookResult(data.webhookResult || {
                    success: data.webhookDispatched,
                    message: data.webhookDispatched 
                        ? `Job created (#${data.job.id.slice(0, 8)}) and dispatched to n8n webhook` 
                        : "Job created in Supabase. Connect your n8n webhook URL to auto-trigger generation."
                });

                // Start polling Supabase for completion
                startPollingJob(data.job.id);
            } else {
                setJobStatus('failed');
                setIsGenerating(false);
                setWebhookResult({
                    success: false,
                    error: data.error || "Failed to create studio job in database"
                });
            }
        } catch (err: any) {
            console.error("Studio job dispatch failed:", err);
            setJobStatus('failed');
            setIsGenerating(false);
            setWebhookResult({
                success: false,
                error: err.message || "Failed to contact studio job server"
            });
        }
    };

    const currentServiceObj = DUBAI_MAINTENANCE_SERVICES.find(s => s.id === selectedServiceId);

    // Active resolution options depending on format
    const currentResolutionOptions = useMemo(() => {
        if (isImageFormat) return IMAGE_RESOLUTIONS;
        if (isVideoFormat) return VIDEO_RESOLUTIONS;
        return IMAGE_RESOLUTIONS;
    }, [isImageFormat, isVideoFormat]);

    return (
        <div className="space-y-6 pb-16 max-w-7xl mx-auto font-sans">
            {/* Top Navigation Switcher */}
            <MarketingNavTabs />

            {/* Studio Header Bar */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-cyan-600/15 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-bold border border-white/15 flex items-center gap-1.5 backdrop-blur-md">
                                <Wind className="h-3.5 w-3.5 text-cyan-400" />
                                Spectra Dubai · AI Creative Studio
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                n8n + Supabase Job Queue
                            </span>
                            <a 
                                href="https://www.spectradubai.com/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors ml-1"
                            >
                                <span>spectradubai.com</span>
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                            <span className="p-2 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                                <Sparkles className="h-6 w-6" />
                            </span>
                            AI Marketing Creative Studio
                        </h1>
                        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                            Generate production-ready ad visuals and copy decks for Dubai property maintenance, backed by asynchronous n8n worker workflows and Supabase storage.
                        </p>
                    </div>

                    {/* Actions: History & Webhook Pill & Primary Dispatch Button */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-shrink-0 pt-2 lg:pt-0">
                        {/* Recent History Button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveOutputTab('history')}
                            className="bg-white/5 border-white/15 text-white hover:bg-white/10 text-xs font-semibold rounded-2xl h-11 px-3.5 gap-1.5 backdrop-blur-md"
                        >
                            <History className="h-4 w-4 text-cyan-300" />
                            <span>History ({recentJobs.length})</span>
                        </Button>

                        {/* Webhook Settings Pill */}
                        <button
                            type="button"
                            onClick={() => setIsWebhookModalOpen(true)}
                            className={`px-3.5 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm backdrop-blur-md h-11 ${
                                webhookUrl
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                                    : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${webhookUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                            <span className="truncate max-w-[130px] sm:max-w-none">
                                {webhookUrl ? 'Webhook Connected' : 'Configure Webhook'}
                            </span>
                            <Settings className="h-3.5 w-3.5 text-slate-300 ml-0.5" />
                        </button>

                        {/* Primary Generate Button */}
                        <Button
                            onClick={handleGenerateAndDispatch}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/30 h-11 px-5 text-sm gap-2 border border-white/20 transition-all"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                                    <span>
                                        {jobStatus === 'pending' ? 'Queued in Supabase...' : 'Synthesizing with AI...'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 text-cyan-200" />
                                    <span>Generate Creative</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Blueprints Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 overflow-x-auto scrollbar-none">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 flex-shrink-0 uppercase tracking-wider pl-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Dubai Blueprints:
                </span>
                <div className="flex items-center gap-2">
                    {SPECTRA_DUBAI_PRESETS.map((preset, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className="text-xs px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50/50 font-medium transition-all shadow-2xs flex items-center gap-2 flex-shrink-0"
                        >
                            <span>{preset.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                preset.format === 'image' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : preset.format === 'video'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {preset.format}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Webhook Response Notification Banner */}
            {webhookResult && (
                <div className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all shadow-sm ${
                    webhookResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                    <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            webhookResult.success ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                            {webhookResult.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                                {webhookResult.success 
                                    ? `Job Created in Supabase & Dispatched` 
                                    : "Studio Pipeline Notice"}
                                {webhookResult.latencyMs && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-mono font-medium">
                                        {webhookResult.latencyMs}ms
                                    </span>
                                )}
                            </h4>
                            <p className="text-xs text-slate-700">
                                {webhookResult.message || webhookResult.error || (webhookResult.url ? `Dispatched to ${webhookResult.url}` : '')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowPayloadModal(true)}
                            className="text-xs font-semibold bg-white border-slate-300 rounded-xl"
                        >
                            <Code className="h-3.5 w-3.5 mr-1.5 text-violet-600" />
                            Inspect Job
                        </Button>
                    </div>
                </div>
            )}

            {/* MAIN TWO-COLUMN STUDIO LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: The Step-by-Step Creation Engine (7 Cols) */}
                <div className="lg:col-span-7 min-w-0 space-y-5">
                    
                    {/* Progressive Step Navigation Header */}
                    <div className="p-2 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-1.5 sm:gap-2">
                        {[
                            { step: 1, label: "1. Asset Format", sub: format.toUpperCase() },
                            { step: 2, label: "2. Model & Specs", sub: activeModelObj.name },
                            { step: 3, label: "3. Prompt & Generate", sub: prompt ? "Prompt Ready" : "Drafting" }
                        ].map((s) => {
                            const isCurrent = activeStep === s.step;
                            const isCompleted = activeStep > s.step;
                            return (
                                <button
                                    key={s.step}
                                    type="button"
                                    onClick={() => setActiveStep(s.step as any)}
                                    className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-left transition-all flex items-center gap-2 ${
                                        isCurrent
                                            ? 'bg-violet-50 text-violet-950 font-bold border border-violet-300 shadow-2xs'
                                            : isCompleted
                                            ? 'text-slate-700 hover:bg-slate-50 font-medium'
                                            : 'text-slate-400 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                        isCurrent
                                            ? 'bg-violet-600 text-white'
                                            : isCompleted
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        {isCompleted ? <Check className="h-3 w-3" /> : s.step}
                                    </span>
                                    <div className="min-w-0 hidden sm:block">
                                        <div className="text-xs truncate">{s.label}</div>
                                        <div className="text-[10px] text-slate-400 truncate font-normal">{s.sub}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* STEP 1: Content Format Selection */}
                    {activeStep === 1 ? (
                        <Card className="border-slate-200 bg-white shadow-sm rounded-3xl overflow-hidden transition-all">
                            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-4 px-6 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                                            1
                                        </span>
                                        Creative Asset Format
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                                        Select asset type to automatically adapt aspect ratio and parameters.
                                    </CardDescription>
                                </div>
                                <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
                                    {format.toUpperCase()}
                                </span>
                            </CardHeader>

                            <CardContent className="p-5 space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {CREATIVE_FORMATS.map((item) => {
                                        const isSelected = format === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handleFormatChange(item.id as any)}
                                                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 ${
                                                    isSelected
                                                        ? 'bg-violet-50/80 border-violet-500 shadow-sm ring-2 ring-violet-500/20'
                                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}>
                                                        {item.id === 'image' && <ImageIcon className="h-4 w-4" />}
                                                        {item.id === 'video' && <Video className="h-4 w-4" />}
                                                        {item.id === 'carousel' && <Layers className="h-4 w-4" />}
                                                        {item.id === 'story' && <Smartphone className="h-4 w-4" />}
                                                    </div>
                                                    {isSelected && <CheckCircle2 className="h-4 w-4 text-violet-600" />}
                                                </div>

                                                <div>
                                                    <h4 className={`text-xs font-bold ${isSelected ? 'text-violet-950' : 'text-slate-900'}`}>
                                                        {item.label}
                                                    </h4>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        {item.aspect}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Informative Format Pill */}
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                                        {isImageFormat ? (
                                            <span><strong>Single Ad Image:</strong> High-res photorealistic visual rendering via OpenAI or Gemini with Supabase storage.</span>
                                        ) : format === 'carousel' ? (
                                            <span><strong>Educational Carousel:</strong> Multi-slide swipe deck with individual slide prompts & captions.</span>
                                        ) : (
                                            <span><strong>Motion Video / Story:</strong> Audio tracks, voiceover narration, and vertical 9:16 reels enabled.</span>
                                        )}
                                    </span>
                                </div>

                                {/* Advance to Step 2 Button */}
                                <div className="pt-2 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={() => setActiveStep(2)}
                                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl h-11 px-5 text-xs gap-1.5 shadow-sm"
                                    >
                                        <span>Continue to Model & Specs</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Step 1 Collapsed Summary Card */
                        <div 
                            onClick={() => setActiveStep(1)}
                            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                    <Check className="h-3.5 w-3.5" />
                                </span>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Step 1 Completed
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                        <span>Format: {format === 'image' ? 'Single Ad Image' : format === 'carousel' ? 'Educational Carousel' : format === 'video' ? 'Short-Form Video / Reel' : 'Full-Screen Story Ad'}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-mono font-medium border border-violet-200/60">
                                            {resolution}
                                        </span>
                                    </h4>
                                </div>
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-violet-600 font-semibold group-hover:bg-violet-50 rounded-xl"
                            >
                                Edit Format
                            </Button>
                        </div>
                    )}

                    {/* STEP 2: AI Model & Technical Direction */}
                    {activeStep < 2 ? (
                        /* Step 2 Locked Card */
                        <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 text-slate-400 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
                                    2
                                </span>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-600">AI Model & Technical Direction</h4>
                                    <p className="text-[11px] text-slate-400">Select asset format in Step 1 to unlock model and technical parameters.</p>
                                </div>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                                <Lock className="h-3 w-3" />
                                <span>Locked</span>
                            </span>
                        </div>
                    ) : activeStep === 2 ? (
                        /* Step 2 Expanded Card */
                        <Card className="border-slate-200 bg-white shadow-sm rounded-3xl overflow-hidden transition-all">
                            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-4 px-6 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                                            2
                                        </span>
                                        {isVideoFormat ? 'AI Video Engine & Shot Architecture' : 'AI Model & Technical Direction'}
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                                        {isVideoFormat 
                                            ? 'Configure Google Veo video generation engine, clip duration & OpenAI TTS-1 voiceover.' 
                                            : 'Select generation engine, resolution, variants, and visual atmosphere.'}
                                    </CardDescription>
                                </div>
                                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    {isVideoFormat ? `${activeVideoCost.formattedRate} · Est: ${activeVideoCost.formattedTotal}` : activeModelObj.priceEst}
                                </span>
                            </CardHeader>

                            <CardContent className="p-5 space-y-4">
                                {isVideoFormat ? (
                                    /* -------------------------------------------------------------
                                       VIDEO FORMAT SPECS: VEO ENGINES, SHOTS & TIMINGS
                                       ------------------------------------------------------------- */
                                    <div className="space-y-4">
                                        {/* Veo Video Engine Selection */}
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                    <Film className="h-3.5 w-3.5 text-violet-600" />
                                                    <span>Google Veo Video Engine</span>
                                                </Label>
                                                <span className="text-[11px] text-slate-500 font-mono">
                                                    Rate: {activeVideoCost.formattedRate}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                {VIDEO_AI_MODELS.map((m) => {
                                                    const isSelected = videoEngine === m.id;
                                                    const rate = m.ratesUsd[videoResolution] ?? 0.12;
                                                    const rateAed = +(rate * 3.6725).toFixed(2);
                                                    return (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            onClick={() => setVideoEngine(m.id)}
                                                            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[125px] relative group ${
                                                                isSelected
                                                                    ? 'bg-violet-50/90 border-violet-600 shadow-xs ring-2 ring-violet-500/20 text-slate-900'
                                                                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                                                            }`}
                                                        >
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center justify-between gap-1.5">
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200/70">
                                                                        {m.badge || 'Google'}
                                                                    </span>
                                                                    {isSelected && <CheckCircle2 className="h-4 w-4 text-violet-600 flex-shrink-0" />}
                                                                </div>
                                                                <h4 className="text-xs font-bold text-slate-900">{m.name.replace('Google · ', '')}</h4>
                                                                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{m.desc}</p>
                                                            </div>
                                                            <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                                                                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                                                    ${rate.toFixed(2)} (AED {rateAed.toFixed(2)})/s
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Video Shot Specs & Timings */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                                            {/* Shot Count */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-slate-700">Clips / Shot Count</Label>
                                                    <span className="text-[10px] text-slate-400 font-mono">1 to 6 shots</span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1.5">
                                                    {[2, 3, 4, 6].map((cnt) => (
                                                        <button
                                                            key={cnt}
                                                            type="button"
                                                            onClick={() => setVideoShotCount(cnt)}
                                                            className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                                                videoShotCount === cnt
                                                                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {cnt} Shots
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Duration per clip */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-slate-700">Clip Duration</Label>
                                                    <span className="text-[10px] text-slate-400 font-mono">Veo supported</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {[4, 6, 8].map((sec) => (
                                                        <button
                                                            key={sec}
                                                            type="button"
                                                            onClick={() => setVideoDurationS(sec)}
                                                            className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                                                videoDurationS === sec
                                                                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {sec}s / clip
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Resolution */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-slate-700">Resolution (9:16)</Label>
                                                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 rounded">
                                                        Total: {videoShotCount * videoDurationS}s
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {(['720p', '1080p', '4k'] as const).map((res) => (
                                                        <button
                                                            key={res}
                                                            type="button"
                                                            onClick={() => setVideoResolution(res)}
                                                            className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                                                videoResolution === res
                                                                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {res.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Audio, Narration & Subtitles Options */}
                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {/* Option 1: OpenAI TTS-1 Voiceover */}
                                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`p-2 rounded-xl transition-colors flex-shrink-0 ${videoWantsVoiceover ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                                            <Mic className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-bold text-slate-800 block truncate">OpenAI TTS-1 Voice</span>
                                                            <span className="text-[10px] text-slate-400 block truncate">Synthesizes speech script</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={videoWantsVoiceover}
                                                        onClick={() => setVideoWantsVoiceover(!videoWantsVoiceover)}
                                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                            videoWantsVoiceover ? 'bg-emerald-600' : 'bg-slate-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                videoWantsVoiceover ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>

                                                {/* Option 2: Background Music Track */}
                                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`p-2 rounded-xl transition-colors flex-shrink-0 ${videoWantsMusic ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'}`}>
                                                            <Music className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-bold text-slate-800 block truncate">Background Music</span>
                                                            <span className="text-[10px] text-slate-400 block truncate">UAE lifestyle soundscape</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={videoWantsMusic}
                                                        onClick={() => setVideoWantsMusic(!videoWantsMusic)}
                                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                            videoWantsMusic ? 'bg-violet-600' : 'bg-slate-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                videoWantsMusic ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>

                                                {/* Option 3: Dynamic Animated Subtitles */}
                                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`p-2 rounded-xl transition-colors flex-shrink-0 ${videoWantsSubtitles ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                                                            <Captions className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-bold text-slate-800 block truncate">Burned-In Subtitles</span>
                                                            <span className="text-[10px] text-slate-400 block truncate">Viral animated captions</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={videoWantsSubtitles}
                                                        onClick={() => setVideoWantsSubtitles(!videoWantsSubtitles)}
                                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                            videoWantsSubtitles ? 'bg-amber-500' : 'bg-slate-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                videoWantsSubtitles ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Subtitle Typography Preset Pills when enabled */}
                                            {videoWantsSubtitles && (
                                                <div className="flex flex-wrap items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950 gap-2">
                                                    <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                                                        <Captions className="h-3.5 w-3.5 text-amber-600" />
                                                        <span>Subtitle Style:</span>
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {[
                                                            { id: 'bold_yellow', label: 'Bold Yellow (Reels Pop)' },
                                                            { id: 'clean_white', label: 'Clean White (Modern)' },
                                                            { id: 'karaoke_pop', label: 'Karaoke Pop' }
                                                        ].map(st => (
                                                            <button
                                                                key={st.id}
                                                                type="button"
                                                                onClick={() => setVideoSubtitleStyle(st.id as any)}
                                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                                                    videoSubtitleStyle === st.id
                                                                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                {st.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* -------------------------------------------------------------
                                       IMAGE & CAROUSEL FORMAT SPECS
                                       ------------------------------------------------------------- */
                                    <div className="space-y-4">
                                <div className="space-y-2.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <Cpu className="h-3.5 w-3.5 text-violet-600" />
                                            <span>Image Generation Model</span>
                                        </Label>

                                        {/* Filter Tabs by Provider */}
                                        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-[11px]">
                                            <button
                                                type="button"
                                                onClick={() => setProviderFilter('all')}
                                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                                    providerFilter === 'all'
                                                        ? 'bg-white text-violet-900 shadow-2xs font-bold'
                                                        : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                            >
                                                All (8)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setProviderFilter('openai')}
                                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                                    providerFilter === 'openai'
                                                        ? 'bg-white text-violet-900 shadow-2xs font-bold'
                                                        : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                            >
                                                OpenAI (4)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setProviderFilter('google')}
                                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                                    providerFilter === 'google'
                                                        ? 'bg-white text-violet-900 shadow-2xs font-bold'
                                                        : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                            >
                                                Google Gemini (4)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 shadow-2xs space-y-3">
                                        {/* Balanced 2-Column Responsive Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {filteredModels.map((m) => {
                                                const isSelected = selectedModel === m.id;
                                                const isGoogle = m.provider === 'google';
                                                const cleanName = m.name.replace(/^(OpenAI · |Google · )/, '');
                                                const cleanPrice = m.priceEst.replace(' / image (est.)', '');

                                                return (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => setSelectedModel(m.id)}
                                                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[110px] relative group ${
                                                            isSelected
                                                                ? 'bg-violet-50/90 border-violet-600 shadow-xs ring-2 ring-violet-500/20 text-slate-900'
                                                                : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                                                        }`}
                                                    >
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between gap-1.5">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                                                        isGoogle 
                                                                            ? 'bg-sky-50 text-sky-700 border border-sky-200/70' 
                                                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200/70'
                                                                    }`}>
                                                                        {isGoogle ? 'Google' : 'OpenAI'}
                                                                    </span>
                                                                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-violet-950' : 'text-slate-900'}`}>
                                                                        {cleanName}
                                                                    </span>
                                                                </div>
                                                                {isSelected && (
                                                                    <CheckCircle2 className="h-4 w-4 text-violet-600 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                                                                {m.desc}
                                                            </p>
                                                        </div>

                                                        <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                                                            <span className="text-[10px] font-bold text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                                                                {cleanPrice}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                {m.maxVariants === 1 ? '1 variant' : 'Up to 4 variants'}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                                            <span>Official provider rates converted to UAE Dirhams (AED).</span>
                                            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-mono font-bold text-[10px]">
                                                Active: {selectedModel}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Variants & Platform Settings */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    {/* Variants Count */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-slate-700">Image Variants</Label>
                                            <span className="text-[10px] text-slate-400">
                                                {activeModelObj.provider === 'google' ? 'Gemini: 1 variant' : 'OpenAI: up to 4'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4].map((cnt) => {
                                                const isDisabled = cnt > activeModelObj.maxVariants;
                                                const isSelected = variantCount === cnt;
                                                return (
                                                    <button
                                                        key={cnt}
                                                        type="button"
                                                        disabled={isDisabled}
                                                        onClick={() => setVariantCount(cnt)}
                                                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                            isSelected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                                                : isDisabled
                                                                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {cnt}x
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Target Platforms */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700">Target Platforms</Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                { id: 'instagram', label: 'Instagram' },
                                                { id: 'facebook', label: 'Facebook' },
                                                ...(isImageFormat ? [{ id: 'google', label: 'Google' }] : []),
                                                { id: 'whatsapp', label: 'WhatsApp' }
                                            ].map((plt) => {
                                                const isSelected = platforms.includes(plt.id);
                                                return (
                                                    <button
                                                        key={plt.id}
                                                        type="button"
                                                        onClick={() => togglePlatform(plt.id)}
                                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                                                            isSelected
                                                                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="h-3 w-3" />}
                                                        <span>{plt.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Resolution & Aspect Ratio tailored to format */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-700">
                                            Resolution & Aspect Ratio
                                        </Label>
                                        <span className="text-[10px] text-slate-400">
                                            {isImageFormat ? 'Optimized for single image ads' : 'Optimized for motion ads'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {currentResolutionOptions.map((res: any) => {
                                            const isSelected = resolution === res.id;
                                            return (
                                                <button
                                                    key={res.id}
                                                    type="button"
                                                    onClick={() => setResolution(res.id)}
                                                    className={`p-2.5 rounded-xl border text-left transition-all ${
                                                        isSelected
                                                            ? 'bg-violet-50/80 border-violet-500 shadow-xs ring-1 ring-violet-500'
                                                            : 'bg-white border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-bold ${isSelected ? 'text-violet-950' : 'text-slate-800'}`}>
                                                            {res.label}
                                                        </span>
                                                        {res.recommended && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                                                Best
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                                                        {res.desc}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* CONDITIONAL SECTION: FOR IMAGES ONLY */}
                                {isImageFormat && (
                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <Palette className="h-3.5 w-3.5 text-violet-600" />
                                                Image Rendering Style & Art Direction
                                            </Label>
                                            <span className="text-[10px] text-slate-400">Studio aesthetic</span>
                                        </div>

                                        {/* Image Styles Grid */}
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {IMAGE_STYLES.map((st) => {
                                                const isSelected = imageStyle === st.id;
                                                return (
                                                    <button
                                                        key={st.id}
                                                        type="button"
                                                        onClick={() => setImageStyle(st.id)}
                                                        className={`p-3 rounded-2xl border text-left transition-all ${
                                                            isSelected
                                                                ? 'bg-violet-50/80 border-violet-500 shadow-xs ring-1 ring-violet-500'
                                                                : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-xs font-bold ${isSelected ? 'text-violet-950' : 'text-slate-900'}`}>
                                                                {st.label}
                                                            </span>
                                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-600 font-medium">
                                                                {st.badge}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                                            {st.desc}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Lighting & Atmosphere */}
                                        <div className="space-y-1.5 pt-1">
                                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <Sun className="h-3.5 w-3.5 text-amber-500" />
                                                Lighting & Atmosphere
                                            </Label>
                                            <select
                                                value={imageLighting}
                                                onChange={(e) => setImageLighting(e.target.value)}
                                                className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-white focus:border-violet-500 focus:outline-none"
                                            >
                                                {IMAGE_LIGHTING_OPTIONS.map((lt) => (
                                                    <option key={lt.id} value={lt.id}>
                                                        {lt.label} — {lt.desc}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Collapsible Advanced Negative Prompt for Image */}
                                        <div className="pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowAdvancedImageOptions(!showAdvancedImageOptions)}
                                                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold transition-colors"
                                            >
                                                <span>Negative Prompt Exclusions</span>
                                                {showAdvancedImageOptions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                            </button>

                                            {showAdvancedImageOptions && (
                                                <div className="mt-2 space-y-1">
                                                    <Input
                                                        value={negativePrompt}
                                                        onChange={(e) => setNegativePrompt(e.target.value)}
                                                        placeholder="Elements to exclude from visual generation"
                                                        className="text-xs h-9 rounded-xl font-mono text-slate-600"
                                                    />
                                                    <span className="text-[10px] text-slate-400">
                                                        Prevents low-resolution artifacts, unnatural uniforms, and distorted tools.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}



                                {/* Optional Reference Image URL (Image-to-Image / Restyle) */}
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowReferenceInput(!showReferenceInput)}
                                        className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold transition-colors"
                                    >
                                        <span>{showReferenceInput ? '− Hide Reference Image' : '+ Add Reference Image URL (Style Guide)'}</span>
                                        {referenceImageUrl && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
                                        )}
                                    </button>

                                    {showReferenceInput && (
                                        <div className="mt-2 space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-slate-700">Reference Image Public URL</Label>
                                                <Input
                                                    value={referenceImageUrl}
                                                    onChange={(e) => setReferenceImageUrl(e.target.value)}
                                                    placeholder="https://example.com/dubai-villa-reference.jpg"
                                                    className="text-xs h-9 bg-white font-mono"
                                                />
                                                <span className="text-[10px] text-slate-500 block">
                                                    Your n8n workflow will download this reference and run image editing/guided generation.
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            )}

                                {/* Step 2 Action Buttons */}
                                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveStep(1)}
                                        className="text-xs rounded-xl font-bold border-slate-200 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 gap-1.5 shadow-2xs transition-all"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5 text-slate-600" />
                                        <span>Back to Format</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={() => setActiveStep(3)}
                                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl h-11 px-5 text-xs gap-1.5 shadow-sm"
                                    >
                                        <span>Continue to Creative Prompt</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Step 2 Collapsed Summary Card */
                        <div 
                            onClick={() => setActiveStep(2)}
                            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                    <Check className="h-3.5 w-3.5" />
                                </span>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Step 2 Completed
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                        {isVideoFormat ? (
                                            <>
                                                <span>{activeVideoCost.modelName}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-medium border border-emerald-200/60">
                                                    {activeVideoCost.formattedRate}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    ({videoShotCount} shots · {videoDurationS}s/shot · {videoResolution} · {videoWantsSubtitles ? 'CC Subtitles' : 'No Subtitles'})
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{activeModelObj.name}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-medium border border-emerald-200/60">
                                                    {activeJobCost.formattedPerImage} / img
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    ({variantCount}x · {resolution})
                                                </span>
                                            </>
                                        )}
                                    </h4>
                                </div>
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-violet-600 font-semibold group-hover:bg-violet-50 rounded-xl"
                            >
                                Edit Specs
                            </Button>
                        </div>
                    )}

                    {/* STEP 3: Creative Brief & Generation */}
                    {activeStep < 3 ? (
                        /* Step 3 Locked Card */
                        <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 text-slate-400 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
                                    3
                                </span>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-600">Creative Brief & Production</h4>
                                    <p className="text-[11px] text-slate-400">Complete Steps 1 & 2 to enter visual brief and generate assets.</p>
                                </div>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                                <Lock className="h-3 w-3" />
                                <span>Locked</span>
                            </span>
                        </div>
                    ) : (
                        /* Step 3 Expanded Card */
                        <Card className="border-slate-200 bg-white shadow-sm rounded-3xl overflow-hidden transition-all">
                            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-4 px-6 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                                            3
                                        </span>
                                        {isVideoFormat ? 'Video Storyboard Brief & Render' : 'Creative Brief & Prompt'}
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                                        {isVideoFormat 
                                            ? 'Enter campaign angle. Stage 1 synthesizes shot breakdown & voiceover; Stage 2 renders clips.' 
                                            : 'Describe your visual concept. AI prompt enhancer can refine details before rendering.'}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                                        <Receipt className="h-3 w-3 text-emerald-600" />
                                        <span>Cost: {isVideoFormat ? activeVideoCost.formattedTotal : activeJobCost.formattedTotal}</span>
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="p-5 space-y-4">
                                {/* The Main Prompt Input */}
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Label className="text-xs font-bold text-slate-700">
                                            Creative Brief / Visual Prompt Description
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                {prompt.length} chars
                                            </span>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleEnhancePrompt}
                                                disabled={isEnhancingPrompt || !prompt.trim()}
                                                className="h-7 text-[11px] px-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                                            >
                                                {isEnhancingPrompt ? (
                                                    <>
                                                        <RefreshCw className="h-3 w-3 animate-spin text-white" />
                                                        <span>Enhancing with AI...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-3 w-3 text-cyan-300" />
                                                        <span>Enhance Prompt with AI</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {promptEnhancedNotification && (
                                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold flex items-center gap-2 animate-fadeIn">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                            <span>Prompt enhanced! Review or refine details before generating visuals.</span>
                                        </div>
                                    )}

                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        rows={4}
                                        placeholder="Show a luxury Dubai villa living room with cool blue refreshing airflow emerging from pristine AC vents. Contrast split showing clogged dusty coil filters vs sparkling clean sanitized HVAC system. Bold text overlay: Beat Dubai Summer - AED 199 AC Deep Clean + Free Gas Pressure Check."
                                        className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none leading-relaxed bg-slate-50/50 text-slate-900 placeholder:text-slate-400 font-normal"
                                    />

                                    {/* 1-Click Prompt Enhancer Chips */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                                            <Sparkles className="h-3 w-3 text-violet-500" />
                                            Add Hook:
                                        </span>
                                        {[
                                            "+ Dubai Villa Interior",
                                            "+ Photorealistic HVAC Engineer",
                                            "+ Clogged vs Sanitized Coil Split",
                                            "+ Cool Cyan Airflow Lines",
                                            "+ High DEWA Bill Spike",
                                            "+ 4K Commercial Lighting"
                                        ].map((chip, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => appendPromptTag(chip.replace('+', '').trim())}
                                                className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 transition-colors border border-slate-200/60"
                                            >
                                                {chip}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Carousel Slides Editor (If carousel format) */}
                                {format === 'carousel' && (
                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <Layers className="h-3.5 w-3.5 text-violet-600" />
                                                Carousel Slides Configuration ({carouselSlides.length} Slides)
                                            </Label>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={addCarouselSlide}
                                                disabled={carouselSlides.length >= 6}
                                                className="text-[11px] h-7 px-2.5 rounded-lg border-violet-200 text-violet-700 hover:bg-violet-50"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Slide
                                            </Button>
                                        </div>
                                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                            {carouselSlides.map((slide, sIdx) => (
                                                <div key={sIdx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                                                    <div className="flex items-center justify-between font-bold text-slate-700">
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
                                                                {sIdx + 1}
                                                            </span>
                                                            Slide {sIdx + 1}
                                                        </span>
                                                        {carouselSlides.length > 2 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeCarouselSlide(sIdx)}
                                                                className="text-slate-400 hover:text-rose-600"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        <Input
                                                            value={slide.title}
                                                            onChange={(e) => updateCarouselSlide(sIdx, 'title', e.target.value)}
                                                            placeholder="Slide Headline"
                                                            className="h-8 text-xs bg-white"
                                                        />
                                                        <Input
                                                            value={slide.caption}
                                                            onChange={(e) => updateCarouselSlide(sIdx, 'caption', e.target.value)}
                                                            placeholder="Slide Caption / Body Text"
                                                            className="h-8 text-xs bg-white"
                                                        />
                                                    </div>
                                                    <Input
                                                        value={slide.image_prompt}
                                                        onChange={(e) => updateCarouselSlide(sIdx, 'image_prompt', e.target.value)}
                                                        placeholder="Visual prompt description for this specific slide"
                                                        className="h-8 text-xs bg-white font-mono"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 Action Buttons & Primary Generate */}
                                <div className="pt-2 space-y-3 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveStep(2)}
                                            className="text-xs rounded-xl font-semibold border-slate-200 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 gap-1.5 shadow-2xs"
                                        >
                                            <ArrowLeft className="h-3.5 w-3.5" />
                                            <span>Back to Specs</span>
                                        </Button>

                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <span>Est. Job Total:</span>
                                            <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                                                {isVideoFormat ? activeVideoCost.formattedTotal : activeJobCost.formattedTotal}
                                            </span>
                                        </div>
                                    </div>

                                    {isVideoFormat ? (
                                        /* -------------------------------------------------------------
                                           VIDEO ACTION BUTTONS (WORKFLOW 1 BRIEF & WORKFLOW 2 RENDER)
                                           ------------------------------------------------------------- */
                                        <div className="space-y-2">
                                            {isRenderingVideo || activeVideoJob?.status === 'rendering' ? (
                                                <div className="space-y-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleRefreshVideoStatus()}
                                                        disabled={isRefreshingVideoStatus}
                                                        className="w-full h-12 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-md text-sm gap-2"
                                                    >
                                                        <RefreshCw className={`h-4 w-4 ${isRefreshingVideoStatus ? 'animate-spin' : ''}`} />
                                                        <span>{isRefreshingVideoStatus ? 'Checking Video Engine...' : 'Check Video Render Status (Railway)'}</span>
                                                    </Button>
                                                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                                                        <span>Rendering clips on Railway Veo engine...</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRefreshVideoStatus()}
                                                            disabled={isRefreshingVideoStatus}
                                                            className="text-cyan-600 hover:underline font-semibold"
                                                        >
                                                            Refresh Now
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (activeVideoJob?.output_video_url || activeVideoJob?.final_video_url || activeVideoJob?.status === 'completed') ? (
                                                <div className="space-y-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveOutputTab('visual_assets');
                                                            handleRefreshVideoStatus();
                                                        }}
                                                        className="w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold rounded-2xl shadow-md text-sm gap-2"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        <span>Video Render Ready · View Reel in Studio</span>
                                                    </Button>
                                                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                                                        <span>Rendered with Google Veo AI</span>
                                                        <button
                                                            type="button"
                                                            onClick={handleGenerateVideoBrief}
                                                            disabled={isGeneratingVideoBrief}
                                                            className="text-violet-600 hover:underline font-semibold"
                                                        >
                                                            Create New Brief
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (!activeVideoJob || activeVideoJob.status !== 'draft_ready') ? (
                                                <Button
                                                    onClick={handleGenerateVideoBrief}
                                                    disabled={isGeneratingVideoBrief}
                                                    className="w-full h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-violet-500/20 text-sm gap-2"
                                                >
                                                    {isGeneratingVideoBrief ? (
                                                        <>
                                                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                                                            <span>Workflow 1: Synthesizing Brief & Voiceover...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap className="h-4 w-4 text-amber-300" />
                                                            <span>Generate Video Brief & Voiceover (Stage 1)</span>
                                                        </>
                                                    )}
                                                </Button>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Button
                                                        onClick={() => handleRenderVideo()}
                                                        disabled={isRenderingVideo}
                                                        className="w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-500/20 text-sm gap-2"
                                                    >
                                                        {isRenderingVideo ? (
                                                            <>
                                                                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                                                                <span>Workflow 2: Railway Veo Engine Rendering Video...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Film className="h-4 w-4" />
                                                                <span>Render Final Video with Veo Engine ({activeVideoCost.formattedTotal})</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                                                        <span>Brief ready with {activeVideoJob.shots_json?.length || videoShotCount} shots</span>
                                                        <button
                                                            type="button"
                                                            onClick={handleGenerateVideoBrief}
                                                            disabled={isGeneratingVideoBrief}
                                                            className="text-violet-600 hover:underline font-semibold"
                                                        >
                                                            Re-generate Brief
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* -------------------------------------------------------------
                                           IMAGE / CAROUSEL PRIMARY GENERATE BUTTON
                                           ------------------------------------------------------------- */
                                        <Button
                                            onClick={handleGenerateAndDispatch}
                                            disabled={isGenerating}
                                            className="w-full h-12 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white font-bold rounded-2xl shadow-md shadow-violet-500/20 text-sm gap-2"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                    <span>
                                                        {jobStatus === 'pending'
                                                            ? 'Queueing Job in Supabase...'
                                                            : 'n8n Worker Generating Images & Enhancing Prompt...'}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4" />
                                                    <span>Generate Visuals via n8n & Supabase</span>
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* RIGHT COLUMN: AI Production Output, Gallery & Copy Deck (5 Cols) */}
                <div className="lg:col-span-5 min-w-0 space-y-5">
                    
                    {/* Main Creative Deck Card */}
                    <Card className="border-slate-200 bg-white shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-4 px-5 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-violet-600 text-white">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-900">
                                        Creative Production Output
                                    </CardTitle>
                                    <CardDescription className="text-[11px] text-slate-500">
                                        {format.toUpperCase()} · {resolution} · {isVideoFormat ? (activeVideoJob?.engine || videoEngine) : selectedModel}
                                    </CardDescription>
                                </div>
                            </div>
                            
                            {/* Live Job Status & Cost Badge */}
                            <div className="flex flex-wrap items-center gap-2">
                                {isVideoFormat ? (
                                    activeVideoJob && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold shadow-2xs">
                                            <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Est. Cost: {activeVideoCost.formattedTotal}</span>
                                        </div>
                                    )
                                ) : (
                                    activeJob?.status === 'done' && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold shadow-2xs">
                                            <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Job Cost: {activeJobCost.formattedTotal}</span>
                                            {activeJobCost.count > 1 && (
                                                <span className="text-[10px] text-emerald-600/80 font-normal">
                                                    ({activeJobCost.count} × {activeJobCost.formattedPerImage})
                                                </span>
                                            )}
                                        </div>
                                    )
                                )}

                                {isVideoFormat && activeVideoJob && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRefreshVideoStatus()}
                                        disabled={isRefreshingVideoStatus}
                                        className="h-7 text-[11px] px-2.5 rounded-xl border-slate-200 hover:border-violet-300 text-slate-700 hover:text-violet-700 bg-white shadow-2xs gap-1.5 transition-all"
                                        title="Fetch latest render status directly from Railway video engine"
                                    >
                                        <RefreshCw className={`h-3 w-3 ${isRefreshingVideoStatus ? 'animate-spin text-violet-600' : 'text-slate-500'}`} />
                                        <span>{isRefreshingVideoStatus ? 'Checking...' : 'Refresh Video Status'}</span>
                                    </Button>
                                )}

                                {isVideoFormat ? (
                                    isGeneratingVideoBrief ? (
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200 flex items-center gap-1.5">
                                            <RefreshCw className="h-3 w-3 animate-spin text-violet-600" />
                                            <span>Briefing...</span>
                                        </span>
                                    ) : isRenderingVideo || activeVideoJob?.status === 'rendering' ? (
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1.5">
                                            <RefreshCw className="h-3 w-3 animate-spin text-cyan-600" />
                                            <span>Rendering Veo...</span>
                                        </span>
                                    ) : activeVideoJob?.output_video_url || activeVideoJob?.final_video_url || activeVideoJob?.status === 'completed' ? (
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                                            <span>Video Ready</span>
                                        </span>
                                    ) : activeVideoJob?.status === 'draft_ready' ? (
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3 text-violet-600" />
                                            <span>Brief Ready</span>
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                            <Clock className="h-3 w-3 text-slate-500" />
                                            <span>Draft</span>
                                        </span>
                                    )
                                ) : (
                                    isGenerating ? (
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200 flex items-center gap-1.5">
                                            <RefreshCw className="h-3 w-3 animate-spin text-violet-600" />
                                            <span>Generating...</span>
                                        </span>
                                    ) : activeJob?.status === 'done' ? (
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                                            <span>Ready</span>
                                        </span>
                                    ) : activeJob?.status === 'failed' ? (
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3 text-rose-600" />
                                            <span>Failed</span>
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                            <Clock className="h-3 w-3 text-slate-500" />
                                            <span>Draft</span>
                                        </span>
                                    )
                                )}
                            </div>
                        </CardHeader>

                        {/* Status Feedback Banner */}
                        {videoStatusFeedback && (
                            <div className="mx-5 mt-3 p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-900 text-xs font-medium flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-violet-600 flex-shrink-0" />
                                    <span>{videoStatusFeedback}</span>
                                </div>
                                <button type="button" onClick={() => setVideoStatusFeedback(null)} className="text-violet-400 hover:text-violet-700 text-xs font-bold px-1">
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* Output Sub-Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50/40 px-5 pt-2 gap-2 text-xs overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveOutputTab('visual_assets')}
                                className={`pb-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 px-2 ${
                                    activeOutputTab === 'visual_assets'
                                        ? 'border-violet-600 text-violet-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {isVideoFormat ? <Film className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                                <span>{isVideoFormat ? 'Video Storyboard' : 'AI Visual Assets'}</span>
                                {isVideoFormat ? (
                                    activeVideoJob?.shots_json && (
                                        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-violet-100 text-violet-700 text-[10px]">
                                            {activeVideoJob.shots_json.length} Shots
                                        </span>
                                    )
                                ) : (
                                    activeJob?.image_urls && activeJob.image_urls.length > 0 && (
                                        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-violet-100 text-violet-700 text-[10px]">
                                            {activeJob.image_urls.length}
                                        </span>
                                    )
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveOutputTab('copy')}
                                className={`pb-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 px-2 ${
                                    activeOutputTab === 'copy'
                                        ? 'border-violet-600 text-violet-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Copy Deck</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveOutputTab('visual_prompt')}
                                className={`pb-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 px-2 ${
                                    activeOutputTab === 'visual_prompt'
                                        ? 'border-violet-600 text-violet-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Enhanced Prompt</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveOutputTab('history')}
                                className={`pb-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 px-2 ${
                                    activeOutputTab === 'history'
                                        ? 'border-violet-600 text-violet-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <History className="h-3.5 w-3.5" />
                                <span>History</span>
                                {recentJobs.length > 0 && (
                                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                                        {recentJobs.length}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveOutputTab('webhook')}
                                className={`pb-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 px-2 ${
                                    activeOutputTab === 'webhook'
                                        ? 'border-violet-600 text-violet-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Code className="h-3.5 w-3.5" />
                                <span>Job State</span>
                            </button>
                        </div>

                        <CardContent className="p-5 space-y-4">
                            
                            {/* TAB 0: AI VISUAL ASSETS (GENERATED IMAGES & CAROUSEL SLIDES) */}
                            {activeOutputTab === 'visual_assets' && (
                                <div className="space-y-4">
                                    {isVideoFormat ? (
                                        /* -------------------------------------------------------------
                                           VIDEO PRODUCTION TAB: STORYBOARD, AUDIO & FINAL RENDER
                                           ------------------------------------------------------------- */
                                        <div className="space-y-4">
                                            {/* Progress State: Generating Brief or Rendering Video */}
                                            {isGeneratingVideoBrief ? (
                                                <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 text-center space-y-3">
                                                    <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
                                                        <RefreshCw className="h-6 w-6 animate-spin text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-violet-950">
                                                            Synthesizing Video Brief & Storyboard
                                                        </h4>
                                                        <p className="text-xs text-violet-700 mt-1 max-w-sm mx-auto">
                                                            GPT-4o is crafting shot cinematography, pacing, on-screen copy & OpenAI TTS-1 voiceover...
                                                        </p>
                                                    </div>
                                                    <div className="text-[11px] font-mono text-slate-500 bg-white/70 py-1.5 px-3 rounded-xl inline-block border border-violet-200">
                                                        Workflow: spectra-video-brief
                                                    </div>
                                                </div>
                                            ) : isRenderingVideo || activeVideoJob?.status === 'rendering' ? (
                                                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-50 to-emerald-50 border border-cyan-200 text-center space-y-3.5">
                                                    <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30">
                                                        <Film className="h-6 w-6 animate-pulse text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-cyan-950">
                                                            Veo AI Rendering Video Clips
                                                        </h4>
                                                        <p className="text-xs text-cyan-800 mt-1 max-w-sm mx-auto">
                                                            Railway render engine is generating {activeVideoJob?.shots_json?.length || videoShotCount} Veo clips and stitching audio via FFmpeg...
                                                        </p>
                                                    </div>

                                                    {/* Dynamic Render Progress from Railway */}
                                                    {activeVideoJob?.render_progress && (
                                                        <div className="max-w-xs mx-auto space-y-1.5 pt-1">
                                                            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-900">
                                                                <span className="capitalize">{activeVideoJob.render_progress.stage || 'Rendering'}</span>
                                                                <span className="font-bold">{activeVideoJob.render_progress.percent || 0}%</span>
                                                            </div>
                                                            <div className="w-full bg-cyan-200/60 rounded-full h-2 overflow-hidden">
                                                                <div 
                                                                    className="bg-cyan-600 h-2 rounded-full transition-all duration-500" 
                                                                    style={{ width: `${activeVideoJob.render_progress.percent || 0}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                                        <div className="text-[11px] font-mono text-slate-500 bg-white/80 py-1.5 px-3 rounded-xl border border-cyan-200">
                                                            Workflow 2: spectra-video-render · #{activeVideoJob?.id?.slice(0, 8)}
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => handleRefreshVideoStatus()}
                                                            disabled={isRefreshingVideoStatus}
                                                            className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs h-8 px-3.5 rounded-xl shadow-xs gap-1.5"
                                                        >
                                                            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingVideoStatus ? 'animate-spin' : ''}`} />
                                                            <span>{isRefreshingVideoStatus ? 'Checking Railway Engine...' : 'Check Render Status'}</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (activeVideoJob?.output_video_url || activeVideoJob?.final_video_url) ? (
                                                /* FINAL RENDERED VIDEO PLAYER */
                                                <div className="space-y-3">
                                                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 shadow-md p-2">
                                                        <video
                                                            controls
                                                            playsInline
                                                            className="w-full rounded-xl aspect-[9/16] max-h-[500px] mx-auto bg-black"
                                                            src={activeVideoJob.output_video_url || activeVideoJob.final_video_url}
                                                        />
                                                        <div className="p-3 flex flex-wrap items-center justify-between gap-2">
                                                            <div>
                                                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                                                    <span>Final Render Complete</span>
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                                                    {activeVideoJob.engine} · {activeVideoJob.resolution} · {
                                                                        activeVideoJob.actual_cost_usd !== undefined && activeVideoJob.actual_cost_usd !== null
                                                                            ? `Actual Cost: $${Number(activeVideoJob.actual_cost_usd).toFixed(2)} (AED ${(Number(activeVideoJob.actual_cost_usd) * 3.6725).toFixed(2)})`
                                                                            : activeVideoCost.formattedTotal
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRefreshVideoStatus()}
                                                                    disabled={isRefreshingVideoStatus}
                                                                    className="text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg h-8 px-2.5"
                                                                    title="Re-check status and metrics from Railway engine"
                                                                >
                                                                    <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshingVideoStatus ? 'animate-spin text-cyan-400' : ''}`} />
                                                                    <span>Sync</span>
                                                                </Button>
                                                                <a
                                                                    href={activeVideoJob.output_video_url || activeVideoJob.final_video_url}
                                                                    download={`spectra-reel-${activeVideoJob.id.slice(0, 8)}.mp4`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                                                                >
                                                                    <Download className="h-3.5 w-3.5" />
                                                                    <span>Download MP4</span>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* Storyboard Review & Action Section */}
                                            {activeVideoJob ? (
                                                <div className="space-y-4">
                                                    {/* Stage 1 Draft Ready Banner */}
                                                    {activeVideoJob.status === 'draft_ready' && !(activeVideoJob.output_video_url || activeVideoJob.final_video_url) && (
                                                        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                                                            <div className="flex items-center gap-2.5">
                                                                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                                                <div>
                                                                    <span className="text-xs font-bold text-emerald-950 block">
                                                                        Stage 1 Complete: Video Storyboard & Voiceover Ready
                                                                    </span>
                                                                    <span className="text-[11px] text-emerald-700">
                                                                        Review the shots below, edit any prompt or text, then render final video.
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleRenderVideo()}
                                                                disabled={isRenderingVideo}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-8 px-3.5 gap-1.5 shadow-xs flex-shrink-0"
                                                            >
                                                                <Play className="h-3.5 w-3.5" />
                                                                <span>Render Video ({activeVideoCost.formattedTotal})</span>
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Voiceover Script & Audio Player */}
                                                    {(activeVideoJob.voiceover_script || activeVideoJob.voiceover_url) && (
                                                        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                                                    <Mic className="h-3.5 w-3.5 text-indigo-600" />
                                                                    <span>Voiceover Narration (OpenAI TTS-1)</span>
                                                                </span>
                                                                {activeVideoJob.voiceover_url && (
                                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                                                        Audio Ready
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {activeVideoJob.voiceover_script && (
                                                                <p className="text-xs text-indigo-900 leading-relaxed italic bg-white/70 p-2.5 rounded-xl border border-indigo-100">
                                                                    "{activeVideoJob.voiceover_script}"
                                                                </p>
                                                            )}
                                                            {activeVideoJob.voiceover_url && (
                                                                <div className="pt-1">
                                                                    <audio controls className="w-full h-8" src={activeVideoJob.voiceover_url} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Shot-by-Shot Storyboard Cards */}
                                                    <div className="space-y-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                                <Film className="h-3.5 w-3.5 text-violet-600" />
                                                                <span>Shot-by-Shot Storyboard ({activeVideoJob.shots_json?.length || 0} Clips)</span>
                                                            </span>
                                                            <span className="text-[11px] text-slate-500 font-mono">
                                                                {activeVideoJob.engine || videoEngine} · {activeVideoJob.resolution || videoResolution}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                                                            {Array.isArray(activeVideoJob.shots_json) && activeVideoJob.shots_json.map((shot: any, sIdx: number) => (
                                                                <div key={sIdx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                                                            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                                                                                {shot.index || sIdx + 1}
                                                                            </span>
                                                                            <span>Shot {shot.index || sIdx + 1}</span>
                                                                        </span>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-[10px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-md">
                                                                                {shot.durationS || videoDurationS}s
                                                                            </span>
                                                                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                                                                                AED {+((shot.costUsd || 0.48) * 3.6725).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                                            On-Screen Text Hook
                                                                        </Label>
                                                                        <Input
                                                                            value={shot.onScreenText || ''}
                                                                            onChange={(e) => handleUpdateShot(sIdx, 'onScreenText', e.target.value)}
                                                                            className="text-xs h-8 bg-white font-semibold text-slate-800"
                                                                            placeholder="Hook or caption displayed on screen"
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                                            Veo AI Camera & Visual Direction
                                                                        </Label>
                                                                        <textarea
                                                                            value={shot.prompt || ''}
                                                                            onChange={(e) => handleUpdateShot(sIdx, 'prompt', e.target.value)}
                                                                            rows={2}
                                                                            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono leading-relaxed resize-none text-slate-700"
                                                                            placeholder="Cinematography, subject, lighting, and action details"
                                                                        />
                                                                    </div>
                                                                </div>
                              ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : !isGeneratingVideoBrief && (
                                                <div className="py-12 px-4 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                                                    <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                                        <Film className="h-6 w-6" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-bold text-slate-800">
                                                            No Video Brief Generated Yet
                                                        </h4>
                                                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                                            Configure your Google Veo engine and shot counts in Step 2, then click <strong>Generate Video Brief</strong> to start Stage 1.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={handleGenerateVideoBrief}
                                                        disabled={isGeneratingVideoBrief}
                                                        className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold gap-1.5"
                                                    >
                                                        <Zap className="h-3.5 w-3.5 text-amber-300" />
                                                        <span>Start Video Brief Generation</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                    {/* Real-time Status Card */}
                                    {isGenerating ? (
                                        <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 text-center space-y-3">
                                            <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
                                                <RefreshCw className="h-6 w-6 animate-spin" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-violet-950">
                                                    Generating Creative with {activeModelObj.name}
                                                </h4>
                                                <p className="text-xs text-violet-700 mt-1 max-w-sm mx-auto">
                                                    {jobStatus === 'pending'
                                                        ? 'Job queued in Supabase. Waiting for n8n worker...'
                                                        : 'GPT-4.1-mini enhanced your prompt. Image model is rendering and uploading to Supabase Storage.'}
                                                </p>
                                            </div>
                                            <div className="text-[11px] font-mono text-slate-500 bg-white/70 py-1.5 px-3 rounded-xl inline-block border border-violet-200">
                                                Job ID: {activeJob?.id || 'Allocating...'}
                                            </div>
                                        </div>
                                    ) : activeJob?.status === 'failed' ? (
                                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-2">
                                            <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                                                <AlertCircle className="h-4 w-4 text-rose-600" />
                                                <span>Image Generation Failed</span>
                                            </div>
                                            <p className="text-xs text-rose-700 leading-relaxed font-mono">
                                                {activeJob?.error_detail || activeJob?.error_message || "The generation pipeline encountered an error. Check n8n execution log."}
                                            </p>
                                            <Button
                                                size="sm"
                                                onClick={handleGenerateAndDispatch}
                                                className="mt-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                                            >
                                                Retry Generation
                                            </Button>
                                        </div>
                                    ) : activeJob?.image_urls && activeJob.image_urls.length > 0 ? (
                                        <div className="space-y-4">
                                            {/* Enhanced Prompt Callout if Available */}
                                            {activeJob?.enhanced_image_prompt && (
                                                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                                                    <div className="flex items-center justify-between text-emerald-900 font-bold text-[11px]">
                                                        <span className="flex items-center gap-1">
                                                            <Sparkles className="h-3 w-3 text-emerald-600" />
                                                            Prompt Enhanced by GPT-4.1-mini:
                                                        </span>
                                                        <button
                                                            onClick={() => copyText(activeJob.enhanced_image_prompt, 'enhanced-p')}
                                                            className="text-emerald-700 hover:underline text-[10px]"
                                                        >
                                                            {copiedKey === 'enhanced-p' ? 'Copied' : 'Copy'}
                                                        </button>
                                                    </div>
                                                    <p className="text-emerald-800 line-clamp-2 italic">
                                                        "{activeJob.enhanced_image_prompt}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Generated Visual Assets Preview */}
                                            {activeJob.image_urls.length === 1 ? (
                                                /* Hero Single Variant Preview (Spacious & Clean) */
                                                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 shadow-sm transition-all">
                                                    <div className="aspect-[4/5] sm:aspect-square relative overflow-hidden bg-slate-950 flex items-center justify-center group">
                                                        {!imageLoadErrors[activeJob.image_urls[0]] ? (
                                                            <img
                                                                src={getDisplayImageUrl(activeJob.image_urls[0])}
                                                                alt="Spectra Generated Asset"
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                                                                onError={() => setImageLoadErrors(prev => ({ ...prev, [activeJob.image_urls[0]]: true }))}
                                                            />
                                                        ) : (
                                                            <div className="p-4 text-center text-slate-300 space-y-2">
                                                                <AlertCircle className="h-6 w-6 text-amber-400 mx-auto" />
                                                                <span className="text-xs font-bold text-white block">Preview Access Blocked</span>
                                                                <p className="text-[10px] text-slate-400 font-mono break-all max-w-xs mx-auto">{activeJob.image_urls[0]}</p>
                                                                <div className="flex items-center justify-center gap-2 pt-1">
                                                                    <a
                                                                        href={activeJob.image_urls[0].replace(/https:\/\/[a-z0-9]+\.supabase\.co/i, 'https://cnjdinmwpfqkbfarsbxv.supabase.co')}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-[10px] bg-white/10 hover:bg-white/20 text-cyan-300 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1"
                                                                    >
                                                                        <span>Open File</span>
                                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setImageLoadErrors(prev => ({ ...prev, [activeJob.image_urls[0]]: false }))}
                                                                        className="text-[10px] bg-violet-600 hover:bg-violet-700 text-white px-2.5 py-1 rounded-md font-semibold"
                                                                    >
                                                                        Retry
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!imageLoadErrors[activeJob.image_urls[0]] && (
                                                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-3 backdrop-blur-[2px]">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setLightboxImageUrl(activeJob.image_urls[0])}
                                                                    className="p-2.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 shadow-md transition-transform hover:scale-105"
                                                                    title="View full size"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDownloadImage(getDisplayImageUrl(activeJob.image_urls[0]), 0)}
                                                                    className="p-2.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 shadow-md transition-transform hover:scale-105"
                                                                    title="Download image"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyText(activeJob.image_urls[0], 'img-url-hero')}
                                                                    className="p-2.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 shadow-md transition-transform hover:scale-105"
                                                                    title="Copy public URL"
                                                                >
                                                                    {copiedKey === 'img-url-hero' ? (
                                                                                <Check className="h-4 w-4 text-emerald-600" />
                                                                    ) : (
                                                                                <Copy className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Hero Bottom Meta Toolbar */}
                                                    <div className="p-3 bg-white flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-800">
                                                                Variant #1
                                                            </span>
                                                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                                                                <Receipt className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                                                                <span>{activeJobCost.formattedPerImage}</span>
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                                                {activeJob.aspect_ratio || resolution}
                                                            </span>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleExportToAdsManager(activeJob.image_urls[0])}
                                                            className="h-8 text-xs px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 shadow-2xs"
                                                        >
                                                            <Megaphone className="h-3.5 w-3.5 text-cyan-400" />
                                                            <span>Use in Ad Campaign</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Multi-Variant 2-Column Grid */
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {activeJob.image_urls.map((imgUrl: string, idx: number) => {
                                                        const displaySrc = getDisplayImageUrl(imgUrl);
                                                        const hasError = imageLoadErrors[imgUrl];

                                                        return (
                                                            <div 
                                                                key={idx}
                                                                className="group relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 shadow-sm transition-all hover:shadow-md"
                                                            >
                                                                <div className="aspect-square relative overflow-hidden bg-slate-950 flex items-center justify-center">
                                                                    {!hasError ? (
                                                                        <img
                                                                            src={displaySrc}
                                                                            alt={`Spectra Variant ${idx + 1}`}
                                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                            onError={() => setImageLoadErrors(prev => ({ ...prev, [imgUrl]: true }))}
                                                                        />
                                                                    ) : (
                                                                        <div className="absolute inset-0 p-3 bg-slate-900 text-slate-300 flex flex-col items-center justify-center text-center gap-2">
                                                                            <AlertCircle className="h-6 w-6 text-amber-400" />
                                                                            <span className="text-xs font-bold text-white">Blocked</span>
                                                                        </div>
                                                                    )}

                                                                    {!hasError && (
                                                                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-[2px]">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setLightboxImageUrl(imgUrl)}
                                                                                className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 shadow-md"
                                                                                title="View full size"
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDownloadImage(displaySrc, idx)}
                                                                                className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 shadow-md"
                                                                                title="Download"
                                                                            >
                                                                                <Download className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Multi-Variant Bottom Meta */}
                                                                <div className="p-2.5 bg-white space-y-1.5 border-t border-slate-100">
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <span className="font-bold text-slate-800">
                                                                            Variant #{idx + 1}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md font-mono">
                                                                            {activeJobCost.formattedPerImage}
                                                                        </span>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleExportToAdsManager(imgUrl)}
                                                                        className="w-full h-7 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-1"
                                                                    >
                                                                        <Megaphone className="h-3 w-3 text-cyan-400" />
                                                                        <span>Use in Ad</span>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* In Carousel Mode: If slides_json exists with images */}
                                            {format === 'carousel' && Array.isArray(activeJob?.slides_json) && activeJob.slides_json.length > 0 && (
                                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                                    <span className="text-xs font-bold text-slate-700 block">
                                                        Carousel Slides Output ({activeJob.slides_json.length} Slides):
                                                    </span>
                                                    <div className="space-y-2 max-h-56 overflow-y-auto">
                                                        {activeJob.slides_json.map((sl: any, sIdx: number) => (
                                                            <div key={sIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                                                                {sl.image_url ? (
                                                                    <img 
                                                                        src={getDisplayImageUrl(sl.image_url)} 
                                                                        alt={sl.title} 
                                                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-slate-300"
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 flex-shrink-0">
                                                                        Slide {sIdx + 1}
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0 text-xs">
                                                                    <h5 className="font-bold text-slate-900 truncate">{sl.title}</h5>
                                                                    <p className="text-[11px] text-slate-500 truncate">{sl.caption}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className={`text-[10px] font-bold ${sl.status === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                            {sl.status === 'done' ? '✓ Slide Generated' : 'Pending'}
                                                                        </span>
                                                                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded flex items-center gap-1">
                                                                            <Coins className="h-2.5 w-2.5 text-emerald-600" />
                                                                            <span>{activeJobCost.formattedPerImage}</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-12 px-4 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                                            <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
                                                <Camera className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-slate-800">
                                                    No Visual Assets Generated Yet
                                                </h4>
                                                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                                    Choose your model and parameters, then click <strong>Generate Visuals</strong> to trigger the n8n pipeline.
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={handleGenerateAndDispatch}
                                                disabled={isGenerating}
                                                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold"
                                            >
                                                Start Generation
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                )}
                            </div>
                            )}

                            {/* TAB 1: COPY DECK */}
                            {activeOutputTab === 'copy' && (
                                <div className="space-y-4">
                                    {/* Primary Headline */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <span>Ad Headline</span>
                                                <span className="text-[10px] text-slate-400">({generatedOutput.headline?.length || 0} chars)</span>
                                            </span>
                                            <button
                                                onClick={() => copyText(generatedOutput.headline, 'hl')}
                                                className="text-violet-600 hover:text-violet-700 flex items-center gap-1 font-bold text-xs"
                                            >
                                                {copiedKey === 'hl' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                                <span>{copiedKey === 'hl' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 leading-snug">
                                            {generatedOutput.headline}
                                        </div>
                                    </div>

                                    {/* Scroll-Stopping Hook */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                            <span>Scroll-Stopping Hook</span>
                                            <button
                                                onClick={() => copyText(generatedOutput.hook, 'hook')}
                                                className="text-violet-600 hover:text-violet-700 flex items-center gap-1 font-bold text-xs"
                                            >
                                                {copiedKey === 'hook' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                                <span>{copiedKey === 'hook' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-violet-50/60 border border-violet-200/80 text-xs font-medium text-violet-950">
                                            "{generatedOutput.hook}"
                                        </div>
                                    </div>

                                    {/* Primary Caption / Social Text */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                            <span>Primary Ad Text & Dubai Hashtags</span>
                                            <button
                                                onClick={() => copyText(generatedOutput.caption, 'cap')}
                                                className="text-violet-600 hover:text-violet-700 flex items-center gap-1 font-bold text-xs"
                                            >
                                                {copiedKey === 'cap' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                                <span>{copiedKey === 'cap' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                                            {generatedOutput.caption}
                                        </div>
                                    </div>

                                    {/* WhatsApp Direct CTA Button */}
                                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                                            <span>WhatsApp Direct CTA</span>
                                            <button
                                                onClick={() => copyText(generatedOutput.whatsappMessage, 'wa-msg')}
                                                className="text-emerald-700 hover:underline flex items-center gap-1 text-[11px]"
                                            >
                                                {copiedKey === 'wa-msg' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                                <span>Copy Prefilled Message</span>
                                            </button>
                                        </div>
                                        <div className="text-xs text-emerald-800 bg-white p-2 rounded-xl border border-emerald-200/80 font-mono">
                                            "{generatedOutput.whatsappMessage}"
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: VISUAL PROMPTS (ORIGINAL & ENHANCED) */}
                            {activeOutputTab === 'visual_prompt' && (
                                <div className="space-y-4">
                                    {/* Enhanced Prompt (from GPT-4.1-mini) */}
                                    {activeJob?.enhanced_image_prompt && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                                                <span className="flex items-center gap-1 font-bold">
                                                    <Sparkles className="h-3.5 w-3.5" />
                                                    Enhanced by OpenAI GPT-4.1-mini (Live)
                                                </span>
                                                <button
                                                    onClick={() => copyText(activeJob.enhanced_image_prompt, 'vp-enh')}
                                                    className="text-emerald-700 hover:underline flex items-center gap-1 font-bold text-xs"
                                                >
                                                    {copiedKey === 'vp-enh' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                    <span>{copiedKey === 'vp-enh' ? 'Copied' : 'Copy'}</span>
                                                </button>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs leading-relaxed max-h-48 overflow-y-auto border border-emerald-900/50">
                                                {activeJob.enhanced_image_prompt}
                                            </div>
                                        </div>
                                    )}

                                    {/* Original Input Prompt */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                            <span>Original Visual Brief</span>
                                            <button
                                                onClick={() => copyText(generatedOutput.visualPrompt, 'vp-orig')}
                                                className="text-violet-600 hover:text-violet-700 flex items-center gap-1 font-bold text-xs"
                                            >
                                                {copiedKey === 'vp-orig' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                                <span>{copiedKey === 'vp-orig' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-900 text-cyan-300 font-mono text-xs leading-relaxed max-h-40 overflow-y-auto border border-slate-800">
                                            {generatedOutput.visualPrompt}
                                        </div>
                                    </div>

                                    {/* Visual Parameter Tags */}
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                                        <span className="font-bold text-slate-700 block">Active Pipeline Parameters:</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-mono">
                                                Model: {selectedModel}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-mono">
                                                Aspect: {resolution === '1080x1080' ? '1:1' : resolution === '1080x1350' ? '4:5' : resolution === '1080x1920' ? '9:16' : '16:9'}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-mono">
                                                Variants: {variantCount}
                                            </span>
                                            {referenceImageUrl && (
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono">
                                                    Reference Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: PAST GENERATION HISTORY */}
                            {activeOutputTab === 'history' && (
                                <div className="space-y-3.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <History className="h-4 w-4 text-violet-600" />
                                                <span>Past Generations</span>
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                    ({recentJobs.length + recentVideoJobs.length} jobs in Supabase)
                                                </span>
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* History Filter Pills */}
                                            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-[10px] font-semibold border border-slate-200/70">
                                                <button
                                                    type="button"
                                                    onClick={() => setHistoryFilter('all')}
                                                    className={`px-2 py-0.5 rounded-md transition-all ${
                                                        historyFilter === 'all'
                                                            ? 'bg-white text-violet-900 shadow-2xs font-bold'
                                                            : 'text-slate-500 hover:text-slate-800'
                                                    }`}
                                                >
                                                    All ({recentJobs.length + recentVideoJobs.length})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setHistoryFilter('images')}
                                                    className={`px-2 py-0.5 rounded-md transition-all ${
                                                        historyFilter === 'images'
                                                            ? 'bg-white text-violet-900 shadow-2xs font-bold'
                                                            : 'text-slate-500 hover:text-slate-800'
                                                    }`}
                                                >
                                                    Images ({recentJobs.length})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setHistoryFilter('videos')}
                                                    className={`px-2 py-0.5 rounded-md transition-all ${
                                                        historyFilter === 'videos'
                                                            ? 'bg-white text-violet-900 shadow-2xs font-bold'
                                                            : 'text-slate-500 hover:text-slate-800'
                                                    }`}
                                                >
                                                    Videos ({recentVideoJobs.length})
                                                </button>
                                            </div>

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    fetchRecentJobs();
                                                    fetchRecentVideoJobs();
                                                }}
                                                className="h-7 text-xs text-violet-600 hover:text-violet-700 px-2 rounded-lg"
                                            >
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                <span>Refresh</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {(recentJobs.length === 0 && recentVideoJobs.length === 0) ? (
                                        <div className="py-10 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <History className="h-8 w-8 mx-auto text-slate-300" />
                                            <p className="text-xs text-slate-500">No past generations saved yet.</p>
                                            <Button
                                                size="sm"
                                                onClick={() => setActiveStep(1)}
                                                className="text-xs bg-violet-600 text-white rounded-xl"
                                            >
                                                Generate First Visual
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                                            {/* Video Jobs in History */}
                                            {(historyFilter === 'all' || historyFilter === 'videos') && recentVideoJobs.map((vJob) => {
                                                const isCurrent = activeVideoJob?.id === vJob.id;
                                                const estCostAed = vJob.estimated_cost_usd ? +(Number(vJob.estimated_cost_usd) * 3.6725).toFixed(2) : 0;
                                                return (
                                                    <div
                                                        key={`video-${vJob.id}`}
                                                        className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                                                            isCurrent
                                                                ? 'bg-purple-50/80 border-purple-500 shadow-2xs ring-1 ring-purple-500/20'
                                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-14 h-14 rounded-xl bg-purple-950 text-white flex items-center justify-center flex-shrink-0 border border-purple-300 shadow-2xs">
                                                                <Film className="h-6 w-6 text-purple-300" />
                                                            </div>

                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                <div className="flex items-center justify-between gap-1.5">
                                                                    <h5 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                                                        <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold text-[9px] uppercase">
                                                                            Video Reel
                                                                        </span>
                                                                        <span className="truncate">{vJob.topic || 'Veo Video Reel'}</span>
                                                                    </h5>
                                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                                                        vJob.status === 'completed' || vJob.output_video_url || vJob.final_video_url
                                                                            ? 'bg-emerald-100 text-emerald-800'
                                                                            : vJob.status === 'rendering'
                                                                            ? 'bg-cyan-100 text-cyan-800 animate-pulse'
                                                                            : vJob.status === 'draft_ready'
                                                                            ? 'bg-violet-100 text-violet-800'
                                                                            : 'bg-slate-100 text-slate-700'
                                                                    }`}>
                                                                        {vJob.status === 'draft_ready' ? 'Brief Ready' : vJob.status}
                                                                    </span>
                                                                </div>

                                                                <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                                                                    "{vJob.voiceover_script || vJob.topic || 'Video Reel Storyboard'}"
                                                                </p>

                                                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-0.5">
                                                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                                                                        {vJob.engine || 'veo-3.1-fast'}
                                                                    </span>
                                                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                                                                        {vJob.aspect_ratio || '9:16'}
                                                                    </span>
                                                                    <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-mono">
                                                                        {vJob.shots_json?.length || 3} shots
                                                                    </span>
                                                                    {vJob.actual_cost_usd !== undefined && vJob.actual_cost_usd !== null ? (
                                                                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200/60 flex items-center gap-0.5">
                                                                            <Receipt className="h-2.5 w-2.5 text-emerald-600" />
                                                                            <span>AED {(Number(vJob.actual_cost_usd) * 3.6725).toFixed(2)}</span>
                                                                        </span>
                                                                    ) : estCostAed > 0 ? (
                                                                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200/60 flex items-center gap-0.5">
                                                                            <Receipt className="h-2.5 w-2.5 text-emerald-600" />
                                                                            <span>AED {estCostAed.toFixed(2)}</span>
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                                                            <span>
                                                                {vJob.created_at ? new Date(vJob.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                                            </span>

                                                            <div className="flex items-center gap-1.5">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRefreshVideoStatus(vJob.id);
                                                                    }}
                                                                    disabled={isRefreshingVideoStatus}
                                                                    className="h-6 text-[10px] px-2 rounded-lg border-slate-200 text-slate-600 hover:text-purple-700 hover:border-purple-300 gap-1"
                                                                    title="Query Railway video engine for live status"
                                                                >
                                                                    <RefreshCw className={`h-2.5 w-2.5 ${isRefreshingVideoStatus && activeVideoJob?.id === vJob.id ? 'animate-spin text-purple-600' : ''}`} />
                                                                    <span>Sync</span>
                                                                </Button>

                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setActiveVideoJob(vJob);
                                                                        setFormat('video');
                                                                        setActiveOutputTab('visual_assets');
                                                                        handleRefreshVideoStatus(vJob.id);
                                                                    }}
                                                                    className={`h-6 text-[10px] px-2.5 rounded-lg font-semibold ${
                                                                        isCurrent 
                                                                            ? 'bg-purple-600 text-white' 
                                                                            : 'bg-slate-900 text-white hover:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    {isCurrent ? 'Viewing' : (vJob.output_video_url || vJob.final_video_url ? 'Play Reel' : 'Open Video Reel')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Studio Image Jobs in History */}
                                            {(historyFilter === 'all' || historyFilter === 'images') && recentJobs.map((job) => {
                                                const isCurrent = activeJob?.id === job.id;
                                                const firstImg = job.image_urls && job.image_urls[0];
                                                const jobCost = calculateJobCost(
                                                    job.model,
                                                    job.post_type === 'carousel'
                                                        ? (Array.isArray(job.slides_json) && job.slides_json.length > 0 ? job.slides_json.length : 1)
                                                        : (Array.isArray(job.image_urls) && job.image_urls.length > 0 ? job.image_urls.length : (job.variants || 1))
                                                );

                                                return (
                                                    <div
                                                        key={job.id}
                                                        className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                                                            isCurrent
                                                                ? 'bg-violet-50/70 border-violet-500 shadow-2xs ring-1 ring-violet-500/20'
                                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {firstImg ? (
                                                                <div 
                                                                    className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 cursor-pointer group/thumb border border-slate-200"
                                                                    onClick={() => setLightboxImageUrl(firstImg)}
                                                                >
                                                                    <img
                                                                        src={getDisplayImageUrl(firstImg)}
                                                                        alt={job.topic || 'Asset'}
                                                                        className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-200">
                                                                    <Camera className="h-5 w-5" />
                                                                </div>
                                                            )}

                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                <div className="flex items-center justify-between gap-1.5">
                                                                    <h5 className="text-xs font-bold text-slate-900 truncate">
                                                                        {job.topic || 'Creative Asset'}
                                                                    </h5>
                                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                                                        job.status === 'done'
                                                                            ? 'bg-emerald-100 text-emerald-800'
                                                                            : job.status === 'generating'
                                                                            ? 'bg-violet-100 text-violet-800 animate-pulse'
                                                                            : job.status === 'failed'
                                                                            ? 'bg-rose-100 text-rose-800'
                                                                            : 'bg-amber-100 text-amber-800'
                                                                    }`}>
                                                                        {job.status === 'done' ? '✓ Ready' : job.status}
                                                                    </span>
                                                                </div>

                                                                <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                                                                    "{job.image_prompt || job.enhanced_image_prompt || 'Visual Prompt'}"
                                                                </p>

                                                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-0.5">
                                                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                                                                        {job.model || 'dall-e-3'}
                                                                    </span>
                                                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                                                                        {job.aspect_ratio || '1:1'}
                                                                    </span>
                                                                    {job.status === 'done' && (
                                                                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200/60 flex items-center gap-0.5">
                                                                            <Receipt className="h-2.5 w-2.5 text-emerald-600" />
                                                                            <span>{jobCost.formattedTotal}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                                                            <span>
                                                                {job.created_at ? new Date(job.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                                            </span>

                                                            <div className="flex items-center gap-1.5">
                                                                {firstImg && (
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleExportToAdsManager(firstImg)}
                                                                        className="h-6 text-[10px] px-2 rounded-lg border-slate-200 font-semibold"
                                                                    >
                                                                        <Megaphone className="h-2.5 w-2.5 mr-1 text-violet-600" />
                                                                        Use in Ad
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setActiveJob(job);
                                                                        setJobStatus(job.status);
                                                                        if (job.image_prompt) setPrompt(job.image_prompt);
                                                                        if (job.enhanced_image_prompt) {
                                                                            setGeneratedOutput((prev: any) => ({
                                                                                ...prev,
                                                                                visualPrompt: job.enhanced_image_prompt
                                                                            }));
                                                                        }
                                                                        setActiveOutputTab('visual_assets');
                                                                    }}
                                                                    className={`h-6 text-[10px] px-2.5 rounded-lg font-semibold ${
                                                                        isCurrent 
                                                                            ? 'bg-violet-600 text-white' 
                                                                            : 'bg-slate-900 text-white hover:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    {isCurrent ? 'Viewing' : 'Load into Studio'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: WEBHOOK & JOB STATE */}
                            {activeOutputTab === 'webhook' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-700">Supabase Job Record:</span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                            activeJob?.status === 'done' 
                                                ? 'bg-emerald-100 text-emerald-800' 
                                                : activeJob?.status === 'generating'
                                                ? 'bg-violet-100 text-violet-800 animate-pulse'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {activeJob?.status?.toUpperCase() || 'NO ACTIVE JOB'}
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs max-h-60 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap break-all">
                                            {JSON.stringify(activeJob ? {
                                                ...activeJob,
                                                exact_cost_breakdown: {
                                                    model: activeJobCost.modelName,
                                                    provider: activeJobCost.provider,
                                                    images_generated: activeJobCost.count,
                                                    cost_per_image_usd: `$${activeJobCost.perImageUsd.toFixed(3)}`,
                                                    cost_per_image_aed: `AED ${activeJobCost.perImageAed.toFixed(2)}`,
                                                    total_job_cost_usd: `$${activeJobCost.totalUsd.toFixed(3)}`,
                                                    total_job_cost_aed: `AED ${activeJobCost.totalAed.toFixed(2)}`,
                                                    pricing_basis: "Official provider rate card pegged to UAE Dirhams (AED)"
                                                }
                                            } : {
                                                notice: "No active job in state. Generate a creative to create a row in spectra_studio_jobs."
                                            }, null, 2)}
                                        </pre>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyText(JSON.stringify(activeJob || {}, null, 2), 'job-copy')}
                                            className="text-xs rounded-xl"
                                        >
                                            {copiedKey === 'job-copy' ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                                            <span>Copy Job JSON</span>
                                        </Button>

                                        <Button
                                            size="sm"
                                            onClick={handleGenerateAndDispatch}
                                            disabled={isGenerating}
                                            className="text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                                        >
                                            <RefreshCw className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                                            <span>Re-run Job</span>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Bottom Universal Action Deck */}
                            <div className="pt-3 border-t border-slate-100 space-y-2.5">
                                <Button
                                    onClick={() => handleExportToAdsManager()}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl h-11 text-xs gap-2 shadow-sm"
                                >
                                    <Megaphone className="h-4 w-4 text-cyan-400" />
                                    <span>Deploy Directly to Ads Manager</span>
                                    <ArrowRight className="h-3.5 w-3.5 ml-auto text-slate-400" />
                                </Button>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyText(`${generatedOutput.headline}\n\n${generatedOutput.caption}\n\nVisual Prompt: ${activeJob?.enhanced_image_prompt || generatedOutput.visualPrompt}`, 'all-copy')}
                                        className="text-xs rounded-xl border-slate-200 font-semibold"
                                    >
                                        {copiedKey === 'all-copy' ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1 text-slate-500" />}
                                        <span>Copy Full Copy Deck</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadDeck}
                                        className="text-xs rounded-xl border-slate-200 font-semibold"
                                    >
                                        <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                        <span>Export Brief (.txt)</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Campaign Summary Pill Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/80 text-xs space-y-2">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-violet-600" />
                                Supabase & n8n Pipeline Active
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Async Worker
                            </span>
                        </div>
                        <ul className="text-slate-600 space-y-1 text-[11px] pl-1">
                            <li>• Jobs stored in <code className="text-[10px] bg-slate-200/70 px-1 py-0.5 rounded">public.spectra_studio_jobs</code></li>
                            <li>• Prompt enhanced by GPT-4.1-mini before image rendering</li>
                            <li>• Images uploaded to <code className="text-[10px] bg-slate-200/70 px-1 py-0.5 rounded">content-media</code> Supabase Storage</li>
                        </ul>
                    </div>

                </div>

            </div>

            {/* LIGHTBOX IMAGE PREVIEW MODAL */}
            {lightboxImageUrl && (
                <div 
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setLightboxImageUrl(null)}
                >
                    <div 
                        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white text-xs px-4">
                            <span className="font-bold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-cyan-400" />
                                Spectra AI Studio Generated Asset
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                    <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>Cost: {activeJobCost.formattedPerImage}</span>
                                </span>
                                <Button
                                    size="sm"
                                    onClick={() => handleDownloadImage(lightboxImageUrl, 0)}
                                    className="h-7 text-xs bg-violet-600 text-white rounded-lg px-2.5"
                                >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                </Button>
                                <button
                                    onClick={() => setLightboxImageUrl(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black">
                            <img
                                src={getDisplayImageUrl(lightboxImageUrl)}
                                alt="Enlarged View"
                                className="max-h-[80vh] w-auto object-contain rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* RECENT JOBS MODAL */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="sm:max-w-xl rounded-3xl bg-white p-6 max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <History className="h-5 w-5 text-violet-600" />
                            Recent Studio Generation Jobs
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Previous generations saved in your Supabase <code className="font-mono text-[11px]">spectra_studio_jobs</code> table.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1">
                        {recentJobs.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-400">
                                No previous generation jobs found.
                            </div>
                        ) : (
                            recentJobs.map((job) => {
                                const isCurrent = activeJob?.id === job.id;
                                const firstImg = job.image_urls && job.image_urls[0];
                                const jobCost = calculateJobCost(
                                    job.model, 
                                    job.post_type === 'carousel' 
                                        ? (Array.isArray(job.slides_json) && job.slides_json.length > 0 ? job.slides_json.length : 1)
                                        : (Array.isArray(job.image_urls) && job.image_urls.length > 0 ? job.image_urls.length : (job.variants || 1))
                                );

                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => {
                                            setActiveJob(job);
                                            setJobStatus(job.status);
                                            setIsHistoryModalOpen(false);
                                            setActiveOutputTab('visual_assets');
                                        }}
                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                            isCurrent
                                                ? 'bg-violet-50 border-violet-500 shadow-xs'
                                                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {firstImg ? (
                                                <img
                                                    src={getDisplayImageUrl(firstImg)}
                                                    alt="Thumbnail"
                                                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                    <Camera className="h-5 w-5" />
                                                </div>
                                            )}
                                            <div className="min-w-0 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 truncate">
                                                        {job.topic || 'Maintenance Ad'}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                                        job.status === 'done'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : job.status === 'generating'
                                                            ? 'bg-violet-100 text-violet-800'
                                                            : job.status === 'failed'
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {job.status}
                                                    </span>
                                                    {job.status === 'done' && (
                                                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.2 rounded-full flex items-center gap-1">
                                                            <Receipt className="h-2.5 w-2.5 text-emerald-600" />
                                                            <span>{jobCost.formattedTotal}</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                    {job.model || 'dall-e-3'} · {job.aspect_ratio || '1:1'} · {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs text-violet-700 font-bold"
                                        >
                                            View
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-3">
                        <Button
                            size="sm"
                            onClick={() => setIsHistoryModalOpen(false)}
                            className="bg-slate-900 text-white rounded-xl text-xs"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* WEBHOOK URL CONFIGURATION MODAL (IMAGES & 2 VIDEO WORKFLOWS) */}
            <Dialog open={isWebhookModalOpen} onOpenChange={setIsWebhookModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl bg-white p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-violet-600" />
                            n8n Webhook Pipeline Configuration
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Configure endpoints for Image generation and the 2 Veo Video workflows (<code className="font-mono text-[11px]">spectra-video-brief</code> & <code className="font-mono text-[11px]">spectra-video-render</code>).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        {/* 1. Image Generation Webhook */}
                        <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5 text-violet-600" />
                                <span>Image Generation Webhook (sp-studio-generate)</span>
                            </Label>
                            <Input
                                value={tempWebhookUrl}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setTempWebhookUrl(val);
                                    if (val && !tempVideoBriefWebhookUrl) {
                                        setTempVideoBriefWebhookUrl(val.replace(/spectra-studio-generate/g, 'spectra-video-brief'));
                                    }
                                    if (val && !tempVideoRenderWebhookUrl) {
                                        setTempVideoRenderWebhookUrl(val.replace(/spectra-studio-generate/g, 'spectra-video-render'));
                                    }
                                }}
                                placeholder="https://your-n8n.cloud/webhook/spectra-studio-generate"
                                className="text-xs h-9 rounded-xl font-mono bg-white"
                            />
                            <span className="text-[10px] text-slate-500 block">
                                Triggers single image and multi-slide carousel generation on <code className="font-mono">spectra_studio_jobs</code>.
                            </span>
                        </div>

                        {/* 2. Video Workflow 1: Brief Webhook */}
                        <div className="space-y-1.5 p-3 rounded-2xl bg-purple-50/60 border border-purple-200">
                            <Label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                                <Zap className="h-3.5 w-3.5 text-purple-600" />
                                <span>Video Workflow 1: Brief & Voiceover (sp-video-brief)</span>
                            </Label>
                            <Input
                                value={tempVideoBriefWebhookUrl}
                                onChange={(e) => setTempVideoBriefWebhookUrl(e.target.value)}
                                placeholder="https://your-n8n.cloud/webhook/spectra-video-brief"
                                className="text-xs h-9 rounded-xl font-mono bg-white"
                            />
                            <span className="text-[10px] text-purple-800 block">
                                Calls GPT-4o for shot-by-shot brief, generates OpenAI TTS-1 audio, uploads to Supabase, and saves <code className="font-mono">draft_ready</code> row in <code className="font-mono">video_jobs</code>.
                            </span>
                        </div>

                        {/* 3. Video Workflow 2: Render Webhook */}
                        <div className="space-y-1.5 p-3 rounded-2xl bg-cyan-50/60 border border-cyan-200">
                            <Label className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                                <Film className="h-3.5 w-3.5 text-cyan-600" />
                                <span>Video Workflow 2: Veo Render Engine (sp-video-render)</span>
                            </Label>
                            <Input
                                value={tempVideoRenderWebhookUrl}
                                onChange={(e) => setTempVideoRenderWebhookUrl(e.target.value)}
                                placeholder="https://your-n8n.cloud/webhook/spectra-video-render"
                                className="text-xs h-9 rounded-xl font-mono bg-white"
                            />
                            <span className="text-[10px] text-cyan-800 block">
                                Receives <code className="font-mono">jobId</code>, queries Supabase, dispatches to Railway Veo engine, and stitches final MP4 reel with audio.
                            </span>
                        </div>

                        {/* Pipeline architecture recap */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
                            <div className="font-semibold text-slate-900">2-Stage Video Pipeline:</div>
                            <div>1. <strong>Stage 1 (Brief)</strong>: Prompt & specs → n8n creates shot cards & OpenAI voiceover MP3</div>
                            <div>2. <strong>Stage 2 (Render)</strong>: Review shots → n8n calls Railway engine to render Veo clips</div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
                        <Button
                            variant="ghost"
                            onClick={() => setIsWebhookModalOpen(false)}
                            className="rounded-xl text-slate-600 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveWebhookSettings}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs"
                        >
                            Save Webhook Pipeline URLs
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* JSON PAYLOAD INSPECTOR MODAL */}
            <Dialog open={showPayloadModal} onOpenChange={setShowPayloadModal}>
                <DialogContent className="sm:max-w-xl rounded-3xl bg-white p-6 max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Code className="h-5 w-5 text-violet-600" />
                            Studio Job JSON Inspector
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            The exact job record stored in Supabase and passed to n8n.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto my-3 p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed">
                        <pre className="whitespace-pre-wrap break-all">
                            {JSON.stringify(activeJob || webhookResult || {}, null, 2)}
                        </pre>
                    </div>

                    <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t border-slate-100 pt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyText(JSON.stringify(activeJob || {}, null, 2), 'payload-json')}
                            className="text-xs rounded-xl"
                        >
                            {copiedKey === 'payload-json' ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                            <span>{copiedKey === 'payload-json' ? 'Copied JSON' : 'Copy JSON'}</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setShowPayloadModal(false)}
                            className="bg-violet-600 text-white rounded-xl text-xs font-semibold"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
