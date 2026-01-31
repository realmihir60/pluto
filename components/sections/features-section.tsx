"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ShieldAlert, Zap, Cpu, Lock, Activity, Globe, CheckCircle2 } from "lucide-react"

const features = [
    {
        icon: ShieldAlert,
        title: "Safety-Critical Overrides",
        description: "6 hard safety rules for high-risk populations (infants, elderly, TIA). These fire BEFORE symptom matching and cannot be bypassed—ensuring 0% under-triage of dangerous conditions.",
        color: "text-red-500",
        bg: "bg-red-500/10"
    },
    {
        icon: Zap,
        title: "87.5% Validated Accuracy",
        description: "Stress-tested against 54 clinical scenarios including deceptive presentations. 100% detection rate for emergencies (MI, Stroke, SAH) and atypical patterns.",
        color: "text-amber-500",
        bg: "bg-amber-500/10"
    },
    {
        icon: Cpu,
        title: "3-Stage Clinical Reasoning",
        description: "Protocol matching → Criteria matrix → Urgency computation. 20+ protocols, 90+ red flags, 40+ green flags tracked per symptom for comprehensive assessment.",
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
    {
        icon: Lock,
        title: "Privacy First",
        description: "PII sanitization before processing, encrypted storage, and zero-knowledge architecture. Your health data is protected by AES-256 encryption at rest and in transit.",
        color: "text-green-500",
        bg: "bg-green-500/10"
    },
    {
        icon: Activity,
        title: "Anti-Hallucination Engine",
        description: "Every response shows 'What We Know' vs 'What We Don't' with explicit uncertainty markers. No made-up diagnoses—only evidence-based clinical reasoning.",
        color: "text-primary",
        bg: "bg-primary/10"
    },
    {
        icon: Globe,
        title: "Real-Time Observability",
        description: "Structured JSON logging, admin dashboard with triage metrics, and feedback loop for continuous improvement. Full visibility into every clinical decision.",
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
    },
]

export function FeaturesSection() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        setPrefersReducedMotion(mediaQuery.matches)

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
        mediaQuery.addEventListener("change", handler)
        return () => mediaQuery.removeEventListener("change", handler)
    }, [])

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1] as const
            }
        }
    }

    return (
        <section className="py-40 relative overflow-hidden bg-background">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-24">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm mb-6"
                        >
                            <span className="w-10 h-[2px] bg-primary" />
                            Clinical Excellence
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-bold tracking-tight mb-8"
                        >
                            Why medical teams and patients <span className="text-primary italic">choose Pluto.</span>
                        </motion.h2>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground max-w-md leading-relaxed"
                    >
                        We've engineered a health engine that prioritizes medical consensus over generative creativity, ensuring safety at every click.
                    </motion.p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {features.map((feature, i) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={i}
                                variants={item}
                                className="group relative p-8 rounded-3xl glass border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
                            >
                                <div className={`size-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                    <Icon className={`size-7 ${feature.color}`} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 group-hover:text-primary transition-colors">
                                    {feature.title}
                                    <CheckCircle2 className="size-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                </h3>
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    {feature.description}
                                </p>

                                {/* Decorative corner accent */}
                                <div className="absolute bottom-0 right-0 w-12 h-12 bg-linear-to-br from-transparent to-primary/5 rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}
