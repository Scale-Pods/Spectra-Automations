import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

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
 * Derives a video workflow webhook URL from any n8n base webhook URL
 * (supporting spectra-studio-generate, sp-studio-generate, or arbitrary /webhook/<slug>).
 */
function deriveWebhookUrl(
    baseUrl: string | undefined,
    targetSlug: 'spectra-video-brief' | 'spectra-video-render'
): string {
    const trimmed = (baseUrl || '').trim();
    if (!trimmed || (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))) {
        return '';
    }
    if (/spectra-studio-generate|sp-studio-generate/.test(trimmed)) {
        return trimmed.replace(/spectra-studio-generate|sp-studio-generate/g, targetSlug);
    }
    return trimmed.replace(/(\/webhook(?:-test)?\/)([^/?#]+)(\/?.*)$/, `$1${targetSlug}$3`);
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
            if (railwayData.output_video_url) {
                updateFields.output_video_url = railwayData.output_video_url;
                // If Railway produced the final MP4 or completed_at is set, job is completed
                updateFields.status = 'completed';
                updateFields.render_progress = { stage: 'completed', percent: 100 };
            } else if (railwayData.completed_at) {
                updateFields.completed_at = railwayData.completed_at;
                if (!railwayData.status || railwayData.status === 'rendering') {
                    updateFields.status = 'completed';
                }
            }
            if (railwayData.actual_cost_usd !== undefined) updateFields.actual_cost_usd = railwayData.actual_cost_usd;
            if (railwayData.render_progress && !updateFields.render_progress) {
                updateFields.render_progress = railwayData.render_progress;
            }
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
                status: updateFields.status || railwayData.status || currentJob?.status,
                render_progress: updateFields.render_progress || railwayData.render_progress || currentJob?.render_progress,
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
            baseWebhookUrl = '',
            webhookUrl = '',
            briefWebhookUrl = '',
            renderWebhookUrl = '',
            shots_json,
            voiceover_script,
            copy_json
        } = body;

        const db = getDb();
        const rawBaseWebhook = baseWebhookUrl?.trim() || webhookUrl?.trim() || process.env.N8N_STUDIO_WEBHOOK_URL?.trim() || '';

        // -------------------------------------------------------------
        // ACTION 1: CREATE VIDEO BRIEF (Workflow 1: spectra-video-brief)
        // -------------------------------------------------------------
        if (action === 'create_brief') {
            const safeShotCount = Math.min(Math.max(Number(shotCount) || 3, 1), 6);
            const safeDurationS = [4, 6, 8].includes(Number(durationS)) ? Number(durationS) : 4;
            const chosenEngine = (['veo-3.1-fast', 'veo-3.1-lite', 'veo-3.1-standard'].includes(engine)
                ? engine
                : 'veo-3.1-fast') as 'veo-3.1-fast' | 'veo-3.1-lite' | 'veo-3.1-standard';
            const chosenResolution = (['720p', '1080p', '4k'].includes(String(resolution).toLowerCase())
                ? String(resolution).toLowerCase()
                : '1080p') as '720p' | '1080p' | '4k';

            // Resolve target webhook for brief generation
            const targetBriefUrl =
                briefWebhookUrl?.trim() ||
                process.env.N8N_VIDEO_BRIEF_WEBHOOK_URL?.trim() ||
                deriveWebhookUrl(rawBaseWebhook, 'spectra-video-brief');

            if (!targetBriefUrl || (!targetBriefUrl.startsWith('http://') && !targetBriefUrl.startsWith('https://'))) {
                return NextResponse.json(
                    {
                        success: false,
                        needsWebhookConfig: true,
                        webhookDispatched: false,
                        error: 'Workflow 1 (spectra-video-brief) webhook URL is not configured. Open Configure Webhook and enter your n8n webhook URL.'
                    },
                    { status: 400 }
                );
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
            let webhookResponseText = '';

            try {
                const res = await fetch(targetBriefUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Spectra-AI-Studio/2.0'
                    },
                    body: JSON.stringify(briefPayload),
                    signal: AbortSignal.timeout(90000)
                });

                if (!res.ok) {
                    const errText = await res.text();
                    return NextResponse.json(
                        {
                            success: false,
                            webhookDispatched: false,
                            targetUrl: targetBriefUrl,
                            error: `Workflow 1 (spectra-video-brief) returned HTTP ${res.status}: ${errText.slice(0, 300) || res.statusText}`
                        },
                        { status: 502 }
                    );
                }

                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const resData = await res.json();
                    // n8n returns [{ json: row }] or [row] or row
                    if (Array.isArray(resData) && resData.length > 0) {
                        videoJobRecord = resData[0].json || resData[0];
                    } else if (resData && typeof resData === 'object') {
                        videoJobRecord = resData.json || resData.job || resData;
                    }
                } else {
                    webhookResponseText = await res.text();
                }
            } catch (err: any) {
                console.warn('Failed contacting spectra-video-brief webhook:', err.message);
                return NextResponse.json(
                    {
                        success: false,
                        webhookDispatched: false,
                        targetUrl: targetBriefUrl,
                        error: `Could not reach Workflow 1 (spectra-video-brief): ${err.message}`
                    },
                    { status: 502 }
                );
            }

            if (videoJobRecord && (videoJobRecord.id || videoJobRecord.jobId)) {
                const resolvedId = videoJobRecord.id || videoJobRecord.jobId;
                if (!videoJobRecord.id && resolvedId) {
                    const { data: fetched } = await db
                        .from('video_jobs')
                        .select('*')
                        .eq('id', resolvedId)
                        .single();
                    if (fetched) videoJobRecord = fetched;
                }
                return NextResponse.json({
                    success: true,
                    jobId: resolvedId,
                    job: normalizeJobUrls(videoJobRecord),
                    webhookDispatched: true
                });
            }

            return NextResponse.json({
                success: true,
                webhookDispatched: true,
                pendingWebhookCreation: true,
                webhookResponse: webhookResponseText || 'Workflow 1 triggered cleanly; awaiting Supabase row.'
            });
        }

        // -------------------------------------------------------------
        // ACTION 2: RENDER VIDEO (Workflow 2: spectra-video-render)
        // -------------------------------------------------------------
        if (action === 'render') {
            if (!jobId) {
                return NextResponse.json({ success: false, error: 'jobId is required for render' }, { status: 400 });
            }

            // Resolve target webhook for rendering BEFORE updating job status
            const targetRenderUrl =
                renderWebhookUrl?.trim() ||
                process.env.N8N_VIDEO_RENDER_WEBHOOK_URL?.trim() ||
                deriveWebhookUrl(rawBaseWebhook, 'spectra-video-render');

            if (!targetRenderUrl || (!targetRenderUrl.startsWith('http://') && !targetRenderUrl.startsWith('https://'))) {
                return NextResponse.json(
                    {
                        success: false,
                        needsWebhookConfig: true,
                        webhookDispatched: false,
                        error: 'Workflow 2 (spectra-video-render) webhook URL is not configured. Open Configure Webhook and enter your n8n webhook URL.'
                    },
                    { status: 400 }
                );
            }

            // Persist any edited shots/script/copy without flipping status to rendering yet
            const draftEdits: any = {};
            const requestedEngine = typeof body.overrideEngine === 'string' &&
                ['veo-3.1-fast', 'veo-3.1-lite', 'veo-3.1-standard'].includes(body.overrideEngine)
                ? body.overrideEngine
                : undefined;
            if (requestedEngine) {
                draftEdits.engine = requestedEngine;
            }
            if (Array.isArray(shots_json)) {
                draftEdits.shots_json = shots_json;
            }
            if (voiceover_script !== undefined) {
                draftEdits.voiceover_script = voiceover_script;
            }
            if (copy_json !== undefined) {
                draftEdits.copy_json = copy_json;
            }
            if (Object.keys(draftEdits).length > 0) {
                await db.from('video_jobs').update(draftEdits).eq('id', jobId);
            }

            let webhookResponse = null;

            try {
                const res = await fetch(targetRenderUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Spectra-AI-Studio/2.0'
                    },
                    body: JSON.stringify({
                        jobId,
                        ...(requestedEngine ? { engine: requestedEngine } : {}),
                        wantsSubtitles: Boolean(wantsSubtitles ?? hasSubtitles ?? true),
                        subtitleStyle: subtitleStyle || 'bold_yellow',
                        body: {
                            jobId,
                            ...(requestedEngine ? { engine: requestedEngine } : {}),
                            wantsSubtitles: Boolean(wantsSubtitles ?? hasSubtitles ?? true),
                            subtitleStyle: subtitleStyle || 'bold_yellow'
                        }
                    }),
                    signal: AbortSignal.timeout(25000)
                });

                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    webhookResponse = await res.json();
                } else {
                    webhookResponse = await res.text();
                }

                if (!res.ok) {
                    const errDetail = typeof webhookResponse === 'string'
                        ? webhookResponse.slice(0, 300)
                        : JSON.stringify(webhookResponse).slice(0, 300);
                    return NextResponse.json(
                        {
                            success: false,
                            webhookDispatched: false,
                            targetUrl: targetRenderUrl,
                            error: `Workflow 2 (spectra-video-render) returned HTTP ${res.status}: ${errDetail || res.statusText}`
                        },
                        { status: 502 }
                    );
                }
            } catch (err: any) {
                console.warn('Could not contact spectra-video-render webhook:', err.message);
                return NextResponse.json(
                    {
                        success: false,
                        webhookDispatched: false,
                        targetUrl: targetRenderUrl,
                        error: `Could not reach Workflow 2 (spectra-video-render): ${err.message}`
                    },
                    { status: 502 }
                );
            }

            // Only mark rendering after Workflow 2 actually accepted the webhook request
            await db.from('video_jobs').update({ status: 'rendering', error_detail: null }).eq('id', jobId);

            return NextResponse.json({
                success: true,
                jobId,
                status: 'rendering',
                webhookDispatched: true,
                webhookResponse: webhookResponse || 'ScalePods video render dispatched'
            });
        }

        // -------------------------------------------------------------
        // ACTION 2b: RESET STUCK RENDER BACK TO DRAFT
        // -------------------------------------------------------------
        if (action === 'reset_draft') {
            if (!jobId) {
                return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
            }

            const { data, error } = await db
                .from('video_jobs')
                .update({
                    status: 'draft_ready',
                    error_detail: null
                })
                .eq('id', jobId)
                .select()
                .single();

            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, job: normalizeJobUrls(data) });
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

