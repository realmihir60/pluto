"use client"

// Pluto Intelligence Console - Demo Interface v4.2
import React, { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Sparkles,
  Shield,
  FileDown,
  Mic,
  Lock,
  History,
  Clock,
  ArrowRight
} from "lucide-react"
import { saveCheckup, getHistory, CheckupRecord } from "@/lib/vault"
import { generateMedicalReport } from "@/lib/report-generator"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { PremiumBackground } from "@/components/ui/premium-background"
import { trackEvent } from "@/lib/analytics"
import { FeedbackButtons } from "@/components/triage/feedback-buttons"

type DemoState = "idle" | "input" | "processing" | "results" | "editing"

interface AnalysisResult {
  summary?: string
  patterns: { name: string; prevalence: string }[]
  severity: { level: string; advice: string[] }
  seekCare: string[]
  confidence: { level: string; note: string }
  risk_factors?: string[]
  differential_rationale?: string[]
  urgency_summary?: string
  key_findings?: string[]
  differential_diagnosis?: { condition: string; likelihood: string; rationale: string }[]
  suggested_focus?: string[]
  follow_up_questions?: string[]
  clinical_notes?: string
}

export default function DemoPage() {
  const [hasConsented, setHasConsented] = useState<boolean>(false)
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false)
  const [isSavingConsent, setIsSavingConsent] = useState<boolean>(false)

  const [state, setState] = useState<DemoState>("idle")
  const [symptoms, setSymptoms] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [triageEventId, setTriageEventId] = useState<string | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const router = useRouter()

  const [history, setHistory] = useState<CheckupRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)

  // Voice Triage State
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Chat State
  type ChatMessage =
    | { role: 'user', content: string, type?: 'text' }
    | { role: 'assistant', content: string, type: 'text' }
    | { role: 'assistant', content: string, type: 'structured_analysis', data: AnalysisResult }
    | { role: 'system', content: string, type: 'report_cta', data: AnalysisResult };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

  // Helper to detect if we should show the Report CTA
  const checkForConclusion = (text: string, analysis: AnalysisResult) => {
    const urgency = analysis.severity.level.toUpperCase();
    const lowerText = text.toLowerCase();

    // 1. High Urgency - Show immediately
    if (urgency.includes("EMERGENCY") || urgency.includes("URGENT")) return true;

    // 2. Concluding phrases - Expanded
    const engagingPhrases = ["tell me more", "could you clarify", "?", "next step"];
    const concludingPhrases = [
      "emergency room", "doctor", "physician", "monitor your progress", "take care",
      "hope you feel better", "get checked out", "schedule a follow-up", "follow-up",
      "monitoring", "report", "conclusion", "assessment complete", "summary"
    ];

    // If asking a specific question, likely NOT done (unless it's just rhetorical)
    // But if we have concluding phrases, we might want to show it ANYWAY as an option.
    // Let's be aggressive: if it ends with "progress" or "follow-up", show it.
    if (concludingPhrases.some(p => lowerText.includes(p))) return true;

    return false;
  };

  const formatBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const RichText = ({ content }: { content: string }) => {
    if (!content) return null;
    return (
      <div className="space-y-1">
        {content.split('\n').map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-1.5" />; // Proper spacer

          if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
            return (
              <div key={i} className="flex gap-2 pl-1">
                <span className="text-primary font-bold leading-relaxed">•</span>
                <span className="leading-relaxed">{formatBold(trimmed.replace(/^[•-]\s*/, ''))}</span>
              </div>
            );
          }
          return <div key={i} className="leading-relaxed">{formatBold(line)}</div>;
        })}
      </div>
    );
  };

  console.log('[RENDER] ChatMessages:', chatMessages);

  // ... (hooks) ...

  const handleGenerateReport = async () => {
    if (!result) return;
    try {
      const doc = generateMedicalReport(symptoms, result);
      doc.save(`Pluto_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      trackEvent('DOWNLOAD_REPORT');
    } catch (err) {
      console.error("Report generation failed", err);
    }
  };

  const handleAnalyze = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (symptoms.trim().length < 10 && !attachedImage) return

    if (!hasConsented) {
      setShowConsentModal(true)
      return
    }

    // -- Telemetry: Submit Triage --
    trackEvent('SUBMIT_TRIAGE', { length: symptoms.length, withImage: !!attachedImage });

    setState("processing")
    setResult(null)

    try {
      let data;
      if (attachedImage) {
        const res = await fetch('/api/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: attachedImage }),
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Document analysis failed');
        const docData = await res.json();
        data = {
          matched_symptoms: docData.key_findings || [],
          triage_level: 'info',
          message: docData.summary || "Document analyzed successfully.",
        };
      } else {
        const res = await fetch('/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: symptoms }),
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Analysis failed');
        data = await res.json();
      }

      const adaptedResult: AnalysisResult = {
        // ... (mapping same as before) ...
        summary: data.friendly_message || data.detailed_analysis || data.message || data.summary,
        patterns: (data.matched_symptoms || data.matched_protocols || []).map((s: string) => ({
          name: s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
          prevalence: "Detected"
        })),
        severity: {
          level: (data.triage_level || 'INFO').replace('_', ' ').toUpperCase(),
          advice: data.home_care_tips || [data.message]
        },
        seekCare: data.when_to_worry || ["Consult a healthcare provider for any concerning symptoms"],
        confidence: {
          level: data.confidence?.level || ((attachedImage || data.ai_analysis) ? "Clinical Analysis" : "High"),
          note: (attachedImage || data.ai_analysis)
            ? "Based on Pluto engine analysis. Verify with a professional."
            : "Based on verified medical knowledge base rules"
        },
        urgency_summary: data.urgency_rationale || data.urgency_summary || data.summary,
        key_findings: data.what_we_know || data.key_findings || [],
        differential_diagnosis: (data.differential_diagnosis || []).slice(0, 4).map((d: any) => ({
          condition: d.condition,
          likelihood: d.evidence_strength || d.likelihood || "Possible",
          rationale: `Urgency: ${(d.urgency || 'monitor').replace('_', ' ')}`
        })),
        suggested_focus: data.suggested_focus || [],
        follow_up_questions: data.follow_up_questions || [],
        clinical_notes: data.anti_hallucination_notes?.join(' ') || data.clinical_notes || ""
      };

      setResult(adaptedResult);

      // Message 1: The Clinical Data Card (Urgency, Findings, Differentials ONLY)
      // We strip summary and questions to avoid duplication with the text message.
      const cardMsg: ChatMessage = {
        role: 'assistant',
        content: "Clinical Assessment",
        type: 'structured_analysis',
        data: { ...adaptedResult, summary: undefined, follow_up_questions: [] }
      };

      // Message 2: Conversational Follow-up (Summary + Questions)
      let followUpText = `${adaptedResult.summary}\n\n`;
      if (adaptedResult.follow_up_questions?.length) {
        followUpText += "**Next Steps:**\nTo help me narrow this down, could you tell me:\n";
        adaptedResult.follow_up_questions.forEach(q => followUpText += `• ${q}\n`);
      }
      const textMsg: ChatMessage = { role: 'assistant', content: followUpText, type: 'text' };

      const newMsgs: ChatMessage[] = [
        { role: 'user', content: symptoms, type: 'text' },
        cardMsg,
        textMsg
      ];

      // Check conclusion immediately (e.g. for Emergency)
      if (checkForConclusion(followUpText, adaptedResult)) {
        newMsgs.push({ role: 'system', content: "Report Ready", type: 'report_cta', data: adaptedResult });
      }

      setChatMessages(newMsgs);
      setState("results");
      saveCheckup(symptoms, adaptedResult, adaptedResult.confidence.level === "AI Analysis" ? adaptedResult.summary : undefined)
        .then(() => getHistory().then(setHistory))
        .catch((err: any) => console.error("Failed to save to vault", err));

    } catch (error: any) {
      console.error(error);
      setState("idle");
    }
  }, [symptoms, attachedImage, isAuthenticated, hasConsented]);

  // 2. Update handleSendMessage (standard text messages)
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = { role: 'user', content: chatInput, type: 'text' };

    // Filter out structured messages when sending to LLM API (it expects strings)
    const apiHistory = chatMessages
      .filter(m => m.type === 'text' || m.role === 'user') // simple heuristic
      .map(m => ({ role: m.role, content: m.content || "" }));

    const updatedHistory = [...chatMessages, newMessage];
    setChatMessages(updatedHistory);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...apiHistory, { role: 'user', content: chatInput }] }), // Append new msg
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();

      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response_text || "...", type: 'text' };

      const finalHistory = [...updatedHistory, assistantMessage];

      // Check for conclusion
      if (result && checkForConclusion(data.response_text || "", result)) {
        finalHistory.push({ role: 'system', content: "Report Ready", type: 'report_cta', data: result });
      }

      setChatMessages(finalHistory);

      if (data.updated_analysis && result) {
        // ... (update result state logic) ...
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ... (handleLoadRecord logic needs update too) ...
  const handleLoadRecord = (record: CheckupRecord) => {
    setSymptoms(record.symptoms);
    setResult(record.triageResult as AnalysisResult);
    setChatMessages([
      { role: 'user', content: record.symptoms, type: 'text' },
      { role: 'assistant', content: record.triageResult.summary || "Analysis Complete", type: 'structured_analysis', data: record.triageResult as AnalysisResult }
    ]);
    setShowHistory(false);
    setState("results");
  };



  // -- Telemetry: View Landing --
  useEffect(() => {
    trackEvent('VIEW_LANDING');
  }, []);

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

  // Handle session state - LOG for debugging, NO client-side redirect (middleware handles it)
  useEffect(() => {
    console.log('[DEMO] Session status:', status, 'User:', session?.user?.email);
    // Set consent status once session is loaded
    if (status === "authenticated" && session?.user) {
      setHasConsented((session.user as any).hasConsented ?? false);
    }
  }, [status, session]);

  // -- Telemetry: Start Input --
  const handleSymptomsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (symptoms === "" && val.length > 0) {
      trackEvent('START_INPUT');
    }
    setSymptoms(val);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }

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
            setSymptoms((prev) => {
              if (prev === "") trackEvent('START_INPUT');
              return prev ? prev + " " + data.text : data.text;
            });
          }
        } catch (error) {
          console.error("Transcription failed", error);
        } finally {
          setIsTranscribing(false);
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

  const handleConsentSubmit = async () => {
    setIsSavingConsent(true);
    console.log('[CONSENT] Starting consent submission...');
    try {
      // Submit Consent
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session?.user?.email || "anonymous" }),
        credentials: 'include'
      });

      console.log('[CONSENT] Response status:', res.status);
      const data = await res.json();
      console.log('[CONSENT] Response data:', data);

      if (!res.ok) throw new Error(data.message || 'Consent failed');

      if (data.success) {
        console.log('[CONSENT] Success! Closing modal...');
        setHasConsented(true)
        setShowConsentModal(false)
      } else {
        console.warn('[CONSENT] No success flag in response:', data);
      }
    } catch (err: any) {
      console.error('[CONSENT] Error:', err);
      alert(`Gateway Error: \n\n${err.message || 'Connection failed'}`);
    } finally {
      setIsSavingConsent(false);
    }
  }



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

  if (status === "loading" || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col pt-28">
      <PremiumBackground />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 w-full flex flex-col relative"
      >
        <div className="flex-1 overflow-y-auto px-4 pt-4 md:pt-10 pb-[180px] md:px-12 scroll-smooth">
          <div className="max-w-4xl mx-auto h-full">
            <AnimatePresence mode="wait">
              {(state === "idle" || state === "input") && !showHistory && (
                <motion.div
                  key="idle"
                  {...fadeUp}
                  className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
                >
                  <div className="max-w-2xl mx-auto space-y-8">
                    {/* Header Section */}
                    <div className="text-center space-y-4">
                      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                        Describe your symptoms
                      </h1>
                      {history.length > 0 && (
                        <button
                          onClick={() => setShowHistory(true)}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          <History className="size-4" />
                          {history.length} Past Checkup{history.length > 1 ? 's' : ''}
                        </button>
                      )}
                      <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                        Be specific. Include when it started, how it feels, and what makes it better or worse.
                      </p>
                    </div>

                    {/* Example Section */}
                    <div className="bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/20 p-6 rounded-3xl">
                      <div className="flex gap-4">
                        <div className="shrink-0">
                          <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Sparkles className="size-5 text-primary" />
                          </div>
                        </div>
                        <div className="space-y-2 flex-1">
                          <p className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Good Example</p>
                          <p className="text-base text-foreground/90 leading-relaxed">
                            "Sharp chest pain when I breathe deeply. Started this morning. Hurts more on the right side."
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

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
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.triageResult.severity.level.includes('EMERGENCY') || record.triageResult.severity.level.includes('URGENT') ? 'bg-red-100 text-red-700' : record.triageResult.severity.level.includes('MONITOR') ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
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

              {state === "results" && (
                <motion.div key="results" className="flex flex-col h-full relative pb-32">
                  <div className="flex-1 overflow-y-auto space-y-6 p-4">
                    {/* Chat Header / Actions */}
                    <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-xl mb-4 border border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg"><Activity className="size-4 text-primary" /></div>
                        <span className="text-sm font-semibold">Live Consultation</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleGenerateReport}
                          className="text-xs font-bold bg-background hover:bg-secondary border border-border px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                        >
                          <FileDown className="size-3.5" /> Report
                        </button>
                        <button onClick={() => setState("idle")} className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5">
                          New
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages Stream */}
                    {chatMessages.map((msg, idx) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                            <Sparkles className="size-4 text-primary" />
                          </div>
                        )}

                        {msg.type === 'report_cta' ? (
                          <div className="max-w-[85%] md:max-w-[400px] w-full">
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-card border border-border rounded-2xl p-6 shadow-lg text-center"
                            >
                              <FileDown className="size-10 text-primary mx-auto mb-3" />
                              <h3 className="text-lg font-bold mb-1">Consultation Complete</h3>
                              <p className="text-sm text-muted-foreground mb-4">Your clinical report is ready for download.</p>
                              <Button onClick={handleGenerateReport} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold text-white rounded-xl h-12 shadow-md hover:shadow-lg transition-all">
                                Download PDF Report
                              </Button>
                            </motion.div>
                          </div>
                        ) : msg.type === 'structured_analysis' && msg.data ? (
                          <div className="max-w-[90%] md:max-w-[600px] w-full">
                            <div className={`flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden`}>
                              {/* Urgency Header */}
                              <div className={`px-4 py-3 flex items-center justify-between border-b border-border/50 ${msg.data.severity.level.includes('EMERGENCY') ? 'bg-red-500/10' :
                                msg.data.severity.level.includes('URGENT') ? 'bg-amber-500/10' : 'bg-green-500/10'
                                }`}>
                                <div className="flex items-center gap-2">
                                  <Shield className={`size-4 ${msg.data.severity.level.includes('EMERGENCY') ? 'text-red-500' :
                                    msg.data.severity.level.includes('URGENT') ? 'text-amber-500' : 'text-green-500'
                                    }`} />
                                  <span className={`text-sm font-bold tracking-tight ${msg.data.severity.level.includes('EMERGENCY') ? 'text-red-600' :
                                    msg.data.severity.level.includes('URGENT') ? 'text-amber-600' : 'text-green-600'
                                    }`}>
                                    STATUS: {msg.data.severity.level}
                                  </span>
                                </div>
                              </div>

                              <div className="p-5 space-y-4">
                                {/* Key Findings */}
                                {msg.data.key_findings && msg.data.key_findings.length > 0 && (
                                  <div className="bg-secondary/30 rounded-lg p-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Key Findings</p>
                                    <div className="flex flex-wrap gap-2">
                                      {msg.data.key_findings.map((f, i) => (
                                        <span key={i} className="text-xs bg-background border border-border px-2 py-1 rounded-md">{f}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Differentials */}
                                {msg.data.differential_diagnosis && msg.data.differential_diagnosis.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Possibilities to Consider</p>
                                    <div className="grid gap-2">
                                      {msg.data.differential_diagnosis.slice(0, 3).map((d, i) => (
                                        <div key={i} className="flex justify-between items-center bg-secondary/20 p-2.5 rounded-lg border border-border/50">
                                          <span className="text-sm font-semibold">{d.condition}</span>
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{d.likelihood}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap'
                            : 'bg-card border border-border/50 text-foreground rounded-tl-sm shadow-sm'
                            }`}>
                            {msg.role === 'assistant' ? <RichText content={msg.content} /> : msg.content}
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Typing Indicator */}
                    {isChatLoading && (
                      <div className="flex gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                          <Sparkles className="size-4 text-primary" />
                        </div>
                        <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                          <span className="size-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="size-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="size-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}

                    <div className="h-4" /> {/* Spacer */}
                  </div>
                </motion.div>
              )}

              <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent p-4 md:p-6 pb-[15px] z-50">
                <div className="max-w-3xl mx-auto relative group">
                  <div className="relative glass-morphism border border-white/20 rounded-[2.5rem] shadow-3xl overflow-hidden transition-all duration-500 group-within:ring-4 group-within:ring-primary/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-within:scale-150" />

                    <textarea
                      id="symptom-textarea"
                      ref={textareaRef}
                      value={state === "results" ? chatInput : symptoms}
                      onChange={state === "results" ? (e) => setChatInput(e.target.value) : handleSymptomsChange}
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
                      className="w-full pl-8 pr-40 py-6 bg-transparent resize-none focus:outline-none text-lg text-foreground placeholder:text-muted-foreground/50 transition-all min-h-[80px]"
                      rows={1}
                    />

                    <div className="absolute right-4 bottom-4 flex items-center gap-3">
                      <button
                        id="voice-triage-button"
                        aria-label={isRecording ? "Stop recording" : "Start voice triage"}
                        onClick={toggleRecording}
                        className={`p-3.5 rounded-2xl transition-all duration-300 ${isRecording
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                          : 'bg-secondary/50 hover:bg-secondary text-muted-foreground border border-white/10'
                          }`}
                      >
                        {isRecording ? <div className="size-5 bg-white rounded-sm animate-pulse" /> : <Mic className="size-5" />}
                      </button>
                      <button
                        id="submit-triage-button"
                        aria-label="Send symptoms"
                        onClick={state === "results" ? handleSendMessage : handleAnalyze}
                        disabled={state === "processing" || (state !== "results" && !canSubmit)}
                        className={`size-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl ${canSubmit || state === "results"
                          ? 'primary-gradient text-white shadow-primary/20 hover:scale-105 active:scale-95'
                          : 'bg-secondary/30 text-muted-foreground/30 border border-white/5 cursor-not-allowed'
                          }`}
                      >
                        <ArrowRight className="size-7" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

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
    </div >
  )
}
