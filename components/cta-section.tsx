"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"

export function CTASection() {
    return (
        <section className="py-40 bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="relative p-8 md:p-20 rounded-[3rem] overflow-hidden">
                    {/* Background Layer */}
                    <div className="absolute inset-0 primary-gradient -z-10" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-bold mb-10 backdrop-blur-md">
                            <Zap className="size-4 fill-white" />
                            AVAILABLE FOR PUBLIC PREVIEW
                        </div>

                        <h2 className="text-4xl md:text-7xl font-bold text-white mb-8 tracking-tight">
                            Ready for clinical <br /><span className="opacity-80 font-serif italic">certainty?</span>
                        </h2>

                        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Join thousands who trust Pluto for professional-grade clinical insights and absolute health privacy.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Button
                                asChild
                                size="lg"
                                className="h-16 px-12 text-xl font-bold rounded-2xl bg-white text-primary hover:bg-white/90 hover:-translate-y-1 transition-all duration-300 shadow-2xl shadow-black/20"
                            >
                                <Link href="/demo" className="inline-flex items-center gap-3">
                                    Start Free Checkup
                                    <ArrowRight className="size-6" />
                                </Link>
                            </Button>
                        </div>

                        <div className="mt-12 flex items-center justify-center gap-10 opacity-60">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">No Card Required</span>
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">HIPAA Aligned</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
