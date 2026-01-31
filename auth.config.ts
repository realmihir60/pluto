import type { NextAuthConfig } from 'next-auth';
import { SignJWT, jwtVerify } from 'jose';

// Helper to extract the actual secret string from NextAuth's secret parameter
function getSecretKey(secret: string | { key: string } | Buffer): Uint8Array {
    let secretString: string;
    if (typeof secret === 'string') {
        secretString = secret;
    } else if (secret && typeof secret === 'object' && 'key' in secret) {
        secretString = secret.key;
    } else if (Buffer.isBuffer(secret)) {
        secretString = secret.toString('utf-8');
    } else {
        // Fallback to AUTH_SECRET from environment
        secretString = process.env.AUTH_SECRET || '';
    }
    return new TextEncoder().encode(secretString);
}

// Define the JWT configuration separately to be shared
export const authConfig = {
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
        // Enforce HS256 Signing (JWS) instead of Encryption (JWE) for Python compatibility
        async encode({ secret, token }) {
            console.log('[AUTH] JWT Encode called');
            const key = getSecretKey(secret as any);
            const jwt = await new SignJWT(token as any)
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('30d')
                .sign(key);
            console.log('[AUTH] JWT created successfully');
            return jwt;
        },
        async decode({ secret, token }) {
            if (!token) return null;
            try {
                const key = getSecretKey(secret as any);
                const { payload } = await jwtVerify(token, key, {
                    algorithms: ['HS256'],
                });
                console.log('[AUTH] JWT decoded successfully');
                return payload;
            } catch (error) {
                console.error('[AUTH] JWT Decode Error:', error);
                return null;
            }
        },
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnProtectedRoute = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/demo');

            console.log('[AUTH] Middleware check:', {
                path: nextUrl.pathname,
                isLoggedIn,
                isOnProtectedRoute
            });

            if (isOnProtectedRoute) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            } else if (isLoggedIn && nextUrl.pathname === '/login') {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.sub = user.id; // Ensure 'sub' claim is set for Python compatibility
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
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
