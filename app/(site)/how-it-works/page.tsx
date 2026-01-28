"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"
import { ShieldAlert, Zap, Cpu, Lock, Activity, ChevronRight } from "lucide-react"
import { PremiumBackground } from "@/components/ui/premium-background"

const steps = [
  {
    icon: ShieldAlert,
    title: "Doctor-Like Assessment",
    description:
      "Phase 1 system uses simple language translation and assessment tables—just like a family doctor would explain things. No medical jargon, no alarming terminology. Conservative questioning focused on safety.",
    details: [
      "Simple language map (e.g., 'dizzy' not 'vertigo')",
      "Assessment tables explain thinking process",
      "Conservative triage levels (defaults to 'seek care' when ambiguous)",
      "Focuses on 'what we know' vs 'what we need to check'",
    ],
    accent: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: Zap,
    title: "Production Safety Infrastructure",
    description:
      "Active rate limiting (50/hr auth, 10/hr anon), real-time performance logging, and user-friendly error handling. Every request is monitored, logged, and protected against abuse.",
    details: [
      "Rate limiter prevents API cost explosion",
      "Structured JSON logs track all triage events",
      "Error messages tailored by failure type (LLM, DB, timeout)",
      "Admin metrics API provides real-time statistics",
    ],
    accent: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    icon: Cpu,
    title: "Smart Fallback System",
    description:
      "Rule engine validates every AI response. If the LLM fails or times out, we gracefully fall back to deterministic clinical logic. You always get an answer—not an error screen.",
    details: [
      "Rule engine: 500+ validated clinical patterns",
      "LLM: Groq Llama 3.3 70B for complex reasoning",
      "Fallback logic ensures 100% uptime",
      "Emergency flagging (chest pain, stroke symptoms)",
    ],
    accent: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    icon: Lock,
    title: "Privacy & Feedback Loop",
    description:
      "PII sanitization before AI processing, encrypted storage (AES-256), and user feedback buttons after every triage. Rate the system, leave comments, help us improve continuously.",
    details: [
      "Encrypted Postgres storage (Prisma)",
      "TriageFeedback model tracks user ratings",
      "Gmail SMTP for secure email verification",
      "You own your data - delete anytime via dashboard",
    ],
    accent: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
]

function StepCard({
  step,
  index,
  prefersReducedMotion,
}: {
  step: (typeof steps)[0]
  index: number
  prefersReducedMotion: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const Icon = step.icon

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? {} : { opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
      animate={
        prefersReducedMotion
          ? {}
          : isInView
            ? { opacity: 1, x: 0 }
            : { opacity: 0, x: index % 2 === 0 ? -40 : 40 }
      }
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="glass-morphism border border-white/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-32 h-32 ${step.bg} blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150`} />

        <div className="flex flex-col md:flex-row gap-8 md:gap-12 relative z-10">
          {/* Icon & Label */}
          <div className="shrink-0">
            <div className={`size-20 rounded-3xl ${step.bg} flex items-center justify-center shadow-inner`}>
              <Icon className={`size-10 ${step.accent}`} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-black uppercase tracking-[0.2em] ${step.accent}`}>
                Intelligence Layer {index + 1}
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground mb-6">
              {step.title}
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">{step.description}</p>

            {/* Details */}
            <div className="grid sm:grid-cols-2 gap-4">
              {step.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <ChevronRight className={`size-4 mt-0.5 shrink-0 ${step.accent}`} />
                  <span className="text-sm font-medium text-muted-foreground">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function HowItWorksPage() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return (
    <main className="min-h-screen pt-32 pb-32 px-6 relative overflow-hidden">
      <PremiumBackground />

      <div className="max-w-6xl mx-auto relative cursor-default">
        {/* Page Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-8">
            <Activity className="size-4" />
            Methodology
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-8 tracking-tighter">
            Clinical <span className="text-primary italic">Precision</span> Engineering.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            Pluto uses a multi-layered <span className="text-foreground">Neuro-Symbolic Architecture</span> to bridge the gap between deterministic safety and advanced synthesis.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => (
            <StepCard
              key={step.title}
              step={step}
              index={index}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>

        {/* Closing Note */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-24 text-center"
        >
          <div className="glass-morphism border border-white/20 rounded-[2.5rem] p-12 md:p-16 max-w-4xl mx-auto shadow-2xl">
            <h2 className="text-3xl font-black text-foreground mb-6 tracking-tight">The Hybrid Philosophy</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Pure intelligence engines are prone to hallucination. Pure rule engines are brittle.
              By wrapping <strong>clinical logic</strong> within a <strong>deterministic safety shell</strong>,
              we've created the world's most stable triage environment.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
