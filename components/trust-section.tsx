"use client"

import { motion } from "framer-motion"
import { Lock, Shield, CheckCircle2, Award, FileText, Database } from "lucide-react"

const trustItems = [
    {
        icon: Lock,
        title: "Zero-Knowledge Security",
        description: "Your health data is encrypted end-to-end. We don't just protect your data; we ensure even we cannot access it without your explicit session keys.",
    },
    {
        icon: Shield,
        title: "Hardened HIPAA Architecture",
        description: "Engineered from the ground up to exceed HIPAA standards, Pluto implements multi-layer sanitization and audit trails for every triage event.",
    },
    {
        icon: CheckCircle2,
        title: "Evidence-Based Protocols",
        description: "Every clinical rule is mapped to primary medical literature, including CDC, Mayo Clinic, and WHO diagnostic consensus guidelines.",
    },
]

const validations = [
    { icon: Award, label: "CLINICAL GRADE" },
    { icon: FileText, label: "GDPR COMPLIANT" },
    { icon: Database, label: "SOC2 TYPE II" },
]

export function TrustSection() {
    return (
        <section className="py-40 bg-secondary/10 relative overflow-hidden">
            {/* Background Grain */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-bold text-primary mb-6 uppercase tracking-widest"
                    >
                        Security & Rigor
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tight"
                    >
                        Clinically verified. <br /><span className="text-primary italic font-serif">Deeply secure.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                    >
                        We treat your medical data with the same level of care and precision that a professional clinical environment demands.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-10 mb-24">
                    {trustItems.map((item, i) => {
                        const Icon = item.icon
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                className="group bg-card/60 backdrop-blur-md border border-border/40 p-10 rounded-[2.5rem] shadow-xl shadow-primary/5 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
                            >
                                <div className="size-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                                    <Icon className="size-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-5 group-hover:text-primary transition-colors">{item.title}</h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    {item.description}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Validation Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="pt-16 border-t border-border/50 flex flex-wrap items-center justify-center gap-12 md:gap-24"
                >
                    {validations.map((v, i) => {
                        const VIcon = v.icon
                        return (
                            <div key={i} className="flex items-center gap-3 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                <VIcon className="size-6 text-primary" />
                                <span className="font-black text-sm tracking-[0.2em]">{v.label}</span>
                            </div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}
