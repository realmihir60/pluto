"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, X, Shield, Lock, AlertTriangle, Cpu, Zap, Activity } from "lucide-react"
import { PremiumBackground } from "@/components/ui/premium-background"

const doesItems = [
  "✅ Active rate limiting (50/hr auth, 10/hr anon) prevents abuse",
  "✅ Real-time structured logging tracks all triage events (JSON)",
  "✅ User-friendly error handling for LLM, database, and timeout failures",
  "✅ Feedback system: Rate every triage, help us improve continuously",
  "✅ Admin dashboard with metrics API for complete observability",
  "✅ Phase 1 doctor-like triage with simple language and assessment tables",
]

const doesNotItems = [
  "Does NOT diagnose diseases or replace a doctor",
  "Does NOT store your conversation history after the session",
  "Does NOT sell or share health data with third parties",
  "Does NOT allow the engine to hallucinate on safety checks",
  "Does NOT manage chronic conditions or prescriptions",
  "Does NOT handle emergency response (Call 911)",
]

export default function TrustPage() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  const animationProps = prefersReducedMotion
    ? {}
    : {
      initial: { opacity: 0, y: 30 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    }

  return (
    <main className="min-h-screen pt-32 pb-32 px-6 relative overflow-hidden">
      <PremiumBackground />

      <div className="max-w-6xl mx-auto relative cursor-default">
        {/* Page Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-8">
            <Shield className="size-4" />
            Clinical Security
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-8 tracking-tighter">
            Safety by <span className="text-primary italic">Engineering</span>.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            Pluto is built on a <span className="text-foreground">multi-layered safety system</span> designed to prioritize clinical accuracy and zero-knowledge privacy.
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-12 mb-32">
          {/* How Pluto Protects You */}
          <motion.div
            {...animationProps}
            className="glass-morphism border border-white/20 rounded-[2.5rem] p-10 md:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl -mr-16 -mt-16" />
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="size-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 border border-green-500/20">
                <Check className="size-7" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Active Protections</h2>
            </div>
            <ul className="space-y-6 relative z-10" role="list">
              {doesItems.map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-lg font-medium text-muted-foreground leading-relaxed">
                  <div className="size-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Check className="size-3 text-green-600" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Strict Limitations */}
          <motion.div
            {...animationProps}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="glass-morphism border border-white/20 rounded-[2.5rem] p-10 md:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16" />
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="size-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 border border-red-500/20">
                <X className="size-7" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Hard Boundaries</h2>
            </div>
            <ul className="space-y-6 relative z-10" role="list">
              {doesNotItems.map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-lg font-medium text-muted-foreground leading-relaxed">
                  <div className="size-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-1">
                    <X className="size-3 text-red-600" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Technical Architecture Section */}
        <div className="mb-32">
          <motion.div
            {...animationProps}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 tracking-tight italic">Hybrid Neuro-Symbolic Safety</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We wrap advanced intelligence within an immutable set of deterministic clinical rules.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <motion.div {...animationProps} className="glass-morphism border border-white/10 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] transition-transform duration-300">
              <div className="size-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Shield className="size-8 text-blue-500" />
              </div>
              <h3 className="font-black text-xl mb-3 tracking-tight">1. Edge Sanitizer</h3>
              <p className="text-muted-foreground leading-relaxed">
                Before your text leaves your device, we screen for crisis keywords. If a medical emergency is detected, we block the request instantly.
              </p>
            </motion.div>
            {/* Card 2 */}
            <motion.div {...animationProps} transition={{ delay: 0.1 }} className="glass-morphism border border-white/10 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] transition-transform duration-300">
              <div className="size-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                <Zap className="size-8 text-amber-500" />
              </div>
              <h3 className="font-black text-xl mb-3 tracking-tight">2. Clinical Logic</h3>
              <p className="text-muted-foreground leading-relaxed">
                We check symptoms against a database of 500+ verified clinical patterns before any AI is consulted, ensuring zero-hallucination triage.
              </p>
            </motion.div>
            {/* Card 3 */}
            <motion.div {...animationProps} transition={{ delay: 0.2 }} className="glass-morphism border border-white/10 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] transition-transform duration-300">
              <div className="size-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Cpu className="size-8 text-purple-500" />
              </div>
              <h3 className="font-black text-xl mb-3 tracking-tight">3. Advanced Synthesis</h3>
              <p className="text-muted-foreground leading-relaxed">
                Advanced reasoning engines are strictly constrained to act as clinical summarizers, mapping nuanced inputs to highly structured protocol outputs.
              </p>
            </motion.div>
          </div>
        </div>


        {/* Privacy Promise */}
        <motion.div
          {...animationProps}
          className="glass-morphism border border-white/20 rounded-[3rem] p-12 md:p-24 text-center shadow-3xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 blur-3xl animate-pulse" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center size-20 bg-primary/10 rounded-3xl mb-10 shadow-inner">
              <Lock className="size-10 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-8 tracking-tighter">The Zero-Knowledge Promise</h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12 font-medium">
              We believe health data belongs to the patient. That's why Pluto is stateless.
              Once you close your session, data is scrubbed. We hold no permanent database of your medical conversations.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6">
              {["No Database Storage", "No Tracking Pixels", "No Data Monetization"].map((tag, i) => (
                <div key={i} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest text-muted-foreground">
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Final Disclaimer */}
        <div className="mt-24 text-center">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto font-medium opacity-50 uppercase tracking-widest">
            <strong>Educational Disclaimer:</strong> Pluto is an educational triage assistant, not a medical device or doctor. Always consult professional healthcare services for medical decisions.
          </p>
        </div>

      </div>
    </main>
  )
}
