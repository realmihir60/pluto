"use client"

import { motion } from "framer-motion"
import { Search, Brain, ShieldCheck, ArrowRight } from "lucide-react"

const steps = [
    {
        icon: Search,
        title: "Ingress & Sanitization",
        description: "Your input is immediately scrubbed of PII (Personally Identifiable Information) using adversarial regex and multi-pass filtering.",
    },
    {
        icon: Brain,
        title: "Deterministic Analysis",
        description: "Symptoms are checked against a hardened rule engine of 500+ clinical protocols before being synthesized by our clinical brain.",
    },
    {
        icon: ShieldCheck,
        title: "High-Fidelity Guidance",
        description: "Receive a professional-grade triage snapshot with clear escalation levels, confidence scores, and evidence-based next steps.",
    },
]

export function HowItWorksSection() {
    return (
        <section className="py-40 bg-background relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-primary/[0.01] -z-10" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-32">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-primary font-bold tracking-widest uppercase text-sm mb-6"
                        >
                            The Methodology
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-bold tracking-tight mb-8"
                        >
                            Hardened clinical logic, <br /><span className="text-muted-foreground font-serif italic">uncompromised privacy.</span>
                        </motion.h2>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground max-w-md leading-relaxed"
                    >
                        Pluto uses a Hybrid Micro-service architecture to ensure every assessment is fast, private, and medically grounded.
                    </motion.p>
                </div>

                <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute top-1/2 left-0 w-full h-px bg-border/50 hidden lg:block -translate-y-1/2" />

                    <div className="grid lg:grid-cols-3 gap-12 relative z-10">
                        {steps.map((step, i) => {
                            const Icon = step.icon
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="group relative flex flex-col items-center text-center lg:items-start lg:text-left"
                                >
                                    {/* Step Number Circle */}
                                    <div className="size-20 rounded-3xl glass-morphism border border-primary/20 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-500 shadow-xl shadow-primary/5">
                                        <Icon className="size-10 text-primary" />

                                        {/* Floating Badge */}
                                        <div className="absolute -top-3 -right-3 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black shadow-lg">
                                            {i + 1}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold mb-5 group-hover:text-primary transition-colors">{step.title}</h3>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>

                                    {/* Arrow for mobile/tablet */}
                                    {i < steps.length - 1 && (
                                        <div className="lg:hidden mt-12 mb-4">
                                            <ArrowRight className="size-8 text-border rotate-90" />
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}
