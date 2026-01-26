"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Activity, Search, ShieldCheck } from "lucide-react"

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
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    }

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 pt-20 pb-32 overflow-hidden selection:bg-primary/10">

      {/* Background Gradients & Grid */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        {/* Dot Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto text-center z-10">

        {/* Badge */}
        <motion.div
          {...fadeIn}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/60 text-xs font-medium text-secondary-foreground mb-8 backdrop-blur-md shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          v1.0 Public Preview
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...(prefersReducedMotion ? {} : { ...fadeIn, transition: { ...fadeIn.transition, delay: 0.1 } })}
          className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]"
        >
          Check your symptoms, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-600 to-blue-500">
            keep your privacy.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...(prefersReducedMotion ? {} : { ...fadeIn, transition: { ...fadeIn.transition, delay: 0.2 } })}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed text-balance"
        >
          Advanced medical triage powered by trusted clinical guidelines and Llama 3.
          <span className="block mt-2 text-foreground/80 font-medium">No account required. No data stored.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          {...(prefersReducedMotion ? {} : { ...fadeIn, transition: { ...fadeIn.transition, delay: 0.3 } })}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="h-12 px-8 text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all rounded-full bg-primary hover:bg-primary/90"
          >
            <Link href="/signup" className="inline-flex items-center gap-2">
              Start Free Checkup
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base bg-background/50 backdrop-blur-md border-border hover:bg-secondary/60 rounded-full"
          >
            <Link href="/how-it-works">
              How it works
            </Link>
          </Button>
        </motion.div>

        {/* Mockup / Visual */}
        <motion.div
          {...(prefersReducedMotion ? {} : { ...fadeIn, transition: { ...fadeIn.transition, delay: 0.5 } })}
          className="mt-24 relative mx-auto max-w-4xl perspective-[1000px]"
        >
          {/* Glow Effect behind card */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent blur-3xl -z-10" />

          <div
            className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-1 shadow-2xl ring-1 ring-white/10 overflow-hidden transform-gpu rotate-x-[5deg] origin-bottom transition-transform hover:rotate-x-0 duration-700 ease-out"
          >
            {/* Window Controls */}
            <div className="bg-muted/50 px-4 py-3 border-b border-border/50 flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-400/80" />
                <div className="size-3 rounded-full bg-amber-400/80" />
                <div className="size-3 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/50 border border-border/50 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                  <ShieldCheck className="size-3" />
                  Secure Environment
                </div>
              </div>
              <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Interface Content */}
            <div className="p-8 md:p-12 relative min-h-[300px] flex flex-col items-center justify-center bg-gradient-to-b from-card to-secondary/20">

              {/* Scanning Bar Animation */}
              <motion.div
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.5)] z-20 pointer-events-none"
              />

              <div className="w-full max-w-lg space-y-6">
                {/* Chat Bubble 1 (User) */}
                <div className="flex gap-4 justify-end">
                  <div className="bg-primary text-primary-foreground px-5 py-3 rounded-2xl rounded-tr-sm shadow-md max-w-[80%]">
                    <p className="text-sm font-medium">My right eye hurts when I look at screens...</p>
                  </div>
                </div>

                {/* Processing Indicator */}
                <div className="flex gap-4 justify-start items-center">
                  <div className="size-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                    <Activity className="size-4 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-2 w-full">
                    <div className="h-4 w-24 bg-secondary/80 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-secondary/50 rounded animate-pulse" />
                  </div>
                </div>

                {/* Analysis Card (Result) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="mt-4 bg-background border border-border/60 rounded-xl p-5 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Search className="size-4 text-primary" />
                      Pattern Detected
                    </h3>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Possible Strain
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Symptoms align with <span className="font-medium text-foreground">Computer Vision Syndrome</span>.
                    <span className="block mt-1 text-xs text-muted-foreground">Confidence: 92% (Clinical Rule matched)</span>
                  </p>
                </motion.div>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
