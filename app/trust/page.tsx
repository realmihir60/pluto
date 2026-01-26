"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, X, Shield, Lock, AlertTriangle, Cpu, Zap } from "lucide-react"

const doesItems = [
  "Layer 1: Instantly detects crisis keywords using local edge rules (Safe)",
  "Layer 2: Matches symptoms against verified clinical protocols (Deterministic)",
  "Layer 3: Uses Advanced Synthesis only for complex reasoning (Contextual)",
  "Processes data entirely in-memory without persistent storage",
  "Clearly communicates uncertainty sources (Core logic vs Intelligence)",
  "Recommends when to seek professional medical care",
]

const doesNotItems = [
  "Does NOT diagnose diseases or replace a doctor",
  "Does NOT store your conversation history after the session ends",
  "Does NOT sell or share health data with third parties",
  "Does NOT allow the engine to hallucinate on critical safety checks",
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
      initial: { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.5 },
    }

  return (
    <main className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
            <Shield className="size-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-6 text-balance tracking-tight">
            Safety by Design
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Pluto isn't just a chatbot. It's a <span className="text-foreground font-medium">multi-layered safety system</span> designed to prioritize accuracy and privacy over generative freedom.
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* What We Do */}
          <motion.div
            {...animationProps}
            className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-2xl p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 border border-green-200">
                <Check className="size-5" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">How Pluto Protects You</h2>
            </div>
            <ul className="space-y-4" role="list">
              {doesItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3.5 text-sm md:text-base text-muted-foreground">
                  <Check className="size-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* What We Don't Do */}
          <motion.div
            {...animationProps}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-2xl p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 border border-red-200">
                <X className="size-5" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Strict Limitations</h2>
            </div>
            <ul className="space-y-4" role="list">
              {doesNotItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3.5 text-sm md:text-base text-muted-foreground">
                  <X className="size-5 text-red-600/80 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Technical Architecture Section */}
        <div className="mb-20">
          <motion.div
            {...animationProps}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">Hybrid Neuro-Symbolic Safety</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We don't rely solely on probabilistic models. We use a "Sandwich" architecture to wrap advanced intelligence with deterministic safety rules.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div {...animationProps} className="p-6 bg-secondary/30 rounded-xl border border-border/50">
              <Shield className="size-8 text-blue-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2">1. Edge Sanitizer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Before your text leaves your device, we screen for crisis keywords. If a medical emergency is detected, we block the request instantly and direct you to emergency services.
              </p>
            </motion.div>
            {/* Card 2 */}
            <motion.div {...animationProps} transition={{ delay: 0.1 }} className="p-6 bg-secondary/30 rounded-xl border border-border/50">
              <Zap className="size-8 text-amber-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2">2. Clinical Logic</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We check your symptoms against a database of 500+ verified clinical patterns (e.g., CDC guidelines). This happens *before* any AI is consulted to ensure accuracy for common conditions.
              </p>
            </motion.div>
            {/* Card 3 */}
            <motion.div {...animationProps} transition={{ delay: 0.2 }} className="p-6 bg-secondary/30 rounded-xl border border-border/50">
              <Cpu className="size-8 text-purple-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2">3. Advanced Synthesis</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Only for nuanced cases do we activate the synthesis engine. The intelligence layer is strictly constrained to act as a "Medical Scribe," summarizing data into structured JSON without inventing diagnoses.
              </p>
            </motion.div>
          </div>
        </div>


        {/* Privacy Promise */}
        <motion.div
          {...animationProps}
          className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center"
        >
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
            <Lock className="size-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">The "Zero-Knowledge" Promise</h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
            We believe your health data is toxic assets for us to hold. That's why we designed Pluto to be stateless.
            Once you close the tab, your session data is wiped from our RAM. We have no database of user conversations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span className="px-3 py-1 bg-secondary rounded-full">No Database</span>
            <span className="px-3 py-1 bg-secondary rounded-full">No Tracking Pixels</span>
            <span className="px-3 py-1 bg-secondary rounded-full">No Health Sales</span>
          </div>
        </motion.div>

        {/* Final Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            <strong>Disclaimer:</strong> Pluto is an educational tool, not a medical device. It cannot perform a physical exam or lab tests. Always consult a qualified healthcare provider for medical decisions.
          </p>
        </div>

      </div>
    </main>
  )
}
