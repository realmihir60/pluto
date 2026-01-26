"use client"

import React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Pencil,
  Plus,
  ChevronDown,
  Search,
  Cpu,
  Activity,
  Sparkles,
  Lock,
  FileText,
  ArrowRight,
  ArrowLeft,
  Mic,
  Loader2,
  History,
  Clock,
  FileDown
} from "lucide-react"
import { saveCheckup, getHistory, CheckupRecord } from "@/lib/vault"
import { generateMedicalReport } from "@/lib/report-generator"
// import { useAuth } from "@/context/auth-context"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type DemoState = "idle" | "input" | "processing" | "results" | "editing"

interface AnalysisResult {
  summary?: string
  patterns: { name: string; prevalence: string }[]
  severity: { level: string; advice: string[] }
  seekCare: string[]
  confidence: { level: string; note: string }
  // New Structured Data
  risk_factors?: string[]
  differential_rationale?: string[]
  // v2.1 Professional Data
  urgency_summary?: string
  key_findings?: string[]
  differential_diagnosis?: { condition: string; likelihood: string; rationale: string }[]
  suggested_focus?: string[]
  follow_up_questions?: string[]
}


const mockAnalysis: AnalysisResult = {
  patterns: [
    { name: "Tension-type headache", prevalence: "78% prevalence in similar cases" },
    { name: "Screen-related eye strain", prevalence: "22%" },
  ],
  severity: {
    level: "Mild to Moderate",
    advice: [
      "Usually resolves with rest and hydration",
      "Consider consulting a clinician if persists > 3 days",
    ],
  },
  seekCare: [
    "Sudden severe headache",
    "Vision changes",
    "Neck stiffness or fever",
  ],
  confidence: {
    level: "Medium",
    note: "Based on limited input (add more details for higher accuracy)",
  },
}

