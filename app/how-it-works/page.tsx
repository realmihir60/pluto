"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"
import { ShieldAlert, Zap, Cpu, Lock } from "lucide-react"

const steps = [
  {
    icon: ShieldAlert,
    title: "1. Zero-Latency Guardrails",
    description:
      "Before any analysis happens, your input passes through a local edge sanitizer. This is a rule-based layer designed to instantly detect crisis keywords.",
    details: [
      "Detects emergency terms (e.g., 'crushing chest pain')",
      "Blocks harmful or non-medical queries immediately",
      "Runs on-device or at the edge for <10ms latency",
      "Prioritizes safety over analysis",
    ],
  },
  {
    icon: Zap,
    title: "2. Deterministic Pattern Matching",
    description:
      "If safety checks pass, Pluto attempts to map your symptoms against a local clinical ruleset first. This ensures common conditions are identified without hallucination risks.",
    details: [
      "Matches input against 500+ verified clinical patterns",
      "Uses Boolean logic (IF fever AND stiff neck THEN...)",
      "Zero AI variance - ensures consistent output for known inputs",
      "Acts as a fast-path for standard triage cases",
    ],
  },
  {
    icon: Cpu,
    title: "3. Large Language Model Reasoning",
    description:
      "For complex or ambiguous cases, Pluto consults Llama 3 (70B) via Groq's LPU™ Inference Engine. This provides deep clinical synthesis and context-aware advice.",
    details: [
      "Model: Llama 3 70B (Versatile)",
      "Role: Clinical synthesis & empathetic reasoning",
      "Context Window: Analyzes full conversation history",
      "Output: Structured JSON (Severity, Patterns, Advice)",
    ],
  },
  {
    icon: Lock,
    title: "4. Ephemeral Processing",
    description:
      "The entire pipeline is stateless. Once the analysis is delivered to your browser, the data is discarded from our inference servers.",
    details: [
      "No database storage of symptom text",
      "No user profiles or persistent history",
      "HIPAA-compliant processing standards",
      "You own your data - it disappears when you close the tab",
    ],
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
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 40 }}
      animate={
        prefersReducedMotion
          ? {}
          : isInView
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 40 }
      }
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative"
    >
      {/* Connection line */}
      {index < steps.length - 1 && (
        <div className="absolute left-8 top-24 bottom-0 w-px bg-border hidden md:block" />
      )}

      <div className="bg-card border border-border rounded-xl p-6 md:p-8">
        <div className="flex items-start gap-4 md:gap-6">
          {/* Step number and icon */}
          <div className="shrink-0">
            <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="size-7 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                Layer {index + 1}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              {step.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{step.description}</p>

            {/* Visual diagram (div-based) */}
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <ul className="space-y-2" role="list">
                {step.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
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
    <main className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-16"
        >
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 text-balance">
            Under the Hood
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Pluto uses a <span className="text-foreground font-medium">Hybrid Neuro-Symbolic Architecture</span>.
            We combine rock-solid clinical rules with state-of-the-art AI reasoning.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-8">
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
          transition={{ duration: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="bg-secondary/50 border border-border rounded-xl p-6 md:p-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Why this architecture?</h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Pure AI can hallucinate. Pure rules are too rigid. By combining
              <strong> Deterministic Safety</strong> with <strong>Probabilistic Reasoning</strong>,
              we achieve the best of both worlds: Safety and Intelligence.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
