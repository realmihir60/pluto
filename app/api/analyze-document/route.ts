import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Force Node.js runtime
export const runtime = 'nodejs';

// Initialize OpenAI client pointing to Groq
const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
    try {
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: 'Server configuration error: Missing Groq API Key' },
                { status: 500 }
            );
        }

        const { image } = await req.json();

        if (!image) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        // Call Groq Llama 3.2 Vision (90b is the supported preview currently)
        const response = await openai.chat.completions.create({
            model: "llama-3.2-90b-vision-preview",
            messages: [
                {
                    role: "system",
                    content: `You are Pluto, a helpful medical assistant.
          Analyze the medical document or image provided.
          Extract key findings, potential conditions mentioned, and severity if applicable.

          Return a JSON structure (ONLY JSON) with:
          - summary: A brief summary of what the document/image shows.
          - key_findings: List of bullet points.
          - disclaimer: "This is an AI summary of a document, not a medical diagnosis."`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Please analyze this medical image/document." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": image,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 500,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No analysis generated');

        const analysis = JSON.parse(content);

        return NextResponse.json(analysis);

    } catch (error) {
        console.error('Document Analysis Error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze document' },
            { status: 500 }
        );
    }
}