export default function DemoPage() {
  // PERMISSIVE TESTING MODE: SCRAPPING AUTH TO UNBLOCK DEV
  const [hasConsented, setHasConsented] = useState(true)
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false)
  const [isSavingConsent, setIsSavingConsent] = useState<boolean>(false)

  const [state, setState] = useState<DemoState>("idle")
  const [symptoms, setSymptoms] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"
  const router = useRouter()

  // Vault State
  const [history, setHistory] = useState<CheckupRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // const { isAuthenticated, isLoading } = useAuth() // Removed legacy
  // const router = useRouter()

  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push("/login")
  //   }
  // }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  // Load History on Mount
  useEffect(() => {
    getHistory().then(setHistory).catch(console.error);
  }, []);





  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)

  // Voice Triage State
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          if (data.text) {
            setSymptoms((prev) => prev ? prev + " " + data.text : data.text);
          }
        } catch (error) {
          console.error("Transcription failed", error);
        } finally {
          setIsTranscribing(false);
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleFocus = useCallback(() => {
    if (state === "idle") {
      setState("input")
    }
  }, [state])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleConsentSubmit = async () => {
    setIsSavingConsent(true);
    try {
      console.log("Attempting consent sign-off at /api/consent...");
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!res.ok) {
        const errorText = await res.text();
        let displayError = errorText;
        try {
          const jsonErr = JSON.parse(errorText);
          displayError = JSON.stringify(jsonErr.detail || jsonErr, null, 2);
        } catch (e) {
          // Keep as raw text if not JSON
        }
        throw new Error(displayError);
      }

      const data = await res.json();
      if (data.success) {
        setHasConsented(true)
        setShowConsentModal(false)
      } else {
        const detail = JSON.stringify(data.detail || data, null, 2);
        alert(`Clinical Logic Alert: \n${detail}`);
      }
    } catch (err: any) {
      console.error("GATEWAY_ERROR:", err);
      // Detailed error for mobile debugging
      const cleanMsg = err.message || 'Connection failed';
      alert(`Gateway Error: \n\n${cleanMsg}`);
    } finally {
      setIsSavingConsent(false);
    }
  }

  const handleAnalyze = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (symptoms.trim().length < 10 && !attachedImage) return

    if (!hasConsented) {
      setShowConsentModal(true)
      return
    }

    setState("processing")
    setResult(null)

    try {
      let data;

      // If image is attached, prioritize document analysis
      if (attachedImage) {
        const res = await fetch('/api/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: attachedImage }),
          credentials: 'include'
        });

        if (!res.ok) throw new Error('Document analysis failed');
        const docData = await res.json();

        // Map document analysis to result shape
        data = {
          matched_symptoms: docData.key_findings || [],
          triage_level: 'info', // Default safer level for documents
          message: docData.summary || "Document analyzed successfully.",
        };
      } else {
        // Standard text analysis
        const res = await fetch('/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: symptoms }),
          credentials: 'include'  // Critical: sends cookies to Python API
        });

        if (!res.ok) throw new Error('Analysis failed');
        data = await res.json();
      }


      // ... (inside component)
      // Adapt API response
      // Adapt API response to UI format
      const adaptedResult: AnalysisResult = {
        summary: (data.detailed_analysis || data.message), // Use detailed analysis if available
        patterns: data.matched_symptoms.map((s: string) => ({
          name: s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
          prevalence: "Detected"
        })),
        severity: {
          level: (data.triage_level || 'INFO').replace('_', ' ').toUpperCase(),
          advice: [data.message]
        },
        seekCare: ["Consult a healthcare provider for any concerning symptoms"],
        confidence: {
          level: (attachedImage || data.ai_analysis) ? "Clinical Analysis" : "High",
          note: (attachedImage || data.ai_analysis)
            ? "Based on Pluto engine analysis. Verify with a professional."
            : "Based on verified medical knowledge base rules"
        },
        // v2.1 Fields
        urgency_summary: data.urgency_summary,
        key_findings: data.key_findings || [],
        differential_diagnosis: data.differential_diagnosis || [],
        suggested_focus: data.suggested_focus || [],
        follow_up_questions: data.follow_up_questions || []
      };

      setResult(adaptedResult);
      // Initialize Chat History with context
      const initialAssistantMessage = (adaptedResult.summary || "Here is my clinical assessment.");
      const followUps = adaptedResult.follow_up_questions?.length
        ? "\n\n**To help me narrow this down, could you tell me more about:**\n" + adaptedResult.follow_up_questions.map(q => `• ${q}`).join("\n")
        : "";

      setChatMessages([
        { role: 'user', content: symptoms },
        { role: 'assistant', content: initialAssistantMessage + followUps }
      ]);
      setState("results");

      // Save to Vault (Local)
      saveCheckup(symptoms, adaptedResult, adaptedResult.confidence.level === "AI Analysis" ? adaptedResult.summary : undefined)
        .then(() => getHistory().then(setHistory))
        .catch(err => console.error("Failed to save to vault", err));

      // Note: Server-side persistence is now handled directly by the /api/triage Python endpoint
      // This ensures the Logic Snapshot and PII scrubbing are atomic.

    } catch (error) {
      console.error(error);
      setState("idle");
    }
  }, [symptoms, attachedImage, isAuthenticated]);

  // Chat State
  const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const lineHeight = 24
      const maxLines = 5
      const maxHeight = lineHeight * maxLines
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)

      textarea.style.height = `${newHeight}px`
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden"
    }
  }, [symptoms, chatInput])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const newMessage = { role: 'user', content: chatInput };
    const newHistory = [...chatMessages, newMessage];

    setChatMessages(newHistory);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();

      setChatMessages([...newHistory, data]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleLoadRecord = (record: CheckupRecord) => {
    setSymptoms(record.symptoms);
    setResult(record.triageResult as AnalysisResult);

    // Reconstruct basic chat history
    setChatMessages([
      { role: 'user', content: record.symptoms },
      { role: 'assistant', content: record.triageResult.summary || "Here is the historical assessment." }
    ]);

    setShowHistory(false);
    setState("results");
  };

  const handleEdit = useCallback(() => {
    setState("editing")
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (symptoms.trim().length >= 10) {
          handleAnalyze()
        }
      }
    },
    [symptoms, handleAnalyze]
  )

  const canSubmit = symptoms.trim().length >= 10

  const fadeUp = prefersReducedMotion
    ? {}
    : {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0 },
      transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
    }

  const stagger = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, delay, ease: [0.22, 1, 0.36, 1] as const },
      }

  // Handle loading and unauthenticated states
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden pt-20 pb-4 px-4 md:px-8">
      {/* Main Glass Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full bg-white/80 dark:bg-black/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-2xl shadow-blue-900/5 rounded-3xl overflow-hidden flex flex-col relative ring-1 ring-black/5">

        {/* Results Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pt-8 pb-32 md:px-12 scroll-smooth">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Idle State (Only if not showing history) */}
              {state === "idle" && !showHistory && (
                <motion.div
                  key="idle"
                  {...fadeUp}
                  className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
                >
                  <div className="max-w-xl mx-auto space-y-8">
                    {/* Branding / Header */}
                    <div className="space-y-4">
                      <div className="mx-auto size-12 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center mb-6">
                        <Activity className="size-6 text-primary" />
                      </div>
                      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                        Hello. How can I help?
                      </h1>

                      {history.length > 0 && (
                        <div className="flex justify-center">
                          <button
                            onClick={() => setShowHistory(true)}
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <History className="size-4" />
                            View {history.length} Past Checkups
                          </button>
                        </div>
                      )}

                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Describe your symptoms in your own words. <br className="hidden md:block" />
                        I'll analyze them against medical guidelines.
                      </p>
                    </div>

                    {/* Example Card */}
                    <div className="bg-card/40 backdrop-blur-sm border border-border/60 p-6 rounded-2xl text-left shadow-sm ring-1 ring-border/5">
                      <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkles className="size-4" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">Try saying something like...</p>
                          <p className="text-base text-muted-foreground italic leading-relaxed">
                            "I have a throbbing headache on the left side that started 2 days ago. It gets worse when I look at screens."
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trust Footer */}
                    <div className="flex items-center justify-center gap-6 pt-4 text-xs text-muted-foreground/60">
                      <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-help" title="We do not store your data">
                        <Lock className="size-3" />
                        Private & Anonymous
                      </span>
                      <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-help" title="Based on clinical protocols">
                        <FileText className="size-3" />
                        Clinicially Grounded
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Processing State */}
              {state === "processing" && (
                <motion.div
                  key="processing"
                  {...fadeUp}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    {!prefersReducedMotion ? (
                      <>
                        <motion.span
                          className="size-2 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                        />
                        <motion.span
                          className="size-2 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.span
                          className="size-2 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                        />
                      </>
                    ) : (
                      <>
                        <span className="size-2 rounded-full bg-primary" />
                        <span className="size-2 rounded-full bg-primary" />
                        <span className="size-2 rounded-full bg-primary" />
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Pluto is reviewing common symptom patterns…
                  </p>
                </motion.div>
              )}

              {/* History View */}
              {showHistory && (
                <motion.div
                  key="history"
                  {...fadeUp}
                  className="space-y-6 pb-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <History className="size-5 text-primary" />
                      Your Health Vault
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                      Back to Triage
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {history.map((record) => (
                      <button
                        key={record.id}
                        onClick={() => handleLoadRecord(record)}
                        className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 hover:border-primary/20 hover:shadow-sm transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                            <Clock className="size-3" />
                            {new Date(record.timestamp).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.triageResult.severity.level.includes('URGENT')
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                              }`}>
                              {record.triageResult.severity.level}
                            </span>
                            <ArrowRight className="size-3 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                        <p className="font-medium text-foreground mb-1 line-clamp-2">
                          "{record.symptoms}"
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {record.triageResult.summary}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Results State */}
              {state === "results" && result && (
                <motion.div
                  key="results"
                  className="space-y-4 pb-8"
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 } })}
                >
                  {/* Medical Report Container */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-secondary/30 border-b border-border px-4 py-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Activity className="size-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-foreground font-semibold text-base truncate">Clinical Assessment</h2>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{new Date().toLocaleDateString()}</span>
                            <span>•</span>
                            <span className={`${result.confidence.level === 'Clinical Analysis' ? 'text-amber-600' : 'text-green-600'} font-medium`}>
                              {result.confidence.level} Source
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                        <button
                          onClick={() => generateMedicalReport(symptoms, result, crypto.randomUUID(), Date.now())}
                          className="text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                          title="Download PDF Report"
                        >
                          <FileDown className="size-3.5" />
                          <span className="inline">Export</span>
                        </button>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap
                          ${result.severity.level.includes('URGENT') || result.severity.level.includes('CARE')
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            {result.severity.level}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">

                      {/* Section 0: Emergency Hub (Crisis/Urgent only) */}
                      {(result.severity.level.includes('URGENT') || result.severity.level.includes('CRISIS')) && (
                        <div className="p-6 rounded-2xl bg-red-500/10 border-2 border-red-500/20 shadow-inner">
                          <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="p-4 bg-red-500 rounded-2xl shadow-lg animate-pulse">
                              <AlertTriangle className="size-8 text-white" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                              <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-1">
                                Emergency Response Hub
                              </h2>
                              <p className="text-sm text-red-700/80 dark:text-red-400/80 font-medium">
                                Significant clinical risks detected. Immediate action is required.
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                              <a
                                href="tel:911"
                                className="flex-1 text-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                              >
                                Call 911
                              </a>
                              <a
                                href={`https://www.google.com/maps/search/hospital+near+me`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 text-center px-6 py-3 bg-white dark:bg-zinc-900 border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                              >
                                <Search className="size-4" />
                                Nearest ER
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 1: Urgency Summary (One Glance) */}
                      {result.urgency_summary && (
                        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                          <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="size-3" />
                            Why This Urgency Level
                          </h3>
                          <p className="text-sm text-foreground font-medium break-words">{result.urgency_summary}</p>
                        </div>
                      )}

                      {/* Section 2: Key Clinical Findings */}
                      {result.key_findings && result.key_findings.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-foreground uppercase tracking-wider flex items-center gap-2">
                            <Search className="size-4 text-primary" />
                            Key Clinical Findings
                          </h3>
                          <ul className="space-y-1.5 pl-1">
                            {result.key_findings.map((finding, i) => (
                              <li key={i} className="text-sm text-foreground/90 flex gap-2 break-words">
                                <span className="text-primary shrink-0">→</span>
                                <span>{finding}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Section 3: Differential Diagnosis Table */}
                      {result.differential_diagnosis && result.differential_diagnosis.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-foreground uppercase tracking-wider flex items-center gap-2">
                            Differential Diagnosis
                          </h3>
                          {/* Mobile Card View (< md) */}
                          <div className="md:hidden space-y-3">
                            {result.differential_diagnosis.map((d, i) => (
                              <div key={i} className="bg-secondary/30 rounded-lg border border-border p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-semibold text-foreground">{d.condition}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.likelihood === 'High' ? 'bg-red-100 text-red-700' :
                                    d.likelihood === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>{d.likelihood}</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{d.rationale}</p>
                              </div>
                            ))}
                          </div>

                          {/* Desktop Table View (>= md) */}
                          <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-sm">
                              <thead className="bg-secondary/50 text-left">
                                <tr>
                                  <th className="p-3 font-semibold">Condition</th>
                                  <th className="p-3 font-semibold">Likelihood</th>
                                  <th className="p-3 font-semibold w-1/2">Supporting Features</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {result.differential_diagnosis.map((d, i) => (
                                  <tr key={i} className="hover:bg-secondary/30">
                                    <td className="p-3 font-medium align-top">{d.condition}</td>
                                    <td className="p-3 align-top">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.likelihood === 'High' ? 'bg-red-100 text-red-700' :
                                        d.likelihood === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                                          'bg-green-100 text-green-700'
                                        }`}>{d.likelihood}</span>
                                    </td>
                                    <td className="p-3 text-muted-foreground align-top">{d.rationale}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Section 4: Suggested Focus Areas */}
                      {result.suggested_focus && result.suggested_focus.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-foreground uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="size-4 text-purple-500" />
                            Suggested Clinical Focus
                          </h3>
                          <p className="text-xs text-muted-foreground">Consider evaluating:</p>
                          <div className="flex flex-wrap gap-2">
                            {result.suggested_focus.map((area, i) => (
                              <span key={i} className="px-3 py-1.5 text-sm bg-secondary/50 border border-border rounded-full font-medium">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 5: Follow-up Questions */}
                      {result.follow_up_questions && result.follow_up_questions.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-border/50">
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                              <Activity className="size-3" />
                              Clinical Logic Bridge
                            </h3>
                            <p className="text-xs text-muted-foreground">Select a topic to provide more details and improve accuracy:</p>
                          </div>

                          <div className="grid gap-3">
                            {result.follow_up_questions.map((q, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setChatInput(`Regarding "${q}": `);
                                  textareaRef.current?.focus();
                                }}
                                className="text-left group relative p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl hover:border-primary/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="size-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <ArrowLeft className="size-3 rotate-180" />
                                  </div>
                                  <span className="text-sm text-foreground/90 font-medium leading-relaxed">
                                    {q}
                                  </span>
                                </div>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Answer Topic</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="bg-secondary/30 px-6 py-3 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs text-muted-foreground">
                      <p>{result.confidence.note}</p>
                      <p className="opacity-70">Generated by Pluto Clinical Intel • Not a diagnosis</p>
                    </div>
                  </motion.div>

                  {/* Edit Button */}
                  <motion.div {...stagger(0.4)} className="pt-2">
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit symptoms
                    </button>
                  </motion.div>

                  {/* --- Follow-up Chat Section --- */}
                  <motion.div {...stagger(0.5)} className="pt-8 border-t border-border mt-8">
                    <h3 className="text-foreground font-medium mb-4 flex items-center gap-2">
                      <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold">INTEL</span>
                      Protocol Follow-up
                    </h3>

                    {/* Chat Messages */}
                    <div className="space-y-4 mb-4">
                      {chatMessages.map((msg, idx) => (
                        idx > 1 && (
                          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 text-sm rounded-lg ${msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary/50 text-foreground border border-border/50'
                              }`}>
                              {msg.content}
                            </div>
                          </div>
                        )
                      ))}
                      {isChatLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="bg-secondary/50 p-3 rounded-lg flex items-center gap-1">
                            <span className="size-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <span className="size-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <span className="size-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      )}
                    </div>


                  </motion.div>
                </motion.div>
              )}

              {/* Input/Editing visible state */}
              {(state === "input" || state === "editing") && (
                <motion.div key="typing" {...fadeUp} className="py-16 text-center">
                  <p className="text-muted-foreground text-sm">
                    Press Enter to analyze or Shift+Enter for new line
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area - Pinned to bottom of Glass Container */}
        <div className="shrink-0 bg-white/50 dark:bg-black/50 backdrop-blur-md border-t border-white/20 dark:border-white/5 px-4 py-4 md:px-8">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Textarea */}
            <div className="relative group">
              <textarea
                ref={textareaRef}
                value={state === "results" ? chatInput : symptoms}
                onChange={(e) => state === "results" ? setChatInput(e.target.value) : setSymptoms(e.target.value)}
                onFocus={handleFocus}
                onKeyDown={(e) => {
                  if (state === "results") {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  } else {
                    handleKeyDown(e);
                  }
                }}
                placeholder={state === "results" ? "Ask a follow-up question..." : "Describe your symptoms..."}
                rows={1}
                className="w-full pl-5 pr-32 py-4 bg-secondary/80 hover:bg-secondary focus:bg-background transition-colors text-foreground placeholder:text-muted-foreground/70 border border-transparent focus:border-primary/20 rounded-2xl resize-none focus:outline-none focus:ring-4 focus:ring-primary/10 text-base leading-relaxed shadow-inner"
                style={{ maxHeight: "120px" }}
                aria-label={state === "results" ? "Chat input" : "Describe your symptoms"}
                disabled={state === "processing" || isChatLoading}
              />

              <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
                {/* Voice Button */}
                {state !== "results" && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={isTranscribing}
                    className={`p-2 rounded-full transition-all ${isRecording
                      ? 'bg-red-500 text-white animate-pulse shadow-lg ring-4 ring-red-500/20'
                      : isTranscribing
                        ? 'bg-secondary text-muted-foreground'
                        : 'text-muted-foreground hover:bg-black/5'
                      }`}
                    title={isRecording ? "Stop Recording" : "Start Voice Triage"}
                  >
                    {isTranscribing ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Mic className={`size-5 ${isRecording ? 'fill-current' : ''}`} />
                    )}
                  </button>
                )}

                {/* Attachment Button */}
                {state !== "results" && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      className={`p-2 rounded-full transition-colors ${attachedImage ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/5'}`}
                      title="Attach image"
                    >
                      <Plus className="size-5" />
                    </button>
                  </>
                )}

                {/* Send Button */}
                <Button
                  size="icon"
                  onClick={state === "results" ? handleSendMessage : handleAnalyze}
                  disabled={state === "results" ? (!chatInput.trim() || isChatLoading) : ((!canSubmit && !attachedImage) || state === "processing")}
                  className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-sm transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Footer / Reset */}
            {state === "results" && (
              <div className="text-center flex justify-center gap-6">
                {history.length > 0 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <History className="size-3" />
                    View History
                  </button>
                )}
                <button
                  onClick={() => {
                    setState("idle");
                    setSymptoms("");
                    setResult(null);
                    setChatMessages([]);
                  }}
                  className="text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors"
                >
                  Start New Checkup
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Consent Gate Modal */}
      <AnimatePresence>
        {showConsentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Lock className="size-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Clinical Terms of Use</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please review and accept our medical safety terms before proceeding.
                </p>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 rounded-xl bg-secondary/20 border border-border/50">
                    <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Not a Diagnosis</p>
                      <p className="text-xs text-muted-foreground">
                        Pluto is an educational utility. It cannot diagnose disease or prescribe treatment.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl bg-secondary/20 border border-border/50">
                    <Activity className="size-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Emergency Awareness</p>
                      <p className="text-xs text-muted-foreground">
                        If you have chest pain, signs of stroke, or severe trauma, call emergency services immediately.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl bg-secondary/20 border border-border/50">
                    <Lock className="size-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Data Privacy</p>
                      <p className="text-xs text-muted-foreground">
                        Your data is encrypted and stored in your secure health vault. PII is scrubbed before processing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-secondary/10 border-t border-border flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowConsentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleConsentSubmit}
                  disabled={isSavingConsent}
                >
                  {isSavingConsent ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "I Accept & Agree"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  )
}
