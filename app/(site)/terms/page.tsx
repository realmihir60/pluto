import Link from "next/link"
import { ArrowLeft, FileText, AlertCircle } from "lucide-react"

export default function TermsPage() {
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
                    <div className="flex items-center gap-4 mb-4">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="size-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground mb-8">Effective Date: January 26, 2026</p>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">

                        <section className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <AlertCircle className="size-5" />
                                <h2 className="text-lg font-bold m-0 italic">1. Not Medical Advice ⚠️</h2>
                            </div>
                            <p className="m-0 font-medium">
                                Pluto Health is a <strong>clinical triage and information tool</strong>, not a medical provider.
                                Our engine is for <strong>educational and preliminary triage support only</strong>.
                                Always seek professional medical advice for health concerns.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-bold text-foreground">2. Emergency Use</h2>
                            <p className="font-bold text-foreground">
                                Do NOT use Pluto Health in a medical emergency.
                                If you are experiencing a life-threatening crisis, call 911 or your local emergency services immediately.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-bold text-foreground">3. Public Beta Status</h2>
                            <p>
                                This platform is in <strong>Public Beta</strong>. While we strive for absolute accuracy,
                                the system may occasionally produce errors. You use this service at your own risk.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-bold text-foreground">4. User Consent</h2>
                            <p>
                                By using the "Analyze" feature, you consent to our processing of your symptoms against
                                our clinical intelligence layers as described in our Privacy Policy.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-bold text-foreground">5. Limitation of Liability</h2>
                            <p>
                                Pluto Health and its creators shall not be liable for any medical outcomes
                                or decisions made based on the information provided by the platform.
                            </p>
                        </section>

                        <div className="pt-8 border-t border-border/40 text-center">
                            <p className="text-xs">Your continued use of the platform constitutes agreement to these terms.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
