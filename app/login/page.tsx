

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
                <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl transition-all">
                    <div className="mb-8 text-center space-y-2">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access your vault.
                        </p>
                    </div>

                    <LoginForm />

                    <div className="mt-8 text-center space-y-4">
                        <div className="text-sm text-muted-foreground font-medium">
                            Don't have an account? <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-semibold">Sign up</Link>
                        </div>
                        <Link
                            href="/"
                            className="text-xs text-muted-foreground/60 hover:text-primary transition-all flex items-center justify-center gap-1.5 hover:-translate-x-1 duration-200"
                        >
                            <ArrowLeft className="size-3" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
