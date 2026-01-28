"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"
import { ShieldAlert, Zap, Cpu, Lock, Activity, ChevronRight } from "lucide-react"
import { PremiumBackground } from "@/components/ui/premium-background"

const steps = [
  {
    icon: ShieldAlert,
    title: "Zero-Latency Guardrails",
    description:
      "Before any analysis happens, your input passes through a local edge sanitizer. This is a rule-based layer designed to instantly detect crisis keywords.",
    details: [
      "Detects emergency terms (e.g., 'crushing chest pain')",
      "Blocks harmful or non-medical queries immediately",
      "Runs on-device or at the edge for <10ms latency",
      "Prioritizes safety over analysis",
    ],
    accent: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: Zap,
    title: "Deterministic Pattern Matching",
    description:
      "If safety checks pass, Pluto attempts to map your symptoms against a local clinical ruleset first. This ensures common conditions are identified without hallucination risks.",
    details: [
      "Matches input against 500+ verified clinical patterns",
      "Uses Boolean logic (IF fever AND stiff neck THEN...)",
      "Zero AI variance - ensures consistent output for known inputs",
      "Acts as a fast-path for standard triage cases",
    ],
    accent: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    icon: Cpu,
    title: "Advanced Clinical Synthesis",
    description:
      "For complex or ambiguous cases, Pluto activates its advanced synthesis layer for multi-factor clinical reasoning. This provides deep diagnostic correlations and context-aware advice.",
    details: [
      "Engine: Pluto Clinical Synthesis (High-Parameter)",
      "Role: Clinical synthesis & empathetic reasoning",
      "Context Window: Analyzes full conversation history",
      "Output: Structured JSON (Severity, Patterns, Advice)",
    ],
    accent: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    icon: Lock,
    title: "Secure Memory Injection",
    description:
      "Instead of discarding data, we now securely retrieve your past medical facts (e.g. allergies, conditions) and inject them into the intelligence layer's context window for personalized safety.",
    details: [
      "Encrypted Postgres Storage (Prisma)",
      "Proactive Context Awareness",
      "Facts are extracted automatically after triage",
      "You own your data - delete it anytime via Dashboard",
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
