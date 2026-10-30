import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt = '', model = 'gpt-image-1', aspect_ratio = '4:5', format = 'image' } = body;

        const rawPrompt = prompt.trim();
        if (!rawPrompt) {
            return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
        }

        let enhancedPrompt = '';

        // 1. Try Anthropic Claude if ANTHROPIC_API_KEY exists
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (anthropicKey && !enhancedPrompt) {
            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': anthropicKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-haiku-20241022',
                        max_tokens: 400,
                        system: `You are an expert commercial advertising art director and AI prompt engineer specialized in Midjourney v6.1, OpenAI image generation, and Google Gemini.
Your task is to rewrite short or rough user visual briefs into hyper-detailed, photorealistic commercial production prompts.

PROMPT CRAFTING GUIDELINES:
- Establish subject and scene clearly with rich sensory detail.
- Specify luxury architectural aesthetics, modern interior environments (Dubai villas, apartments, modern facilities).
- Describe high-end camera & optical settings (e.g. "Hasselblad H6D-100c, 85mm f/2.8 lens, shallow depth of field, 8K razor-sharp details").
- Include precise lighting and atmosphere (e.g. "natural morning villa daylight, subtle soft volumetric rays, crisp cooling cyan airflow accents").
- If the user mentions discounts or offers (e.g. "50% off", "AED 199"), integrate an elegant commercial promotional badge or clean typographic overlay into the scene.
- Avoid blurry, cartoonish, or low-res keywords. Keep it strictly commercial and photorealistic.
- Return ONLY the final enhanced prompt text, without quotes, introductory text, explanations, or markdown code blocks.`,
                        messages: [
                            {
                                role: 'user',
                                content: `Asset Type: ${format} (Aspect Ratio: ${aspect_ratio}, Model: ${model})\nOriginal Brief: "${rawPrompt}"\n\nRewrite and enhance this into a single production-ready visual prompt:`
                            }
                        ]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data.content?.[0]?.text?.trim();
                    if (text) {
                        enhancedPrompt = text.replace(/^"|"$/g, '').trim();
                    }
                }
            } catch (err) {
                console.warn('Claude direct enhancement failed, trying next provider', err);
            }
        }

        // 2. Try OpenAI if OPENAI_API_KEY exists
        const openAiKey = process.env.OPENAI_API_KEY;
        if (openAiKey && !enhancedPrompt) {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${openAiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'system',
                                content: `You are an expert commercial advertising art director and AI prompt engineer specialized in Midjourney v6.1, OpenAI image generation, and Google Gemini.
Your task is to rewrite short or rough user visual briefs into hyper-detailed, photorealistic commercial production prompts.

PROMPT CRAFTING GUIDELINES:
- Establish subject and scene clearly with rich sensory detail.
- Specify luxury architectural aesthetics, modern interior environments (Dubai villas, apartments, modern facilities).
- Describe high-end camera & optical settings (e.g. "Hasselblad H6D-100c, 85mm f/2.8 lens, shallow depth of field, 8K razor-sharp details").
- Include precise lighting and atmosphere (e.g. "natural morning villa daylight, subtle soft volumetric rays, crisp cooling cyan airflow accents").
- If the user mentions discounts or offers (e.g. "50% off", "AED 199"), integrate an elegant commercial promotional badge or clean typographic overlay into the scene.
- Avoid blurry, cartoonish, or low-res keywords. Keep it strictly commercial and photorealistic.
- Return ONLY the final enhanced prompt text, without quotes, introductory text, explanations, or markdown code blocks.`
                            },
                            {
                                role: 'user',
                                content: `Asset Type: ${format} (Aspect Ratio: ${aspect_ratio}, Model: ${model})
Original Brief: "${rawPrompt}"

Rewrite and enhance this into a single production-ready visual prompt:`
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 350
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data.choices?.[0]?.message?.content?.trim();
                    if (text) {
                        enhancedPrompt = text.replace(/^"|"$/g, '').trim();
                    }
                }
            } catch (err) {
                console.warn('OpenAI direct enhancement failed, using heuristic expander', err);
            }
        }

        // 2. Intelligent Heuristic Prompt Expander (fallback / offline engine)
        if (!enhancedPrompt) {
            const hasDiscount = /50%|discount|offer|sale|deal|aed|price/i.test(rawPrompt);
            const hasAc = /ac|air condition|coil|duct|cooling|hvac|maintenance/i.test(rawPrompt);
            const hasVilla = /villa|room|living|interior|dubai|apartment/i.test(rawPrompt);

            const baseSubject = rawPrompt
                .replace(/^(generate|create|make|show)\s+(a\s+)?(photo|image|picture)\s+(of|with|showing)?/i, '')
                .trim();

            const promoText = hasDiscount ? " Bold modern typographic badge reading 'Special Summer Rate - 50% OFF' seamlessly integrated with clean graphic aesthetics." : "";
            const serviceDetail = hasAc 
                ? " Pristine HVAC ceiling diffuser emitting refreshing cyan airflow lines into the space, with a certified engineer in crisp navy Spectra uniform holding a digital precision cooling gauge."
                : "";
            const environment = hasVilla
                ? " Set in an ultra-luxurious modern Dubai villa living room with floor-to-ceiling glass windows revealing Dubai skyline in warm ambient sunlight."
                : " Modern luxury architectural environment with polished marble textures, ambient natural illumination, and premium designer furnishings.";

            enhancedPrompt = `Hyper-realistic commercial photography of ${baseSubject || 'premium property maintenance and cooling'}.${environment}${serviceDetail}${promoText} Hasselblad H6D-100c, 85mm f/2.8 lens, 8K ultra-detailed photorealistic resolution, cinematic architectural lighting, award-winning advertising composition.`;
        }

        return NextResponse.json({
            success: true,
            enhancedPrompt,
            originalPrompt: rawPrompt
        });
    } catch (error: any) {
        console.error('Enhance prompt endpoint error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to enhance prompt' },
            { status: 500 }
        );
    }
}

