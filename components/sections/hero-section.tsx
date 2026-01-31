"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Activity, Search, ShieldCheck, Heart, Zap, ChevronRight } from "lucide-react"

export function HeroSection() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  const fadeIn = prefersReducedMotion
    ? {}
    : {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-48 pb-40 overflow-hidden bg-background">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[80px] animate-pulse will-change-transform" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[100px] will-change-transform" />

        {/* Fine Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />

        {/* Grid pattern with gradient fade */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.05]" />
      </div>

      <div className="max-w-7xl mx-auto text-center z-10">
        {/* Premium Badge */}
        <motion.div
          {...fadeIn}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-[13px] font-semibold text-primary mb-10 shadow-lg shadow-primary/5"
        >
          <Sparkles className="size-3.5 fill-primary" />
          <span>Clinical Reasoning Engine v4.1 — 87.5% Validated</span>
        </motion.div>

        {/* Headline with Gradient Text */}
        <motion.h1
          {...(prefersReducedMotion ? {} : { ...fadeIn, transition: { ...fadeIn.transition, delay: 0.1 } })}
          className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.05] selection:bg-primary/20"
        >
          <span className="text-gradient">Understand Your Symptoms.</span>
          <br />
          <span className="text-primary italic font-serif">Get Clear Answers.</span>
        </motion.h1>

        {/* Subheadline with better balance */}
        <motion.p
          {...(prefersReducedMotion ? {} : { ...fadeIn, transition: { ...fadeIn.transition, delay: 0.2 } })}
          className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed text-balance"
        >
          Tell us what's going on. We'll help you figure out what to do next.
        </motion.p>

        {/* Primary CTA Area */}
        <motion.div
          {...(prefersReducedMotion ? {} : { ...fadeIn, transition: { ...fadeIn.transition, delay: 0.3 } })}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Button
            asChild
            size="lg"
            className="h-14 px-10 text-lg font-bold primary-gradient rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Link href="/demo" className="inline-flex items-center gap-3">
              Begin Health Assessment
              <ArrowRight className="size-5 shrink-0" />
            </Link>
          </Button>

          <Link
            href="/how-it-works"
            className="text-lg font-bold text-muted-foreground hover:text-foreground transition-all duration-300 flex items-center gap-2 group"
          >
            Explore Methodology
            <ChevronRight className="size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </motion.div>

        {/* Trust markers - De-emphasized */}
        <motion.div
          {...(prefersReducedMotion ? {} : { ...fadeIn, transition: { ...fadeIn.transition, delay: 0.5 } })}
          className="mt-20 flex flex-wrap items-center justify-center gap-10 opacity-40 hover:opacity-100 transition-opacity duration-700"
        >
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            AES-256 Encrypted
          </div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <Heart className="size-3.5" />
            HIPAA Aligned
          </div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <Zap className="size-3.5" />
            Groq Powered
          </div>
        </motion.div>

        {/* Professional Clinical Mockup */}
        <motion.div
          {...(prefersReducedMotion ? {} : { ...fadeIn, transition: { ...fadeIn.transition, delay: 0.7 } })}
          className="mt-28 relative mx-auto max-w-5xl"
        >
          {/* Main Container */}
          <div className="relative p-2 rounded-3xl bg-linear-to-b from-white/10 to-transparent border border-white/10 shadow-[0_0_100px_-20px_rgba(37,99,235,0.2)]">
            <div className="bg-card rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              {/* Tool Bar */}
              <div className="px-6 py-4 bg-muted/30 border-b border-border/40 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="size-3.5 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="size-3.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                  <div className="size-3.5 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <div className="px-3 py-1 bg-background/80 rounded-lg border border-border/50 text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                  <Activity className="size-3" />
                  Live Clinical Dashboard
                </div>
                <div className="w-16" />
              </div>

              {/* Interface Content */}
              <div className="grid md:grid-cols-[280px_1fr] h-[500px]">
                {/* Sidebar Mock */}
                <div className="hidden md:flex flex-col border-r border-border/40 bg-muted/10 p-4 space-y-6">
                  <div className="space-y-3">
                    <div className="h-2 w-20 bg-muted rounded" />
                    <div className="h-8 w-full bg-primary/5 rounded-xl border border-primary/10" />
                    <div className="h-8 w-full bg-muted/40 rounded-xl" />
                    <div className="h-8 w-full bg-muted/40 rounded-xl" />
                  </div>
                  <div className="pt-6 border-t border-border/20 space-y-3">
                    <div className="h-2 w-24 bg-muted rounded" />
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-secondary" />
                      <div className="space-y-1 flex-1">
                        <div className="h-2 w-full bg-muted/60 rounded" />
                        <div className="h-1.5 w-2/3 bg-muted/40 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Mock */}
                <div className="p-8 flex flex-col relative">
                  {/* Glowing highlights */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

                  <div className="flex-1 overflow-hidden">
                    <div className="max-w-xl mx-auto space-y-8">
                      {/* Chat Sequence */}
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground px-6 py-4 rounded-2xl rounded-tr-sm shadow-xl font-medium text-sm">
                          Started feeling sharp chest pressure after my morning run. Difficulty breathing.
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="size-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                          <Activity className="size-5 text-primary-foreground" />
                        </div>
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">PLUTO AI</span>
                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">CRITICAL SCAN</span>
                          </div>

                          {/* Result Block */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 2, duration: 0.6 }}
                            className="bg-background border border-border shadow-2xl rounded-2xl p-6 relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                            <div className="flex justify-between mb-4">
                              <h4 className="font-bold text-lg flex items-center gap-2">
                                <ShieldCheck className="size-5 text-red-500" />
                                High Risk: Cardiac Incident
                              </h4>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                              Your symptoms match a deterministic pattern for <span className="font-bold text-foreground">Myocardial Infarction</span>.
                              <br /><br />
                              <strong>ACTION REQUIRED:</strong> Please call local emergency services (911) immediately. Do not drive yourself.
                            </p>
                            <div className="pt-4 border-t border-border/40 flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                              <span>Guideline: ACC/AHA 2024</span>
                              <span className="flex items-center gap-1"><Search className="size-3" /> MATCH: 99.4%</span>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative floating elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-12 -right-8 glass p-4 rounded-2xl shadow-xl hidden lg:block"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <ShieldCheck className="size-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Privacy Shield</p>
                <p className="text-sm font-bold">Zero-Knowledge Base</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
