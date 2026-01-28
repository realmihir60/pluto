import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Optional: Use Resend if API key is provided
let resend: any = null;
if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
}

// Generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'No account found with this email' },
                { status: 404 }
            );
        }

        if (user.emailVerified) {
            return NextResponse.json(
                { error: 'Email already verified' },
                { status: 400 }
            );
        }

        // Rate limiting: Check recent verification attempts
        const recentTokens = await prisma.verificationToken.findMany({
            where: {
                identifier: email,
                expires: { gt: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
            },
        });

        if (recentTokens.length >= 3) {
            return NextResponse.json(
                { error: 'Too many verification attempts. Please try again later.' },
                { status: 429 }
            );
        }

        // Generate and hash OTP
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        // Delete old verification tokens for this email
        await prisma.verificationToken.deleteMany({
            where: { identifier: email },
        });

        // Store new verification token (expires in 15 minutes)
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: hashedOTP,
                expires: new Date(Date.now() + 15 * 60 * 1000),
            },
        });

        // Send verification email
        const emailHTML = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1419; color: #ededed; padding: 40px; border-radius: 24px;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="display: inline-block; width: 60px; height: 60px; background: white; color: black; font-weight: 900; font-size: 32px; border-radius: 16px; line-height: 60px; margin-bottom: 20px;">P</div>
                    <h1 style="font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -1px;">Verify Your Email</h1>
                </div>
                <p style="font-size: 16px; line-height: 1.6; color: #a8b3cf; margin-bottom: 30px;">
                    Welcome to Pluto Health! Enter this verification code to activate your account:
                </p>
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                    <div style="font-size: 48px; font-weight: 900; letter-spacing: 8px; color: #fff; font-family: 'Courier New', monospace;">${otp}</div>
                </div>
                <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
                    This code expires in <strong style="color: #fff;">15 minutes</strong>.<br/>
                    If you didn't request this, please ignore this email.
                </p>
                <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: 2px; margin: 0;">
                        Pluto Intelligence • Clinical-Grade Security
                    </p>
                </div>
            </div>
        `;

        // Try multiple email providers in order of preference
        let emailSent = false;

        // 1. Try Resend (if API key provided)
        if (resend) {
            try {
                await resend.emails.send({
                    from: 'Pluto Health <verify@pluto-health.com>',
                    to: email,
                    subject: 'Verify your Pluto account',
                    html: emailHTML,
                });
                emailSent = true;
                console.log('✅ Verification email sent via Resend');
            } catch (emailError) {
                console.error('Resend error:', emailError);
            }
        }

        // 2. Try Gmail SMTP (free, no API key required)
        if (!emailSent && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_APP_PASSWORD,
                    },
                });

                await transporter.sendMail({
                    from: `"Pluto Health" <${process.env.GMAIL_USER}>`,
                    to: email,
                    subject: 'Verify your Pluto account',
                    html: emailHTML,
                });
                emailSent = true;
                console.log('✅ Verification email sent via Gmail SMTP');
            } catch (emailError) {
                console.error('Gmail SMTP error:', emailError);
            }
        }

        // 3. Development mode: log to console
        if (!emailSent) {
            console.log(`\n🔐 VERIFICATION CODE for ${email}: ${otp}\n`);
            console.log('💡 Email not sent (no email service configured)');
            console.log('   Set GMAIL_USER + GMAIL_APP_PASSWORD for free Gmail SMTP');
            console.log('   Or set RESEND_API_KEY for Resend service\n');
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email',
        });
    } catch (error) {
        console.error('Send verification error:', error);
        return NextResponse.json(
            { error: 'Failed to send verification email' },
            { status: 500 }
        );
    }
}
