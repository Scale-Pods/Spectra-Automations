import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const rawUrl = searchParams.get('url');

        if (!rawUrl) {
            return new NextResponse('Missing url parameter', { status: 400 });
        }

        // 1. Try to extract the relative storage path inside 'content-media' bucket
        // Handles: https://.../content-media/studio/xxx/yyy.png or studio/xxx/yyy.png
        const match = rawUrl.match(/content-media\/(.+)$/);
        const storagePath = match ? match[1] : (rawUrl.startsWith('studio/') ? rawUrl : null);

        const db = supabaseAdmin || supabase;

        if (storagePath && db) {
            // Download directly from Supabase Storage using service role (bypasses private/RLS restrictions)
            const { data, error } = await db.storage.from('content-media').download(storagePath);
            if (!error && data) {
                const arrayBuffer = await data.arrayBuffer();
                return new NextResponse(Buffer.from(arrayBuffer), {
                    headers: {
                        'Content-Type': data.type || 'image/png',
                        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200'
                    }
                });
            }
        }

        // 2. Direct fetch fallback: fix domain if it pointed to old instance
        const correctedUrl = rawUrl.replace(
            /https:\/\/[a-z0-9]+\.supabase\.co/i,
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cnjdinmwpfqkbfarsbxv.supabase.co'
        );

        const res = await fetch(correctedUrl);
        if (res.ok) {
            const blob = await res.blob();
            const arrayBuffer = await blob.arrayBuffer();
            return new NextResponse(Buffer.from(arrayBuffer), {
                headers: {
                    'Content-Type': blob.type || 'image/png',
                    'Cache-Control': 'public, max-age=86400'
                }
            });
        }

        return new NextResponse(`Image not found at path: ${storagePath || rawUrl}`, { status: 404 });
    } catch (err: any) {
        return new NextResponse(`Error proxying image: ${err.message}`, { status: 500 });
    }
}

