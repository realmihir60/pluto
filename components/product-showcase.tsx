"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Activity, Search, Thermometer, Clock, ArrowRight } from "lucide-react"

export function ProductShowcase() {
    return (
        <section className="py-40 relative overflow-hidden bg-background">
            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    {/* Text Side */}
                    <div className="flex-1 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm"
                        >
                            <span className="w-10 h-[2px] bg-primary" />
                            Clinical Tooling
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-bold tracking-tight mb-8"
                        >
                            A hospital-grade <br /><span className="text-primary italic">engine in your hand.</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-muted-foreground leading-relaxed"
                        >
                            We've compressed 50,000+ medical reasoning parameters into a high-fidelity interface that works in real-time, anywhere in the world.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="grid sm:grid-cols-2 gap-8 pt-8"
                        >
                            <div className="space-y-3">
                                <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                    <Thermometer className="size-5 text-primary" />
                                </div>
                                <h4 className="font-bold text-lg">Vital Patterns</h4>
                                <p className="text-muted-foreground">Recognizes common viral, bacterial, and non-emergent patterns with 99% precision.</p>
                            </div>
                            <div className="space-y-3">
                                <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                    <Clock className="size-5 text-primary" />
                                </div>
                                <h4 className="font-bold text-lg">Instant Logic</h4>
                                <p className="text-muted-foreground">Deterministic rule engines return safety analysis in less than 400ms.</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Device Side */}
                    <div className="flex-1 relative">
                        {/* Glow effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 rounded-full blur-[100px] -z-10" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="relative mx-auto max-w-[320px] shadow-2xl"
                        >
                            {/* Phone Mockup Frame */}
                            <div className="p-4 bg-muted border-[8px] border-border rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/20">
                                <div className="bg-background h-[600px] rounded-[2rem] overflow-hidden flex flex-col relative">
                                    {/* Mini Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-border rounded-b-xl z-20 flex items-center justify-center">
                                        <div className="size-1 rounded-full bg-white/20" />
                                    </div>

                                    {/* Mock App Interface */}
                                    <div className="flex-1 p-6 pt-12 space-y-6 flex flex-col">
                                        {/* App Header */}
                                        <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 bg-primary rounded-lg flex items-center justify-center">
                                                    <Activity className="size-3 text-primary-foreground" />
                                                </div>
                                                <span className="font-black text-xs tracking-tighter uppercase">PLUTO</span>
                                            </div>
                                            <div className="size-6 bg-secondary rounded-full flex items-center justify-center">
                                                <div className="size-1 rounded-full bg-green-500" />
                                            </div>
                                        </div>

                                        {/* Symptom Card Mockup */}
                                        <div className="flex-1 overflow-hidden space-y-6">
                                            <div className="p-4 glass border-primary/20 rounded-2xl space-y-3">
                                                <h5 className="text-[10px] font-black text-primary tracking-widest uppercase">Patient State</h5>
                                                <p className="text-sm font-bold">Fever: 101.2°F</p>
                                                <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: "70%" }}
                                                        transition={{ duration: 2, delay: 1 }}
                                                        className="h-full bg-primary"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="h-4 w-3/4 bg-muted rounded-full" />
                                                <div className="h-4 w-1/2 bg-muted rounded-full" />
                                            </div>

                                            <div className="pt-8 flex flex-col items-center text-center space-y-4">
                                                <motion.div
                                                    animate={{ scale: [1, 1.1, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                                                >
                                                    <ShieldCheck className="size-8" />
                                                </motion.div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scanning Environment</p>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="pt-4">
                                            <div className="h-12 w-full primary-gradient rounded-xl flex items-center justify-center text-white text-xs font-black tracking-widest uppercase">
                                                Run Clinical Audit
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Card Over Mockup */}
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="absolute -right-12 top-1/3 glass p-5 rounded-2xl shadow-2xl border-white/20 w-48 hidden md:block"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="size-4 text-primary" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Latency</span>
                                </div>
                                <p className="text-xl font-black text-primary tracking-tighter">384ms</p>
                                <p className="text-[10px] text-muted-foreground">Local Edge Inference</p>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    )
}
