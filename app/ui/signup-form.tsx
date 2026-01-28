'use client';

import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { registerUser } from '@/app/lib/actions';
import { VerifyEmailModal } from '@/components/auth/verify-email-modal';
import { useRouter } from 'next/navigation';

export default function SignupForm() {
    const [errorMessage, formAction] = useActionState(registerUser, undefined);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyEmail, setVerifyEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState(''); // Store password for auto-login
    const router = useRouter();

    // Check if registration succeeded and verification is required
    useEffect(() => {
        if (errorMessage?.startsWith('VERIFICATION_REQUIRED:')) {
            const email = errorMessage.split(':')[1];
            setVerifyEmail(email);
            setShowVerifyModal(true);

            // Trigger verification email send
            fetch('/api/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
        }
    }, [errorMessage]);

    const handleVerified = async () => {
        // After verification, auto-login with stored credentials
        const formData = new FormData();
        formData.append('email', verifyEmail);
        formData.append('password', signupPassword);

        try {
            // Use NextAuth signIn
            const { signIn } = await import('next-auth/react');
            const result = await signIn('credentials', {
                email: verifyEmail,
                password: signupPassword,
                redirect: false,
            });

            if (result?.ok) {
                router.push('/dashboard');
            } else {
                // If auto-login fails, redirect to login page
                router.push('/login?verified=true');
            }
        } catch (error) {
            // Fallback: redirect to login
            router.push('/login?verified=true');
        }
    };

    return (
        <>
            <form action={formAction} className="space-y-3">
                <div className="w-full">
                    <div>
                        <label
                            className="mb-2 block text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider"
                            htmlFor="name"
                        >
                            Full Name
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/5 py-2.5 pl-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all backdrop-blur-sm"
                                id="name"
                                type="text"
                                name="name"
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label
                            className="mb-2 block text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider"
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/5 py-2.5 pl-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all backdrop-blur-sm"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label
                            className="mb-2 block text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider"
                            htmlFor="password"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/5 py-2.5 pl-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all backdrop-blur-sm"
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter password"
                                required
                                minLength={6}
                                onChange={(e) => setSignupPassword(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <SignupButton />
                <div
                    className="flex h-8 items-end space-x-1"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {errorMessage && !errorMessage.startsWith('VERIFICATION_REQUIRED:') && (
                        <>
                            <p className="text-sm text-red-500 font-medium">{errorMessage}</p>
                        </>
                    )}
                </div>
            </form>

            {showVerifyModal && (
                <VerifyEmailModal
                    email={verifyEmail}
                    onVerified={handleVerified}
                />
            )}
        </>
    );
}

function SignupButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="mt-8 w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pending}
        >
            {pending ? 'Creating Account...' : 'Sign up'}
        </button>
    );
}
