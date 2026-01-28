import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json(
                { error: 'Email and verification code are required' },
                { status: 400 }
            );
        }

        // Find the most recent verification token for this email
        const verificationToken = await prisma.verificationToken.findFirst({
            where: { identifier: email },
            orderBy: { expires: 'desc' },
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: 'No verification code found. Please request a new one.' },
                { status: 404 }
            );
        }

        // Check if token has expired
        if (verificationToken.expires < new Date()) {
            await prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: email,
                        token: verificationToken.token,
                    },
                },
            });
            return NextResponse.json(
                { error: 'Verification code has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Verify the OTP
        const isValidOTP = await bcrypt.compare(code, verificationToken.token);

        if (!isValidOTP) {
            return NextResponse.json(
                { error: 'Invalid verification code' },
                { status: 400 }
            );
        }

        // Mark email as verified
        const user = await prisma.user.update({
            where: { email },
            data: { emailVerified: new Date() },
        });

        // Delete the used verification token
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: email,
                    token: verificationToken.token,
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Verify email error:', error);
        return NextResponse.json(
            { error: 'Failed to verify email' },
            { status: 500 }
        );
    }
}
