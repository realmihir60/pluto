'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';

export default function LoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    );

    return (
        <form action={formAction} className="space-y-3">
            <div className="flex-1 rounded-lg bg-slate-900 px-6 pb-4 pt-8 text-white">
                <h1 className="mb-3 text-2xl font-bold">
                    Please log in to continue.
                </h1>
                <div className="w-full">
                    <div>
                        <label
                            className="mb-3 mt-5 block text-xs font-medium text-slate-200"
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-slate-700 bg-slate-800 py-[9px] pl-3 text-sm outline-2 placeholder:text-slate-400 focus:border-blue-500"
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
                            className="mb-3 mt-5 block text-xs font-medium text-slate-200"
                            htmlFor="password"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-slate-700 bg-slate-800 py-[9px] pl-3 text-sm outline-2 placeholder:text-slate-400 focus:border-blue-500"
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
                    className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                    aria-disabled={isPending}
                >
                    Log in
                </button>
                <div
                    className="flex h-8 items-end space-x-1"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {errorMessage && (
                        <>
                            <p className="text-sm text-red-500">{errorMessage}</p>
                        </>
                    )}
                </div>
                <div className="mt-4 text-center text-sm text-slate-400">
                    Don&apos;t have an account? <a href="/signup" className="text-blue-400 hover:underline">Sign up</a>
                </div>
            </div>
        </form>
    );
}
