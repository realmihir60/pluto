'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { registerUser } from '@/app/lib/actions';

export default function SignupForm() {
    const [errorMessage, formAction] = useActionState(registerUser, undefined);

    return (
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
                {errorMessage && (
                    <>
                        <p className="text-sm text-red-500 font-medium">{errorMessage}</p>
                    </>
                )}
            </div>
        </form>
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
