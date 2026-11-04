import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { calculateVideoJobCost } from '@/lib/spectra-maintenance-data';

// Helper to get client (prefers supabaseAdmin for service role / bypass RLS, fallback to supabase)
const getDb = () => supabaseAdmin || supabase;

// Railway Video Engine Configuration
const VIDEO_ENGINE_URL = (process.env.SPECTRA_VIDEO_ENGINE_URL || 'https://spectra-video-engine-production.up.railway.app').replace(/\/+$/, '');
const VIDEO_ENGINE_TOKEN = process.env.SPECTRA_VIDEO_ENGINE_TOKEN || 'BVPEpwI7Hn8hNSH27By47G54Jq1YC9dB-LU7lQgo3rE';

/**
 * Normalizes video job URLs so frontend can safely access both
 * output_video_url (database column) and final_video_url (legacy/view alias).
 */
function normalizeJobUrls(j: any) {
    if (!j) return j;
    const url = j.output_video_url || j.final_video_url || null;
    j.output_video_url = url;
    j.final_video_url = url;
    return j;
}

/**
 * Fetches latest render progress, output video URL, and costs from
 * the Railway Veo rendering engine with dynamic jobId and updates Supabase.
 */
async function syncJobFromRailway(jobId: string, currentJob?: any) {
    if (!jobId) return currentJob || null;
    const db = getDb();

    try {
        const url = `${VIDEO_ENGINE_URL}/jobs/${jobId}`;
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${VIDEO_ENGINE_TOKEN}`,
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(8000)
        });

        if (res.ok) {
            const railwayData = await res.json();

            // Build fields to update in Supabase
            const updateFields: any = {};
            if (railwayData.status) updateFields.status = railwayData.status;
            if (railwayData.output_video_url) updateFields.output_video_url = railwayData.output_video_url;
            if (railwayData.actual_cost_usd !== undefined) updateFields.actual_cost_usd = railwayData.actual_cost_usd;
            if (railwayData.render_progress) updateFields.render_progress = railwayData.render_progress;
            if (railwayData.error_detail !== undefined) updateFields.error_detail = railwayData.error_detail;
            if (railwayData.completed_at) updateFields.completed_at = railwayData.completed_at;

            if (Object.keys(updateFields).length > 0) {
                const { error: updateErr } = await db
                    .from('video_jobs')
                    .update(updateFields)
                    .eq('id', jobId);

                if (updateErr) {
                    console.warn(`Could not update video_jobs in Supabase for ${jobId}:`, updateErr.message);
                }
            }

            const merged = {
                ...(currentJob || {}),
                ...railwayData,
                output_video_url: railwayData.output_video_url || currentJob?.output_video_url || null,
                final_video_url: railwayData.output_video_url || currentJob?.output_video_url || currentJob?.final_video_url || null
            };
            return normalizeJobUrls(merged);
        } else {
            console.warn(`Railway job fetch status: ${res.status} for ${jobId}`);
        }
    } catch (err: any) {
        console.warn(`Error querying Railway video engine for job ${jobId}:`, err.message);
    }

    return currentJob ? normalizeJobUrls(currentJob) : null;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            action = 'create_brief',
            jobId,
            topic = '',
            platform = 'instagram',
            aspectRatio = '9:16',
            shotCount = 3,
            durationS = 4,
            wantsVoiceover = true,
            wantsMusic = false,
            wantsSubtitles = true,
            hasSubtitles = true,
            subtitleStyle = 'bold_yellow',
            videoType = 'generated_clips',
            engine = 'veo-3.1-fast',
            resolution = '1080p',
            styleDirection = '',
            styleArc = '',
            brandName = 'Spectra Property Maintenance Dubai',
            brandDescription = 'Dubai premium villa & commercial AC, plumbing, and facility management',
            briefWebhookUrl = '',
            renderWebhookUrl = '',
            shots_json,
            voiceover_script,
            copy_json
        } = body;

        const db = getDb();

        // -------------------------------------------------------------
        // ACTION 1: CREATE VIDEO BRIEF (Workflow 1: spectra-video-brief)
        // -------------------------------------------------------------
        if (action === 'create_brief') {
            const safeShotCount = Math.min(Math.max(Number(shotCount) || 3, 1), 6);
            const safeDurationS = [4, 6, 8].includes(Number(durationS)) ? Number(durationS) : 4;
            const chosenEngine = (['veo-3.1-fast', 'veo-3.1-lite', 'veo-3.1-standard'].includes(engine)
                ? engine
                : 'veo-3.1-fast') as 'veo-3.1-fast' | 'veo-3.1-lite' | 'veo-3.1-standard';
            const chosenResolution = (['720p', '1080p', '4k'].includes(resolution)
                ? resolution
                : '1080p') as '720p' | '1080p' | '4k';

            // Resolve target webhook for brief generation
            let targetBriefUrl = briefWebhookUrl?.trim() || process.env.N8N_VIDEO_BRIEF_WEBHOOK_URL;
            if (!targetBriefUrl && process.env.N8N_STUDIO_WEBHOOK_URL) {
                targetBriefUrl = process.env.N8N_STUDIO_WEBHOOK_URL.replace(/spectra-studio-generate/g, 'spectra-video-brief');
            }

            const briefPayload = {
                topic: topic || 'Spectra AC Deep Servicing & Dubai Villa Cooling',
                platform,
                aspectRatio,
                shotCount: safeShotCount,
                durationS: safeDurationS,
                wantsVoiceover: Boolean(wantsVoiceover),
                wantsMusic: Boolean(wantsMusic),
                wantsSubtitles: Boolean(wantsSubtitles ?? hasSubtitles ?? true),
                hasSubtitles: Boolean(wantsSubtitles ?? hasSubtitles ?? true),
                subtitleStyle: subtitleStyle || 'bold_yellow',
                videoType,
                engine: chosenEngine,
                resolution: chosenResolution,
                styleDirection: styleDirection || 'Cinematic, ultra-sharp 4K commercial lighting, clean Dubai villa interior',
                styleArc: styleArc || 'Hook -> Problem -> Resolution',
                brandName,
                brandDescription,
                sourceKind: 'topic'
            };

            let videoJobRecord = null;
            let webhookDispatched = false;
            let webhookError = null;

            if (targetBriefUrl && (targetBriefUrl.startsWith('http://') || targetBriefUrl.startsWith('https://'))) {
                try {
                    const res = await fetch(targetBriefUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Spectra-AI-Studio/2.0'
                        },
                        body: JSON.stringify(briefPayload)
                    });

                    if (res.ok) {
                        const resData = await res.json();
                        webhookDispatched = true;

                        // n8n returns [{ json: row }] or [row] or row
                        if (Array.isArray(resData) && resData.length > 0) {
                            videoJobRecord = resData[0].json || resData[0];
                        } else if (resData && typeof resData === 'object') {
                            videoJobRecord = resData.json || resData;
                        }
                    } else {
                        webhookError = `Webhook status ${res.status}: ${await res.text()}`;
                    }
                } catch (err: any) {
                    console.warn('Failed contacting spectra-video-brief webhook:', err.message);
                    webhookError = err.message;
                }
            }

            // If webhook returned the job, ensure we fetch or return it
            if (videoJobRecord && videoJobRecord.id) {
                return NextResponse.json({
                    success: true,
                    jobId: videoJobRecord.id,
                    job: videoJobRecord,
                    webhookDispatched: true
                });
            }

            // Fallback: If webhook didn't return a record or failed/not configured,
            // create high-quality brief directly in Supabase video_jobs table
            const costData = calculateVideoJobCost(chosenEngine, chosenResolution, safeShotCount, safeDurationS);
            const synthesizedShots = Array.from({ length: safeShotCount }).map((_, i) => {
                const shotIdx = i + 1;
                if (shotIdx === 1) {
                    return {
                        index: 1,
                        durationS: safeDurationS,
                        prompt: `Cinematic wide shot in a sunny luxury Dubai villa. Thermostat reading 45°C outside heat. A resident wiping brow in discomfort as AC blows warm air. Elegant marble floors, high ceilings, modern aesthetics.`,
                        negativePrompt: 'blurry, distorted, low quality, cartoon, watermark',
                        onScreenText: `AC Blowing Warm in Dubai? 45°C Heat Alert`,
                        status: 'pending',
                        clipUrl: null,
                        costUsd: +(costData.rateUsd * safeDurationS).toFixed(2)
                    };
                } else if (shotIdx === safeShotCount) {
                    return {
                        index: shotIdx,
                        durationS: safeDurationS,
                        prompt: `Crisp clean medium close-up of uniformed Spectra technician sealing the AC grille with a satisfied smile. Crystal clean icy-cold cyan airflow visible, digital gauge showing 18°C. Professional branded attire.`,
                        negativePrompt: 'blurry, messy, distorted, text glitches',
                        onScreenText: `Fast 45-Min Arrival Across Dubai | Book Now`,
                        status: 'pending',
                        clipUrl: null,
                        costUsd: +(costData.rateUsd * safeDurationS).toFixed(2)
                    };
                } else {
                    return {
                        index: shotIdx,
                        durationS: safeDurationS,
                        prompt: `Macro shot of pressurized antibacterial coil cleaning foam breaking down dark Dubai dust and mold from copper fins. High-definition steam sanitation restoring pristine silver shine.`,
                        negativePrompt: 'dirt, grunge, out of focus',
                        onScreenText: `Deep Antibacterial Coil Wash & DEWA Power Optimization`,
                        status: 'pending',
                        clipUrl: null,
                        costUsd: +(costData.rateUsd * safeDurationS).toFixed(2)
                    };
                }
            });

            const defaultCopy = {
                hook: `Don't let Dubai's 45°C summer heat overpower your home AC.`,
                body: `Spectra's certified HVAC specialists arrive at your Dubai villa or apartment in 45 minutes. Complete coil deep flush, mold sterilization, and refrigerant top-up with 90-day ice-cold warranty.`,
                hashtags: `#DubaiACMaintenance #SpectraHomeServices #DubaiMarina #PalmJumeirah #DubaiVillas`,
                cta: `Tap to book your AED 199 AC Deep Clean today.`
            };

            const fallbackInsertPayload = {
                topic: briefPayload.topic,
                platform,
                aspect_ratio: aspectRatio,
                video_type: videoType,
                status: 'draft_ready',
                engine: chosenEngine,
                resolution: chosenResolution,
                shots_json: synthesizedShots,
                copy_json: defaultCopy,
                editing_notes: {
                    transitionStyle: 'Clean quick whip-pans between problem and technician resolution',
                    pacing: 'Dynamic, modern commercial pacing with subtle audio swooshes',
                    colourConsistency: 'Bright Dubai daylight warm tones shifting to crisp cool cyan icy finish'
                },
                voiceover_script: wantsVoiceover
                    ? `Dubai summer heat is unforgiving. If your AC is blowing warm air or hiking your DEWA bill, don't wait. Spectra's certified cooling specialists arrive in 45 minutes with deep coil sanitization and ice-cold airflow guaranteed. Book today.`
                    : null,
                voiceover_url: null,
                music_url: null,
                music_prompt: wantsMusic ? 'Modern upbeat UAE corporate lifestyle beat with light tech synths' : null,
                estimated_cost_usd: costData.totalUsd
            };

            const { data: insertedJob, error: insertError } = await db
                .from('video_jobs')
                .insert(fallbackInsertPayload)
                .select()
                .single();

            if (insertError) {
                console.error('Failed to insert fallback video_jobs:', insertError);
                return NextResponse.json(
                    {
                        success: false,
                        error: `Database insert failed: ${insertError.message}. Make sure table 'video_jobs' exists in Supabase.`,
                        webhookError
                    },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                jobId: insertedJob.id,
                job: insertedJob,
                webhookDispatched,
                fallbackGenerated: true,
                webhookError
            });
        }

        // -------------------------------------------------------------
        // ACTION 2: RENDER VIDEO (Workflow 2: spectra-video-render)
        // -------------------------------------------------------------
        if (action === 'render') {
            if (!jobId) {
                return NextResponse.json({ success: false, error: 'jobId is required for render' }, { status: 400 });
            }

            // If user updated shots or script, persist to video_jobs first
            const updatePayload: any = {
                status: 'rendering'
            };
            if (Array.isArray(shots_json)) {
                updatePayload.shots_json = shots_json;
            }
            if (voiceover_script !== undefined) {
                updatePayload.voiceover_script = voiceover_script;
            }
            if (copy_json !== undefined) {
                updatePayload.copy_json = copy_json;
            }

            await db.from('video_jobs').update(updatePayload).eq('id', jobId);

            // Resolve target webhook for rendering
            let targetRenderUrl = renderWebhookUrl?.trim() || process.env.N8N_VIDEO_RENDER_WEBHOOK_URL;
            if (!targetRenderUrl && process.env.N8N_STUDIO_WEBHOOK_URL) {
                targetRenderUrl = process.env.N8N_STUDIO_WEBHOOK_URL.replace(/spectra-studio-generate/g, 'spectra-video-render');
            }

            let webhookDispatched = false;
            let webhookResponse = null;

            if (targetRenderUrl && (targetRenderUrl.startsWith('http://') || targetRenderUrl.startsWith('https://'))) {
                try {
                    const res = await fetch(targetRenderUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Spectra-AI-Studio/2.0'
                        },
                        body: JSON.stringify({
                            jobId,
                            wantsSubtitles: Boolean(wantsSubtitles ?? hasSubtitles ?? true),
                            subtitleStyle: subtitleStyle || 'bold_yellow',
                            body: {
                                jobId,
                                wantsSubtitles: Boolean(wantsSubtitles ?? hasSubtitles ?? true),
                                subtitleStyle: subtitleStyle || 'bold_yellow'
                            }
                        })
                    });

                    webhookDispatched = res.ok;
                    const contentType = res.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        webhookResponse = await res.json();
                    } else {
                        webhookResponse = await res.text();
                    }
                } catch (err: any) {
                    console.warn('Could not contact spectra-video-render webhook:', err.message);
                }
            }

            return NextResponse.json({
                success: true,
                jobId,
                status: 'rendering',
                webhookDispatched,
                webhookResponse: webhookResponse || 'ScalePods video render dispatched'
            });
        }

        // -------------------------------------------------------------
        // ACTION 3: UPDATE SHOTS / DRAFT
        // -------------------------------------------------------------
        if (action === 'update_shots') {
            if (!jobId) {
                return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
            }

            const updateData: any = {};
            if (shots_json !== undefined) updateData.shots_json = shots_json;
            if (voiceover_script !== undefined) updateData.voiceover_script = voiceover_script;
            if (copy_json !== undefined) updateData.copy_json = copy_json;

            const { data, error } = await db
                .from('video_jobs')
                .update(updateData)
                .eq('id', jobId)
                .select()
                .single();

            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, job: normalizeJobUrls(data) });
        }

        // -------------------------------------------------------------
        // ACTION 4: SYNC / REFRESH STATUS FROM RAILWAY VIDEO ENGINE
        // -------------------------------------------------------------
        if (action === 'sync_status' || action === 'refresh_status') {
            if (!jobId) {
                return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
            }

            const { data: job } = await db
                .from('video_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            const synced = await syncJobFromRailway(jobId, job);
            return NextResponse.json({
                success: true,
                job: synced ? normalizeJobUrls(synced) : normalizeJobUrls(job)
            });
        }

        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });

    } catch (err: any) {
        console.error('Error in video-jobs POST:', err);
        return NextResponse.json(
            { success: false, error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const jobId = searchParams.get('id');
        const sync = searchParams.get('sync') === 'true' || searchParams.get('refresh') === 'true';
        const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

        const db = getDb();

        if (jobId) {
            const { data: job, error } = await db
                .from('video_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            // Check if we should query the Railway engine
            // Always sync if requested, or if job not found locally, or if job is still rendering, or if output_video_url is missing
            const shouldSync = sync || !job || job.status === 'rendering' || job.status === 'in_progress' || !job.output_video_url;

            if (shouldSync) {
                const synced = await syncJobFromRailway(jobId, job);
                if (synced) {
                    return NextResponse.json({ success: true, job: normalizeJobUrls(synced) });
                }
            }

            if (error && !job) {
                return NextResponse.json({ success: false, error: error.message }, { status: 404 });
            }

            return NextResponse.json({ success: true, job: normalizeJobUrls(job) });
        }

        // List recent video jobs
        const { data: jobs, error } = await db
            .from('video_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const normalizedJobs = (jobs || []).map(normalizeJobUrls);
        return NextResponse.json({ success: true, jobs: normalizedJobs });

    } catch (err: any) {
        console.error('Error in video-jobs GET:', err);
        return NextResponse.json(
            { success: false, error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

