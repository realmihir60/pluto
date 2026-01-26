import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const prisma = new PrismaClient();

// Switch to Node.js runtime for OpenAI SDK support
export const runtime = "nodejs";



export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        // Initialize OpenAI client pointing to Groq
        // Lazy load to prevent build-time errors
        const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        });

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: "Chat functionality unavailable (Missing API Key)." },
                { status: 503 }
            );
        }

        const session = await auth();
        let userProfile = "Unknown User (Guest)";
        let factsList = "None";

        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                include: { medicalFacts: true }
            });
            if (user) {
                userProfile = `${user.name} (${user.email})`;
                factsList = user.medicalFacts.map((f: any) => `- ${f.type}: ${f.value}`).join("\n");
            }
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are Pluto, a **Medical Education Assistant**.
          
          **USER CONTEXT**:
          User: ${userProfile}
          KNOWN MEDICAL PROFILE (from DB):
          ${factsList}

          You have just provided an educational assessment to the user.
          Now you are answering follow-up questions about **concepts**, not the user's specific body.
          
          **CRITICAL SAFETY RULES**:
          1. **NO DIAGNOSIS**: Do not say "You likely have...". Say "This condition is often characterized by...".
          2. **EVIDENCE TRACKING**: You only know what the user explicitly stated. Do NOT assume habits (e.g., "You probably stare at screens").
          3. **HOLISTIC SYNTHESIS**: If the user adds new symptoms (e.g., "head hurting" + "legs cold"), try to find a single underlying cause (e.g. "Viral Trome") that explains BOTH. Explain this connection educationally.
          4. **DISJOINT WARNING**: Only block if the new symptom is **Red Flag AND Unrelated** (e.g., "Tooth pain" -> "Sudden Chest Crushing"). In that specific case, ask: "Is this new chest pain related to your tooth, or happening separately?"
          `
                },
                ...messages
            ],
            max_tokens: 300,
            temperature: 0.3,
        });

        const content = completion.choices[0].message.content;

        return NextResponse.json({ role: "assistant", content });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: "Failed to process chat request" },
            { status: 500 }
        );
    }
}
