
"use client";

import React, { useState, useMemo } from 'react';
import {
    Activity, Search, Filter, Calendar, Clock, User as UserIcon, ArrowRight, Zap
} from 'lucide-react';

interface QueryStreamProps {
    initialEvents: any[];
}

export function QueryStream({ initialEvents }: QueryStreamProps) {
    const [search, setSearch] = useState('');
    const [filterUrgency, setFilterUrgency] = useState<string | null>(null);

    const filteredEvents = useMemo(() => {
        return initialEvents.filter(event => {
            const matchesSearch = (event.symptoms || '').toLowerCase().includes(search.toLowerCase()) ||
                (event.aiResult as any)?.matched_symptoms?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));

            const matchesUrgency = filterUrgency ? event.urgency === filterUrgency : true;

            return matchesSearch && matchesUrgency;
        });
    }, [initialEvents, search, filterUrgency]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] animate-pulse" />
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">Neural Signal Stream</h2>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/20 transition-colors group-focus-within:text-primary" />
                        <input
                            type="text"
                            placeholder="FILTER SYMPTOMS..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/[0.08] transition-all w-full sm:w-56 text-white placeholder:text-white/10"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
                        {['High', 'Routine'].map((u) => (
                            <button
                                key={u}
                                onClick={() => setFilterUrgency(filterUrgency === u ? null : u)}
                                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterUrgency === u
                                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]'
                                    : 'text-white/30 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {u}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredEvents.map((event) => (
                    <div key={event.id} className="group relative p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 transition-all hover:bg-white/[0.03] hover:border-white/10 overflow-hidden">
                        {/* Status Bar */}
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-transparent group-hover:bg-primary/20 transition-all" />

                        <div className="flex flex-col md:flex-row gap-8 justify-between">
                            <div className="space-y-5 flex-1">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className={`px-3 py-1 rounded flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${event.urgency === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                        <Zap className="size-2.5" />
                                        {event.urgency} SIGNAL
                                    </div>
                                    <div className="h-4 w-px bg-white/5 hidden sm:block" />
                                    <div className="flex items-center gap-4 text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-3" />
                                            {new Date(event.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="size-3" />
                                            {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="h-4 w-px bg-white/5 hidden sm:block" />
                                    <div className="flex items-center gap-2 text-[10px] text-white/40 font-black uppercase tracking-widest">
                                        <UserIcon className="size-3" />
                                        {event.user?.name || 'GENERIC_USER'}
                                    </div>
                                </div>

                                <blockquote className="text-xl font-bold text-white leading-tight tracking-tight selection:bg-primary/40">
                                    "{event.symptoms}"
                                </blockquote>

                                <div className="flex gap-2 flex-wrap pt-2">
                                    {((event.aiResult as any)?.matched_symptoms || []).map((sym: string, i: number) => (
                                        <span key={i} className="text-[9px] font-black bg-white/5 text-white/60 px-4 py-1.5 rounded-full border border-white/5 uppercase tracking-widest group-hover:border-primary/20 transition-colors">
                                            CLUSTER: {sym}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="md:border-l border-white/5 md:pl-8 flex flex-col justify-center min-w-[240px]">
                                <span className="text-[9px] font-black uppercase text-white/20 mb-3 tracking-[0.3em]">Engine Recommendation</span>
                                <div className={`text-base font-black leading-[1.1] mb-4 uppercase italic tracking-tighter ${event.actionRecommended.toLowerCase().includes('urgent') || event.actionRecommended.toLowerCase().includes('emergency') ? 'text-red-500' : 'text-primary'}`}>
                                    {event.actionRecommended}
                                </div>
                                <button className="flex items-center gap-2 text-[10px] font-black text-white/30 hover:text-white transition-all uppercase tracking-widest group/btn">
                                    Deep Audit <ArrowRight className="size-3 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredEvents.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 text-center">
                        <div className="size-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 relative">
                            <Activity className="size-10 text-white/10" />
                            <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.5em]">Zero Signals</h3>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest mt-4 font-bold">
                            No telemetry matches active filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
