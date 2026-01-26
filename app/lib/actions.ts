'use server';

import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function handleSignOut() {
    await signOut({ redirectTo: '/login' });
}

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function registerUser(prevState: string | undefined, formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password || !name) return "Missing fields";

    try {
        // 1. Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return "User already exists with this email.";
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create user
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

    } catch (error) {
        console.error("Registration Error:", error);
        return `Failed to create account: ${error instanceof Error ? error.message : String(error)}`;
    }

    // 4. Redirect to login (or auto-login)
    redirect('/login');
}


// --- AI Memory Service ---

import OpenAI from 'openai';

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export async function extractAndSaveFacts(userId: string, text: string) {
    console.log("Memory Service: Extracting facts for user", userId);

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a medical data clerk. Extract PERMANENT medical facts from the user's text.
                    Ignore temporary symptoms like "I have a headache".
                    Focus on:
                    1. Chronic Conditions (e.g. Asthma, Diabetes)
                    2. Medications (e.g. Lisinopril, Ibuprofen)
                    3. Allergies (e.g. Penicillin, Peanuts)
                    4. Surgeries (e.g. Appendectomy)
                    5. Biological Sex or Age if mentioned.

                    **OUTPUT JSON**:
                    {
                        "facts": [
                            { "type": "Condition" | "Medication" | "Allergy" | "Surgery" | "Profile", "value": "Asthma", "meta": {} }
                        ]
                    }
                    If nothing relevant, return { "facts": [] }.`
                },
                { role: "user", content: text }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const content = completion.choices[0].message.content;
        const result = JSON.parse(content || '{"facts": []}');

        if (result.facts && result.facts.length > 0) {
            console.log("Memory Service: Found facts:", result.facts);

            // Save via Prisma
            // We use a loop to save each fact. In a real app, use createMany or careful upsert.
            for (const fact of result.facts) {
                await prisma.medicalFact.create({
                    data: {
                        userId: userId,
                        type: fact.type,
                        value: fact.value,
                        meta: fact.meta || {},
                        source: "Chat Extraction",
                        confidence: "Inferred"
                    }
                });
            }
        }

    } catch (error) {
        console.error("Memory Extraction Failed:", error);
    }
}

export async function updateUserConsent() {
    const session = await auth();
    if (!session?.user?.email) return { error: "Not authenticated" };

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: { hasConsented: true }
        });
        return { success: true };
    } catch (error) {
        console.error("Consent Update Failed:", error);
        return { error: "Failed to save consent" };
    }
}

export async function saveTriageResult(data: {
    symptoms: string;
    aiResult: any;
    engineVersion?: string;
    logicSnapshot?: any;
}) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Not authenticated" };
    }

    const { symptoms, aiResult, engineVersion, logicSnapshot } = data;

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) throw new Error("User not found");

        // 1. Save Event with Full Compliance Snapshot
        await prisma.triageEvent.create({
            data: {
                userId: user.id,
                symptoms: symptoms,
                aiResult: aiResult,
                engineVersion: engineVersion || "2.1.0-js",
                logicSnapshot: logicSnapshot || {},
                actionRecommended: aiResult.severity?.level || aiResult.triage_level || "Unknown",
                urgency: (aiResult.severity?.level?.includes("URGENT") ||
                    aiResult.triage_level?.includes("urgent") ||
                    aiResult.triage_level === "crisis") ? "High" : "Low",
            },
        });

        // 2. Trigger Memory Extraction
        await extractAndSaveFacts(user.id, symptoms);

        return { success: true };
    } catch (error) {
        console.error("Failed to save triage:", error);
        return { error: "Database error" };
    }
}
