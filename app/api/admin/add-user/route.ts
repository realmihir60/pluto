import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, isAdmin } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                isAdmin: isAdmin || false,
                emailVerified: new Date(), // Auto-verify users added by admin
                hasConsented: true, // Auto-consent for admin-added users
            } as any,
        });

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('Add user error:', error);
        return NextResponse.json(
            { error: 'Failed to add user' },
            { status: 500 }
        );
    }
}
