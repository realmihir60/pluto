

import LoginForm from '@/app/ui/login-form';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-background">
                <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
                <div className="absolute top-[-10%] left-[-20%] h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-20%] h-[500px] w-[500px] rounded-full bg-purple-400/20 blur-[100px]" />
            </div>

            <div className="w-full max-w-sm relative">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
                    <div className="mb-8 text-center space-y-2">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-2">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Welcome back
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Enter your credentials to access your vault.
                        </p>
                    </div>

                    <LoginForm />

                    <div className="mt-6 text-center space-y-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            Don't have an account? <Link href="/signup" className="text-blue-600 hover:underline">Sign up</Link>
                        </div>
                        <Link href="/" className="text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1">
                            <ArrowLeft className="size-3" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
