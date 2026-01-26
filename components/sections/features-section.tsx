"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ShieldAlert, Zap, Cpu, Lock, Activity, Globe, CheckCircle2 } from "lucide-react"

const features = [
    {
        icon: ShieldAlert,
        title: "Instant Triage",
        description: "Our edge-layer instantly flags medical emergencies. If your symptoms match critical patterns (like stroke or heart attack), we direct you to 911 immediately.",
        color: "text-red-500",
        bg: "bg-red-500/10"
    },
    {
        icon: Zap,
        title: "Local Speed",
        description: "Common symptoms are checked against 500+ clinical rules directly on the server. No waiting for complex generation unless necessary.",
        color: "text-amber-500",
        bg: "bg-amber-500/10"
    },
    {
        icon: Cpu,
        title: "Advanced Synthesis",
        description: "For complex or rare cases, we call upon our higher-parameter reasoning engine to synthesize clinical patterns and offer context-aware insights.",
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        icon: Lock,
        title: "Secure Memory",
        description: "Your health history is encrypted in your personal vault. Our engine securely retains your conditions, so you don't have to repeat yourself.",
        color: "text-green-500",
        bg: "bg-green-500/10"
    },
    {
        icon: Activity,
        title: "Clinical Accuracy",
        description: "Built on guidelines from the CDC, WHO, and peer-reviewed literature. We prioritize medical consensus over generative creativity.",
        color: "text-primary",
        bg: "bg-primary/10"
    },
    {
        icon: Globe,
        title: "Global Accessibility",
        description: "Designed for clarity. Whether you're a medical student or a worried parent, Pluto translates complex medical jargon into plain English.",
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
