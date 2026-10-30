import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

// Helper to get client (prefers supabaseAdmin for service role / bypass RLS, fallback to supabase)
const getDb = () => supabaseAdmin || supabase;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            post_type = 'image',
            topic = '',
            image_prompt = '',
            model = 'gpt-image-1',
            aspect_ratio = '1:1',
            variants = 1,
            reference_image_url = null,
            slides_json = [],
            webhookUrl = ''
        } = body;

        const chosenModel = model || 'gpt-image-1';
        const maxVariants = (chosenModel === 'dall-e-3' || chosenModel.startsWith('gemini')) ? 1 : 4;
        const safeVariants = Math.min(Math.max(Number(variants) || 1, 1), maxVariants);

        const db = getDb();

        // 1. Create the studio job in Supabase
        const insertPayload: any = {
            post_type,
            topic: topic || 'Spectra Dubai Maintenance Creative',
            image_prompt: image_prompt || topic || '',
            model: chosenModel,
            aspect_ratio: aspect_ratio || '1:1',
            variants: safeVariants,
            reference_image_url: reference_image_url || null,
            status: 'pending',
            image_urls: []
        };

        // If carousel, include slides_json
        if (post_type === 'carousel' && Array.isArray(slides_json) && slides_json.length > 0) {
            insertPayload.slides_json = slides_json;
        }

        const { data: job, error: insertError } = await db
            .from('spectra_studio_jobs')
            .insert(insertPayload)
            .select()
            .single();

        if (insertError) {
            console.error('Failed to insert spectra_studio_jobs:', insertError);
            return NextResponse.json(
                { success: false, error: `Database insert failed: ${insertError.message}` },
                { status: 500 }
            );
        }

        // 2. Dispatch to n8n webhook
        const targetWebhookUrl = webhookUrl?.trim() || process.env.N8N_STUDIO_WEBHOOK_URL;
        let webhookResult = null;
        let webhookDispatched = false;

        if (targetWebhookUrl && (targetWebhookUrl.startsWith('http://') || targetWebhookUrl.startsWith('https://'))) {
            try {
                const startTime = Date.now();
                const webhookRes = await fetch(targetWebhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Spectra-AI-Studio/2.0'
                    },
                    body: JSON.stringify({
                        jobId: job.id,
                        // Forwarding full body as well for debugging or legacy listeners
                        body: { jobId: job.id }
                    })
                });

                const latencyMs = Date.now() - startTime;
                let resData: any = null;
                const contentType = webhookRes.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    resData = await webhookRes.json();
                } else {
                    resData = await webhookRes.text();
                }

                webhookDispatched = webhookRes.ok;
                webhookResult = {
                    success: webhookRes.ok,
                    status: webhookRes.status,
                    latencyMs,
                    response: resData,
                    url: targetWebhookUrl
                };
            } catch (netErr: any) {
                console.warn('Could not contact n8n webhook URL:', netErr.message);
                webhookResult = {
                    success: false,
                    error: netErr.message,
                    url: targetWebhookUrl
                };
            }
        }

        return NextResponse.json({
            success: true,
            jobId: job.id,
            job,
            webhookDispatched,
            webhookResult
        });

    } catch (err: any) {
        console.error('Error in studio-jobs POST:', err);
        return NextResponse.json(
            { success: false, error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const limit = Number(searchParams.get('limit')) || 10;
        const db = getDb();

        if (id) {
            const { data: job, error } = await db
                .from('spectra_studio_jobs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 404 });
            }

            return NextResponse.json({ success: true, job });
        }

        const { data: jobs, error } = await db
            .from('spectra_studio_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, jobs });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err.message || 'Failed to fetch jobs' },
            { status: 500 }
        );
    }
}

