import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const rawUrl = searchParams.get('url');

        if (!rawUrl) {
            return new NextResponse('Missing url parameter', { status: 400 });
        }

        // Extract clean http(s) URL if rawUrl contains titles or newlines
        const match = rawUrl.match(/https?:\/\/[^\s\)\"\']+/i);
        const targetUrl = match ? match[0] : rawUrl;

        const reqMime = searchParams.get('mime_type') || searchParams.get('type');
        const filename = searchParams.get('filename') || '';

        // Pass along range header for audio/video seeking support
        const range = request.headers.get('range');
        const fetchHeaders: Record<string, string> = {};
        if (range) {
            fetchHeaders['range'] = range;
        }

        const audioRes = await fetch(targetUrl, { headers: fetchHeaders });

        if (!audioRes.ok && audioRes.status !== 206) {
            return new NextResponse(`Failed to fetch media (${audioRes.status})`, { status: audioRes.status });
        }

        const responseHeaders = new Headers();
        let contentType = audioRes.headers.get('content-type') || '';

        // Detect correct media type if upstream returned generic octet-stream
        const disp = audioRes.headers.get('content-disposition') || '';
        const combinedName = (filename + ' ' + disp + ' ' + targetUrl).toLowerCase();

        if (!contentType || contentType.includes('octet-stream') || contentType.includes('text/plain')) {
            if (reqMime && !reqMime.includes('octet-stream')) {
                contentType = reqMime;
            } else if (combinedName.includes('.ogg')) {
                contentType = 'audio/ogg';
            } else if (combinedName.includes('.mp3')) {
                contentType = 'audio/mpeg';
            } else if (combinedName.includes('.wav')) {
                contentType = 'audio/wav';
            } else if (combinedName.includes('.m4a') || combinedName.includes('.aac')) {
                contentType = 'audio/mp4';
            } else if (combinedName.includes('.mp4')) {
                contentType = 'video/mp4';
            } else if (combinedName.includes('.webm')) {
                contentType = 'video/webm';
            } else if (combinedName.includes('.pdf')) {
                contentType = 'application/pdf';
            } else {
                contentType = 'audio/ogg';
            }
        }

        const contentLength = audioRes.headers.get('content-length');
        const contentRange = audioRes.headers.get('content-range');
        const acceptRanges = audioRes.headers.get('accept-ranges') || 'bytes';

        responseHeaders.set('Content-Type', contentType);
        responseHeaders.set('Content-Disposition', 'inline');
        responseHeaders.set('Accept-Ranges', acceptRanges);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Cache-Control', 'public, max-age=86400');

        if (contentLength) responseHeaders.set('Content-Length', contentLength);
        if (contentRange) responseHeaders.set('Content-Range', contentRange);

        const status = audioRes.status === 206 ? 206 : 200;

        return new NextResponse(audioRes.body, {
            status,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error('Audio proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
