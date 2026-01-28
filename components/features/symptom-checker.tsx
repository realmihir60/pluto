'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, Activity, AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react';

interface TriageResult {
    triage_level: 'urgent' | 'seek_care' | 'home_care' | 'info' | 'crisis';
    message: string;
    matched_symptoms: string[];
    disclaimer: string;
}

export function SymptomChecker() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TriageResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const res = await fetch('/api/v2/triage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input }),
            });

            if (!res.ok) throw new Error('Failed to analyze symptoms');
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getResultStyle = (level: string) => {
        switch (level) {
            case 'crisis': return 'bg-red-50 border-red-200 text-red-900';
            case 'urgent': return 'bg-orange-50 border-orange-200 text-orange-900';
            case 'seek_care': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
            case 'home_care': return 'bg-green-50 border-green-200 text-green-900';
            default: return 'bg-blue-50 border-blue-200 text-blue-900';
        }
    };

    const getIcon = (level: string) => {
        switch (level) {
            case 'crisis': return <AlertTriangle className="h-5 w-5 text-red-600" />;
            case 'urgent': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
            case 'seek_care': return <Activity className="h-5 w-5 text-yellow-600" />;
            case 'home_care': return <CheckCircle className="h-5 w-5 text-green-600" />;
            default: return <Info className="h-5 w-5 text-blue-600" />;
        }
    };

    return (
        <section className="py-12 px-4 max-w-3xl mx-auto">
            <Card className="shadow-lg border-2 border-slate-100">
                <CardHeader className="bg-slate-50/50 space-y-4 pb-6">
                    <div className="flex items-center gap-2 text-primary">
                        <ShieldCheck className="w-6 h-6" />
                        <span className="font-semibold text-sm tracking-wide uppercase">Privacy First</span>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
                        Symptom Checker
                    </CardTitle>
                    <CardDescription className="text-lg text-slate-600">
                        Describe your symptoms in plain English. Our system checks against a curated medical knowledge base.
                    </CardDescription>
                    <Alert className="bg-blue-50 border-blue-200 mt-4">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800 font-semibold">Zero Data Retention</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Your input is analyzed in real-time and immediately discarded. PII is stripped automatically.
                        </AlertDescription>
                    </Alert>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <label htmlFor="symptoms" className="text-sm font-medium text-slate-700">
                            What are you feeling?
                        </label>
                        <Textarea
                            id="symptoms"
                            placeholder="e.g., I have a throbbing headache and my vision is blurry..."
                            className="min-h-[120px] text-lg resize-none focus-visible:ring-primary"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 text-right">
                            {input.length} chars
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {result && (
                        <div className={`p-6 rounded-lg border ${getResultStyle(result.triage_level)} space-y-4 animate-in fade-in slide-in-from-bottom-2`}>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-white/50 p-2 rounded-full shadow-sm">
                                    {getIcon(result.triage_level)}
                                </div>
                                <div className="space-y-2 flex-1">
                                    <h4 className="font-bold text-lg capitalize flex items-center gap-2">
                                        {result.triage_level.replace('_', ' ')}
                                    </h4>
                                    <p className="text-base leading-relaxed font-medium opacity-90">
                                        {result.message}
                                    </p>

                                    {result.matched_symptoms.length > 0 && (
                                        <div className="pt-2">
                                            <span className="text-xs font-semibold uppercase opacity-70 block mb-1">Detected Symptoms:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {result.matched_symptoms.map(s => (
                                                    <span key={s} className="bg-white/60 px-2 py-1 rounded-md text-xs font-mono font-medium">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs opacity-70 text-right border-t border-black/10 pt-3">
                                {result.disclaimer}
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="pt-2 pb-8">
                    <Button
                        size="lg"
                        className="w-full text-base font-semibold shadow-md hover:shadow-lg transition-all"
                        onClick={handleSubmit}
                        disabled={loading || !input.trim()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            'Analyze Symptoms'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </section>
    );
}
