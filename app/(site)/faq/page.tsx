import Link from "next/link"
import { ArrowLeft, HelpCircle, Shield, Brain, Lock, Trash2, AlertTriangle } from "lucide-react"

export default function FAQPage() {
    const faqs = [
        {
            icon: Brain,
            question: "How accurate is Pluto Health?",
            answer: "Pluto uses a multi-layer approach combining rule-based logic with L Llama 3.3 70B AI. While we strive for high accuracy, Pluto is designed for preliminary triage only—not diagnosis. Our conservative approach means we'll escalate to a healthcare provider when in doubt. Always consult a real doctor for medical decisions."
        },
        {
            icon: Shield,
            question: "Is my data private and secure?",
            answer: "Yes. Your health data is encrypted at rest in our PostgreSQL database. We scrub personally identifiable information (PII) before sending to AI models. We do NOT sell your data to insurers, pharmaceutical companies, or advertisers. You can delete your entire health vault at any time from the Dashboard."
        },
        {
            icon: AlertTriangle,
            question: "What if I disagree with the triage recommendation?",
            answer: "Trust your instincts! Pluto provides guidance, not commands. If you feel something is seriously wrong—even if Pluto says 'home care'—seek medical attention immediately. Our system is conservative but not perfect. When in doubt, call your doctor or 911."
        },
        {
            icon: Lock,
            question: "Do you train AI models on my conversations?",
            answer: "No. We do NOT use your personal health conversations to train models. Each session is processed in-memory and then encrypted for your records only. We may collect anonymous, aggregated statistics (e.g., '500 people reported headaches this week') but never with identifying information."
        },
        {
            icon: Trash2,
            question: "How do I delete my data?",
            answer: "Go to Dashboard → Settings → Delete Account. This will permanently remove ALL your health data, triage events, and account information from our systems. You can also export your clinical snapshots as PDF reports before deletion."
        },
        {
            icon: HelpCircle,
            question: "What's the difference between the 5 triage levels?",
            answer: (
                <div className="space-y-2">
                    <p><strong>Emergency:</strong> Call 911 immediately (chest pain, can't breathe, worst headache ever)</p>
                    <p><strong>Urgent:</strong> See a doctor today or go to urgent care (high fever, severe pain)</p>
                    <p><strong>Schedule Appointment:</strong> Book with your doctor this week (persistent symptoms)</p>
                    <p><strong>Monitor & Follow-up:</strong> Watch symptoms, see doctor if worsens (mild concerns)</p>
                    <p><strong>Home Care:</strong> Likely safe to manage at home (minor issues, improving symptoms)</p>
                </div>
            )
        },
        {
            icon: Brain,
            question: "Why does Pluto ask so many questions?",
            answer: "We're designed like a real doctor—methodical and thorough. Instead of jumping to conclusions, we ask clarifying questions to understand your full situation. This 'assessment table' approach helps us avoid false alarms while catching truly serious cases."
        },
        {
            icon: Shield,
            question: "Is Pluto HIPAA compliant?",
            answer: "Pluto is currently in Public Beta and is NOT a covered entity under HIPAA. However, we follow HIPAA-inspired best practices: encryption at rest and in transit, PII scrubbing, audit trails, and user consent requirements. For HIPAA-compliant care, consult licensed healthcare providers."
        }
    ]

    return (
        <main className="min-h-screen pt-24 pb-16 px-6 bg-background">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group"
                >
                    <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <HelpCircle className="size-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h1>
                    </div>
                    <p className="text-muted-foreground mb-12">
                        Everything you need to know about Pluto Health's clinical triage system.
                    </p>

                    <div className="space-y-8">
                        {faqs.map((faq, index) => {
                            const Icon = faq.icon
                            return (
                                <div key={index} className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Icon className="size-4" />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <h2 className="text-lg font-semibold text-foreground">{faq.question}</h2>
                                            <div className="text-muted-foreground leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                    {index < faqs.length - 1 && (
                                        <div className="h-px bg-border/40 mt-6" />
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-12 pt-8 border-t border-border/40">
                        <h3 className="text-lg font-semibold text-foreground mb-3">Still have questions?</h3>
                        <p className="text-muted-foreground">
                            Contact us at{" "}
                            <a href="mailto:support@plutohealth.ai" className="text-primary hover:underline">
                                support@plutohealth.ai
                            </a>
                            {" "}or check out our{" "}
                            <Link href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </Link>
                            {" "}and{" "}
                            <Link href="/terms" className="text-primary hover:underline">
                                Terms of Service
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}
