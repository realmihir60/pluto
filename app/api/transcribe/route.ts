import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.GROQ_API_KEY || "",
            baseURL: "https://api.groq.com/openai/v1",
        });
        const formData = await request.formData();
        const file = formData.get("audio") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No audio file provided" },
                { status: 400 }
            );
        }

        // Call Groq's Whisper implementation
        // model: distil-whisper-large-v3-en is the fastest for English
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3",
            response_format: "json",
        });

        return NextResponse.json({ text: transcription.text });
    } catch (error) {
        console.error("Transcription error:", error);
        return NextResponse.json(
            { error: "Failed to transcribe audio" },
            { status: 500 }
        );
    }
}
