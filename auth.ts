import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
        // We ensure HS256 for compatibility with standard PyJWT
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password || '');
                    if (passwordsMatch) {
                        // SECURITY: Enforce email verification
                        if (!user.emailVerified) {
                            throw new Error('EMAIL_NOT_VERIFIED');
                        }

                        return {
                            id: (user as any).id,
                            email: (user as any).email,
                            name: (user as any).name,
                            hasConsented: (user as any).hasConsented,
                            isAdmin: (user as any).isAdmin || false
                        };
                    }
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.hasConsented = (user as any).hasConsented;
                token.isAdmin = (user as any).isAdmin || false;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).hasConsented = token.hasConsented as boolean;
                (session.user as any).isAdmin = token.isAdmin as boolean;
            }
            return session;
        },
    },
});
