'use server';

import { signIn, auth } from '@/auth';
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

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

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

export async function saveTriageResult(data: {
    symptoms: string;
    aiResult: any;
}) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Not authenticated" };
    }

    const { symptoms, aiResult } = data;

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) throw new Error("User not found");

        await prisma.triageEvent.create({
            data: {
                userId: user.id,
                symptoms: symptoms,
                aiResult: aiResult,
                actionRecommended: aiResult.severity?.level || "Unknown",
                urgency: aiResult.severity?.level?.includes("URGENT") ? "High" : "Low",
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to save triage:", error);
        return { error: "Database error" };
    }
}
