"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, HelpCircle, MessageSquare } from "lucide-react"

const faqs = [
    {
        question: "Is Pluto a replacement for professional medical advice?",
        answer: "Absolutely not. Pluto is a clinical decision support utility designed for triage education. It does not diagnose, prescribe, or provide treatment plans. Always consult a qualified provider for medical concerns."
    },
    {
        question: "How does the 'Zero-Knowledge' architecture work?",
        answer: "We utilize stateless processing. Your symptoms are analyzed in volatile memory and never persisted to a permanent database. Once your session ends, the clinical snapshot is purged from our systems."
    },
    {
        question: "What is the source of your clinical intelligence?",
        answer: "Our engine uses a multi-layered verification process. It first checks symbolic clinical rules derived from the CDC, WHO, and peer-reviewed journals before using our advanced reasoning model for semantic synthesis."
    },
    {
        question: "How accurate is the symptom analysis?",
        answer: "Our deterministic rule engine has a focus on safety first. If there's any ambiguity or risk of a critical event (like cardiac or stroke), the system is hard-coded to escalate immediately to emergency services."
    },
    {
        question: "Can I use Pluto for my family?",
        answer: "Yes. Pluto is designed to be accessible for everyone, from medical professionals to parents. It translates complex medical terminology into clear, actionable clinical guidance."
    }
]

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className="py-40 bg-background relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center justify-center p-3 bg-primary/5 rounded-2xl mb-8"
                    >
                        <MessageSquare className="size-6 text-primary" />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tight"
                    >
                        Questions & <span className="text-primary italic font-serif">Insights</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                    >
                        The science and safety behind the world's most advanced triage engine.
                    </motion.p>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`rounded-3xl glass border transition-all duration-500 ${openIndex === i ? 'border-primary/40 shadow-2xl shadow-primary/5 ring-1 ring-primary/20' : 'border-border/60 hover:border-primary/20'}`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="flex items-center justify-between w-full p-8 text-left focus:outline-none"
                            >
                                <span className={`text-xl font-bold pr-8 transition-colors ${openIndex === i ? 'text-primary' : 'text-foreground'}`}>
                                    {faq.question}
                                </span>
                                <div className={`size-10 rounded-xl flex items-center justify-center transition-all duration-300 ${openIndex === i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground group-hover:bg-primary/10'}`}>
                                    <ChevronDown
                                        className={`size-5 transition-transform duration-500 ${openIndex === i ? 'rotate-180' : ''}`}
                                    />
                                </div>
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <div className="px-8 pb-8 text-lg text-muted-foreground leading-relaxed pt-2">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
