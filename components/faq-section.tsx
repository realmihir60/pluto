"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, HelpCircle } from "lucide-react"

const faqs = [
    {
        question: "Is Pluto a replacement for a doctor?",
        answer: "No. Pluto is an educational tool designed to help you understand symptoms. It cannot provide a medical diagnosis, perform exams, or prescribe medication. Always consult a healthcare professional for medical decisions."
    },
    {
        question: "How does the 'Zero-Knowledge' privacy work?",
        answer: "We designed Pluto to be stateless. Your health data is processed in-memory (RAM) and is never written to a database. Once you close the tab or refresh, your conversation history ceases to exist on our servers."
    },
    {
        question: "What medical guidelines do you use?",
        answer: "Our rule-based engine correlates symptoms against established protocols from the CDC, WHO, and peer-reviewed clinical decision support guidelines, ensuring our baseline triage is deterministic and clinically grounded."
    },
    {
        question: "Why do you use Clinical Intelligence?",
        answer: "Classic rule-based systems can be rigid. We use our proprietary Intelligence layer as a 'semantic translation' bridge to understand how *you* describe symptoms in natural language, and to synthesize complex, multi-symptom patterns that simple rules might miss."
    },
    {
        question: "Is it free?",
        answer: "Yes, the Checkup demo is currently free to use as a public preview of our technology."
    }
]

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className="py-32 bg-background relative">
            <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center justify-center p-3 bg-secondary rounded-full mb-6">
                        <HelpCircle className="size-6 text-muted-foreground" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                        Common Questions
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-xl mx-auto">
                        Everything you need to know about the science and safety behind Pluto.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className={`border rounded-2xl bg-card transition-all duration-300 ${openIndex === i ? 'border-primary/50 shadow-md' : 'border-border/60 hover:border-border'}`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="flex items-center justify-between w-full p-6 text-left focus:outline-none"
                            >
                                <span className={`font-medium pr-8 transition-colors ${openIndex === i ? 'text-primary' : 'text-foreground'}`}>
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`size-5 text-muted-foreground transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-primary' : ''}`}
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-6 text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
