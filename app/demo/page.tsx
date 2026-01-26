"use client"

import React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Pencil,
  Plus,
  Shield,
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
import { PremiumBackground } from "@/components/premium-background"

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
    <div className="relative h-screen flex flex-col pt-16 overflow-hidden">
      <PremiumBackground />

      {/* Main Full-Screen Layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 w-full flex flex-col relative"
      >
        {/* Results Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pt-10 pb-40 md:px-12 scroll-smooth">
          <div className="max-w-4xl mx-auto h-full">
            <AnimatePresence mode="wait">
              {/* Idle State */}
              {state === "idle" && !showHistory && (
                <motion.div
                  key="idle"
                  {...fadeUp}
                  className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
                >
                  <div className="max-w-xl mx-auto space-y-8">
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
                        <motion.span className="size-2 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
                        <motion.span className="size-2 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
                        <motion.span className="size-2 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
                      </>
                    ) : (
                      <>
                        <span className="size-2 rounded-full bg-primary" />
                        <span className="size-2 rounded-full bg-primary" />
                        <span className="size-2 rounded-full bg-primary" />
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">Pluto is reviewing common symptom patterns…</p>
                </motion.div>
              )}

              {/* History View */}
              {showHistory && (
                <motion.div key="history" {...fadeUp} className="space-y-6 pb-8">
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
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.triageResult.severity.level.includes('URGENT') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {record.triageResult.severity.level}
                          </span>
                        </div>
                        <p className="font-medium text-foreground mb-1 line-clamp-2">"{record.symptoms}"</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{record.triageResult.summary}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Results State */}
              {state === "results" && result && (
                <motion.div key="results" className="space-y-6 pb-8">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-secondary/30 border-b border-border px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-primary/10 p-2 rounded-lg"><Activity className="size-5 text-primary" /></div>
                        <div>
                          <h2 className="text-foreground font-semibold text-base">Clinical Assessment</h2>
                          <p className="text-xs text-muted-foreground tracking-tight">{new Date().toLocaleDateString()} • {result.confidence.level}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => generateMedicalReport(symptoms, result, crypto.randomUUID(), Date.now())} className="text-xs font-bold bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg transition-all flex items-center gap-2">
                          <FileDown className="size-4" /> EXPORT
                        </button>
                        <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest ${result.severity.level.includes('URGENT') ? 'bg-red-500 text-white' : 'bg-primary text-white'}`}>
                          {result.severity.level}
                        </span>
                      </div>
                    </div>

                    <div className="p-8 space-y-8">
                      {/* Urgency Summary */}
                      {result.urgency_summary && (
                        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                          <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2">Findings Context</h3>
                          <p className="text-foreground leading-relaxed">{result.urgency_summary}</p>
                        </div>
                      )}

                      {/* Differential */}
                      {result.differential_diagnosis && result.differential_diagnosis.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Differential Analysis</h3>
                          <div className="grid gap-4">
                            {result.differential_diagnosis.map((d, i) => (
                              <div key={i} className="p-5 bg-secondary/20 rounded-2xl border border-border/50">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-bold text-lg">{d.condition}</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary tracking-widest uppercase`}>{d.likelihood} Confidence</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{d.rationale}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <div className="flex justify-center gap-4">
                    <button onClick={handleEdit} className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
                      <Pencil className="size-4" /> EDIT SYMPTOMS
                    </button>
                    <button onClick={() => setState("idle")} className="text-sm font-bold text-muted-foreground hover:text-foreground">
                      START OVER
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 bg-white/50 dark:bg-black/50 backdrop-blur-xl border-t border-border/50 p-6 md:p-10">
          <div className="max-w-3xl mx-auto relative group">
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
              placeholder={state === "results" ? "Ask a clinical follow-up..." : "Describe your symptoms in detail..."}
              className="w-full pl-6 pr-36 py-5 bg-background border-border/50 focus:border-primary/50 rounded-3xl resize-none focus:outline-none focus:ring-4 focus:ring-primary/5 shadow-2xl transition-all text-lg"
              rows={1}
            />
            <div className="absolute right-4 bottom-4 flex items-center gap-2">
              <button onClick={toggleRecording} className={`p-3 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white' : 'hover:bg-secondary text-muted-foreground'}`}>
                {isRecording ? <div className="size-4 bg-white rounded-sm animate-pulse" /> : <Mic className="size-5" />}
              </button>
              <button
                onClick={state === "results" ? handleSendMessage : handleAnalyze}
                disabled={state === "processing"}
                className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                <ArrowRight className="size-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Consent Modal */}
      <AnimatePresence>
        {showConsentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-card rounded-[2.5rem] border border-white/10 shadow-3xl p-10 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 primary-gradient" />
              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2">Clinical Consent</h2>
                <p className="text-muted-foreground">Pluto is an educational triage engine. By continuing, you agree that this is not medical advice.</p>
              </div>
              <div className="space-y-4 mb-10">
                <div className="flex gap-4 p-4 rounded-2xl bg-secondary/30">
                  <Shield className="size-6 text-primary shrink-0" />
                  <p className="text-sm">Deterministic protocols are used for primary safety screening.</p>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-secondary/30">
                  <Lock className="size-6 text-primary shrink-0" />
                  <p className="text-sm">Health data is scrubbed of PII and encrypted locally.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl" onClick={() => setShowConsentModal(false)}>Cancel</Button>
                <Button className="flex-1 h-14 rounded-2xl primary-gradient text-white font-bold" onClick={handleConsentSubmit} disabled={isSavingConsent}>I UNDERSTAND</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
