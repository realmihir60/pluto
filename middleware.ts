import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
    // PUBLIC MODE: Removing protection for testing clinical flows
    matcher: [
        '/dashboard/:path*',
    ],
};
