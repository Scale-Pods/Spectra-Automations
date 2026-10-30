import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { webhookUrl, payload } = body;

        const timestamp = new Date().toISOString();
        const fullPayload = {
            sender: "Spectra Dubai AI Content Studio",
            company: "Spectra Property Maintenance & AC Servicing LLC",
            website: "https://www.spectradubai.com/",
            headquarters: "Dubai, United Arab Emirates",
            contactChannel: "WhatsApp Business (+971 50 XXX XXXX)",
            timestamp,
            ...payload
        };

        // If a real webhook URL is provided, forward the request
        if (webhookUrl && (webhookUrl.startsWith('http://') || webhookUrl.startsWith('https://'))) {
            try {
                const startTime = Date.now();
                const webhookRes = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Spectra-Dubai-AI-Studio/1.0',
                        'X-Spectra-Event': 'ai_content_generation_requested'
                    },
                    body: JSON.stringify(fullPayload)
                });

                const latencyMs = Date.now() - startTime;
                let responseData = null;
                const contentType = webhookRes.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    responseData = await webhookRes.json();
                } else {
                    responseData = await webhookRes.text();
                }

                return NextResponse.json({
                    success: webhookRes.ok,
                    status: webhookRes.status,
                    statusText: webhookRes.statusText,
                    latencyMs,
                    dispatchedTo: webhookUrl,
                    response: responseData,
                    payload: fullPayload
                });
            } catch (networkErr: any) {
                return NextResponse.json({
                    success: false,
                    error: `Could not reach webhook endpoint: ${networkErr.message}`,
                    dispatchedTo: webhookUrl,
                    payload: fullPayload
                }, { status: 502 });
            }
        }

        // Default: Webhook URL is not configured yet or in draft mode
        return NextResponse.json({
            success: true,
            simulated: true,
            message: "Payload generated successfully. You can attach your live webhook URL anytime in the Webhook Settings to dispatch directly to your n8n / Make.com / Zapier or custom AI generation pipeline.",
            payload: fullPayload
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to process webhook dispatch" },
            { status: 500 }
        );
    }
}
