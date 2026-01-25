"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ShieldAlert, Zap, Cpu, Lock, Activity, Globe } from "lucide-react"

const features = [
    {
        icon: ShieldAlert,
        title: "Instant Triage",
        description: "Our edge-layer instantly flags medical emergencies. If your symptoms match critical patterns (like stroke or heart attack), we direct you to 911 immediately.",
    },
    {
        icon: Zap,
        title: "Local Speed",
        description: "Common symptoms are checked against 500+ clinical rules directly on the server. No waiting for AI generation unless necessary.",
    },
    {
        icon: Cpu,
        title: "Neuro-Symbolic AI",
        description: "For complex or rare cases, we call upon Llama 3 70B (via Groq) to synthesize clinical patterns and offer context-aware insights.",
    },
    {
        icon: Lock,
        title: "Zero-Knowledge",
        description: "Your health data is radioactive to us. We don't store it. Once you close the tab, your session is wiped from our memory forever.",
    },
    {
        icon: Activity,
        title: "Clinical Accuracy",
        description: "Built on guidelines from the CDC, WHO, and peer-reviewed literature. We prioritize medical consensus over generative creativity.",
    },
    {
        icon: Globe,
        title: "Accessible to All",
        description: "Designed for clarity. Whether you're a medical student or a worried parent, Pluto translates complex medical jargon into plain English.",
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

    return (
        <section className="py-32 bg-secondary/30 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]">
                <svg width="100%" height="100%">
                    <pattern id="feature-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#feature-grid)" />
                </svg>
            </div>

            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                        Why trust Pluto?
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        We built the health checker we wanted for our own families: <br className="hidden md:block" />
                        <span className="text-foreground font-medium">Private, fast, and relentlessly accurate.</span>
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={i}
                                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="group bg-card/50 backdrop-blur-sm border border-border/60 p-8 rounded-2xl hover:border-primary/20 hover:bg-card/80 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                <div className="size-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Icon className="size-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
