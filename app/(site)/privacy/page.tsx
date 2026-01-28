import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"

export default function PrivacyPage() {
    return (
        <main className="min-h-screen pt-24 pb-16 px-6 bg-background">
            <div className="max-w-3xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group"
                >
                    <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Shield className="size-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
                        <section>
                            <p className="font-semibold text-foreground">Last Updated: January 26, 2026</p>
                            <p>
                                Pluto Health ("we," "us," or "our") is committed to protecting your health-related information.
                                This policy explains how we collect, use, and safeguard your data during the Public Beta.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-bold text-foreground">1. Information Collection</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Clinical Data</strong>: When you interact with the Pluto Engine, we process your symptoms and health history to provide triage.</li>
                                <li><strong>Identity</strong>: We store your name and email only for account management and clinical persistence in your Vault.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-bold text-foreground">2. Data Security & Storage</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Encryption</strong>: All data is encrypted at rest using industry-standard protocols.</li>
                                <li><strong>Stateless AI</strong>: We do not use your personal conversations to train our models. Each session is ephemeral and processed in-memory.</li>
                                <li><strong>Anonymization</strong>: PII (Personally Identifiable Information) is scrubbed before processing in our secondary reasoning layers.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-bold text-foreground">3. Your Rights</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Deletion</strong>: You can delete your entire clinical vault and account at any time via the Dashboard.</li>
                                <li><strong>Export</strong>: You can export your clinical snapshots as PDF reports for your own records.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-bold text-foreground">4. Third-Party Services</h2>
                            <p>
                                We use trusted providers (Vercel, Groq, PostgreSQL) to power our infrastructure.
                                We do not sell your data to medical insurers, pharmaceutical companies, or advertisers.
                            </p>
                        </section>

                        <div className="pt-8 border-t border-border/40">
                            <p className="text-sm"><strong>Contact</strong>: privacy@plutohealth.ai</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
