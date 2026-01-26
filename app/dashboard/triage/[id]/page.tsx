"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    ArrowLeft,
    Cpu,
    FileDown,
    AlertTriangle,
    Search,
    Sparkles,
    ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateMedicalReport } from "@/lib/report-generator"
import { useSession } from "next-auth/react"

interface AnalysisResult {
    summary?: string
    patterns: { name: string; prevalence: string }[]
    severity: { level: string; advice: string[] }
    confidence: { level: string; note: string }
    urgency_summary?: string
    key_findings?: string[]
    differential_diagnosis?: { condition: string; likelihood: string; rationale: string }[]
    suggested_focus?: string[]
    follow_up_questions?: string[]
}

export default function TriageDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { data: session, status } = useSession()

    const [event, setEvent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
            return
        }

        if (status === "authenticated" && id) {
            fetch(`/api/triage/${id}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch triage event")
                    return res.json()
                })
                .then(data => {
                    setEvent(data)
                    setLoading(false)
                })
                .catch(err => {
                    setError(err.message)
                    setLoading(false)
                })
        }
    }, [id, status, router])

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
                <p className="text-muted-foreground mb-8">We couldn't find the triage event you're looking for.</p>
                <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
            </div>
        )
    }

    const result = event.aiResult as AnalysisResult
    const symptoms = event.symptoms

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 focus:outline-none"
                >
                    <ArrowLeft className="size-4" />
                    Back to Dashboard
                </button>

                {/* Report Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            Clinical Report
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Case ID: {id?.toString().slice(0, 8)} • {new Date(event.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl flex items-center gap-2"
                            onClick={() => generateMedicalReport(symptoms, result, id as string, new Date(event.createdAt).getTime())}
                        >
                            <FileDown className="size-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
                >
                    {/* Diagnostic Summary Header */}
                    <div className="bg-secondary/30 border-b border-border px-4 py-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Cpu className="size-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-foreground font-semibold text-base">Clinical Assessment</h2>
                                <p className="text-xs text-muted-foreground">
                                    AI-Generated • Neuro-Symbolic Triage
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap
                            ${event.urgency === 'High'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                {event.urgency === 'High' ? 'URGENT CARE' : 'ROUTINE CARE'}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Section: Raw Symptom Log */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Presenting Symptoms</h3>
                            <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
                                <p className="text-sm text-foreground/90 leading-relaxed italic">
                                    "{symptoms}"
                                </p>
                            </div>
                        </div>

                        {/* Section: Urgency Rationale */}
                        {result.urgency_summary && (
                            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                                <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <AlertTriangle className="size-3" />
                                    Clinical Urgency Rationale
                                </h3>
                                <p className="text-sm text-foreground font-medium break-words">{result.urgency_summary}</p>
                            </div>
                        )}

                        {/* Section: Key Findings */}
                        {result.key_findings && result.key_findings.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Search className="size-4 text-primary" />
                                    Key Clinical Findings
                                </h3>
                                <div className="grid gap-3">
                                    {result.key_findings.map((finding, i) => (
                                        <div key={i} className="flex gap-3 text-sm text-foreground/80">
                                            <div className="shrink-0 mt-1 size-1.5 rounded-full bg-primary" />
                                            <p className="break-words">{finding}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Section: Differential Diagnosis */}
                        {result.differential_diagnosis && result.differential_diagnosis.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Differential Diagnosis</h3>
                                <div className="grid gap-4">
                                    {result.differential_diagnosis.map((d, i) => (
                                        <div key={i} className="bg-secondary/10 rounded-xl border border-border/60 p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-foreground">{d.condition}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${d.likelihood === 'High' ? 'bg-red-100 text-red-700' :
                                                        d.likelihood === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>
                                                    {d.likelihood.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed break-words">{d.rationale}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Section: Suggested Focus */}
                        {result.suggested_focus && result.suggested_focus.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles className="size-4 text-purple-500" />
                                    Recommended Clinical Focus
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.suggested_focus.map((area, i) => (
                                        <span key={i} className="px-3 py-1.5 text-xs bg-primary/5 text-primary border border-primary/10 rounded-full font-semibold">
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-secondary/30 px-6 py-4 border-t border-border text-[10px] text-muted-foreground text-center">
                        <p>This report is for educational purposes. Always consult a healthcare professional for diagnosis.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
