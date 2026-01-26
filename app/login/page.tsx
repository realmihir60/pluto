

"use client"

import LoginForm from '@/app/ui/login-form';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PremiumBackground } from '@/components/premium-background';
import { motion } from 'framer-motion';

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
            <PremiumBackground />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative"
            >
                <div className="glass-morphism border border-white/20 rounded-[2.5rem] p-10 md:p-12 shadow-3xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150" />

                    <div className="mb-10 text-center space-y-4 relative z-10">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-2 shadow-inner">
                            <Sparkles className="h-8 w-8" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">
                            Welcome back.
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium italic">
                            Enter your credentials to access your secure health vault.
                        </p>
                    </div>

                    <LoginForm />

                    <div className="mt-12 text-center space-y-8 relative z-10">
                        <div className="text-sm text-muted-foreground font-medium pb-2">
                            Don't have an account? <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-black uppercase tracking-[0.1em]">Sign up</Link>
                        </div>
                        <Link
                            href="/"
                            className="text-xs text-muted-foreground/60 hover:text-primary transition-all flex items-center justify-center gap-1.5 hover:-translate-x-1 duration-200 font-bold uppercase tracking-widest pt-2"
                        >
                            <ArrowLeft className="size-3" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
