import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
    // Matcher protects dashboard and demo, and our custom Python APIs
    matcher: [
        '/dashboard/:path*',
        '/demo/:path*',
        '/api/triage',
        '/api/chat',
        '/api/memory',
        '/api/consent'
    ],
};
