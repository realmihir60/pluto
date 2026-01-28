'use client';

import { useActionState, useState } from 'react';
import { authenticate } from '@/app/lib/actions';
import { AlertCircle, Mail } from 'lucide-react';

export default function LoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    );
    const [email, setEmail] = useState('');
    const [resendingVerification, setResendingVerification] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    const handleResendVerification = async () => {
        if (!email) return;

        setResendingVerification(true);
        setResendMessage('');

        try {
            const res = await fetch('/api/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setResendMessage('Verification email sent! Check your inbox.');
            } else {
                const data = await res.json();
                setResendMessage(data.error || 'Failed to send verification email');
            }
        } catch (err) {
            setResendMessage('Failed to send verification email');
        } finally {
            setResendingVerification(false);
        }
    };

    const isUnverified = errorMessage === 'EMAIL_NOT_VERIFIED';

    return (
        <form action={formAction} className="space-y-3">
            <div className="w-full">
                <div>
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
                            onChange={(e) => setEmail(e.target.value)}
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
                        />
                    </div>
                </div>
            </div>
            <button
                className="mt-8 w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPending}
            >
                {isPending ? 'Signing in...' : 'Log in'}
            </button>

            {/* Error Messages */}
            <div
                className="flex flex-col gap-2 items-center min-h-[2rem]"
                aria-live="polite"
                aria-atomic="true"
            >
                {isUnverified && (
                    <div className="w-full space-y-3">
                        <div className="flex items-start gap-2 text-sm text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                            <AlertCircle className="size-4 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="font-semibold">Email not verified</p>
                                <p className="text-xs text-amber-400/80">
                                    Please check your inbox for the verification code.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={resendingVerification}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Mail className="size-4" />
                            {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                        </button>
                        {resendMessage && (
                            <p className={`text-xs text-center ${resendMessage.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
                                {resendMessage}
                            </p>
                        )}
                    </div>
                )}

                {errorMessage && !isUnverified && (
                    <p className="text-sm text-red-500 font-medium">{errorMessage}</p>
                )}
            </div>
        </form>
    );
}
