import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
    // Matcher protects only dashboard and consent/chat APIs
    // Demo and triage are public for testing
    matcher: [
        '/dashboard/:path*',
        '/api/chat',
        '/api/memory',
        '/api/consent'
    ],
};
