import prisma from '@/lib/prisma';
import { QueryStream } from '@/components/admin/query-stream';
import { StatsExportButton } from '@/components/admin/export-button';
import {
    Zap, Users, Activity, AlertCircle,
    Clock, TrendingUp, Brain, UserIcon,
    Shield, Terminal, Cpu, Globe
} from 'lucide-react';

async function getAdminData() {
    try {
        const [users, triageEvents] = await Promise.all([
            prisma.user.findMany({
                include: {
                    triageEvents: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.triageEvent.findMany({
                include: {
                    user: true
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        // 1. Core Dynamic Metrics
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const stats = {
            totalUsers: users.length,
            totalQueries: triageEvents.length,
            highUrgencyCount: triageEvents.filter(e => e.urgency === 'High').length,
            velocity1h: triageEvents.filter(e => new Date(e.createdAt) > hourAgo).length,
            active24h: triageEvents.filter(e => new Date(e.createdAt) > dayAgo).length,
        };

        // 2. Clinical Distribution
        const distribution = {
            home: triageEvents.filter(e => e.actionRecommended.toLowerCase().includes('home')).length,
            seek: triageEvents.filter(e => e.actionRecommended.toLowerCase().includes('seek')).length,
            urgent: triageEvents.filter(e => e.actionRecommended.toLowerCase().includes('urgent') || e.actionRecommended.toLowerCase().includes('emergency')).length,
        };

        // 3. Symptom Intelligence
        const symptomCounts: Record<string, number> = {};
        triageEvents.forEach(e => {
            const symptoms = (e.aiResult as any)?.matched_symptoms || [];
            symptoms.forEach((s: string) => {
                const normalized = s.toLowerCase().trim();
                symptomCounts[normalized] = (symptomCounts[normalized] || 0) + 1;
            });
        });
        const topSymptoms = Object.entries(symptomCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6);

        return { users, triageEvents, stats, distribution, topSymptoms };
    } catch (error) {
        console.error("Admin Terminal Data Sync Failure:", error);
        return {
            users: [],
            triageEvents: [],
            stats: { totalUsers: 0, totalQueries: 0, highUrgencyCount: 0, velocity1h: 0, active24h: 0 },
            distribution: { home: 0, seek: 0, urgent: 0 },
            topSymptoms: []
        };
    }
}

export default async function AdminDashboardPage() {
    const { users, triageEvents, stats, distribution, topSymptoms } = await getAdminData();

    const calculatePercentage = (count: number) => {
        if (stats.totalQueries === 0) return 0;
        return Math.round((count / stats.totalQueries) * 100);
    };

    return (
        <div className="flex flex-col min-h-screen pb-20 px-6 md:px-10 max-w-[1600px] mx-auto w-full font-sans">
            {/* Header: Command Center Style */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-12 mb-10 border-b border-white/5">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-1">
                            <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                            <div className="size-2 rounded-full bg-primary/20" />
                        </div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Operational Authority v4.0</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-[0.8] md:text-6xl flex flex-col">
                        <span>Main</span>
                        <span className="text-primary mt-1">Terminal</span>
                    </h1>
                    <p className="text-white/40 text-sm max-w-xl font-medium leading-relaxed">
                        End-to-end clinical intelligence telemetry. Monitoring system-wide triage events and neural engine logic snapshots in real-time.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <StatsExportButton
                        data={triageEvents.map(event => ({
                            id: event.id,
                            timestamp: new Date(event.createdAt).toLocaleString(),
                            user: event.user?.name || 'Anonymous',
                            urgency: event.urgency,
                            symptoms: event.symptoms,
                            recommendation: event.actionRecommended,
                            matched_symptoms: (event.aiResult as any)?.matched_symptoms?.join('; ') || ''
                        }))}
                        filename={`pluto-terminal-audit-${new Date().toISOString().split('T')[0]}`}
                        label="PULL CLOUD DATA"
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest text-white transition-all border border-white/5"
                    />
                    <div className="flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-primary/10 border border-primary/20">
                        <Globe className="size-4 text-primary animate-spin-slow" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest leading-none">Global Health</span>
                            <span className="text-sm font-black text-primary uppercase mt-0.5">Fully Synergized</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* High-Performance Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Registry', value: stats.totalUsers, icon: UserIcon, sub: 'Verified Patients', color: 'text-white' },
                    { label: 'Engine Queries', value: stats.totalQueries, icon: Terminal, sub: 'Processed Logic', color: 'text-white' },
                    { label: 'High Urgency', value: stats.highUrgencyCount, icon: Shield, sub: 'Critical Escalations', color: 'text-red-500' },
                    { label: 'Triage Velocity', value: stats.velocity1h, icon: Cpu, sub: 'Last 60 Minutes', color: 'text-primary' }
                ].map((stat, i) => (
                    <div key={i} className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <div className="size-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                                <stat.icon className="size-5" />
                            </div>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{stat.sub}</span>
                        </div>
                        <div className="space-y-1">
                            <span className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.value}</span>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                <div className="xl:col-span-8 space-y-10">
                    {/* Live Feed Header */}
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="size-3 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Activity className="size-2 animate-pulse" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Live Neural Stream</h3>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-widest">
                            <span>Symmetric Encryption</span>
                            <div className="size-1 rounded-full bg-white/20" />
                            <span>v4.0.2 Stable</span>
                        </div>
                    </div>

                    {/* The Feed */}
                    <div className="rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-8">
                        <QueryStream initialEvents={triageEvents} />
                    </div>
                </div>

                {/* Performance & Distribution Bar */}
                <div className="xl:col-span-4 space-y-8">
                    {/* Clinical Distribution Card */}
                    <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 space-y-10">
                        <div className="space-y-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <TrendingUp className="size-4 text-primary" />
                                Case Distribution
                            </h3>
                            <p className="text-[10px] font-medium text-white/30 lowercase italic">Relative weighting across entire dataset</p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { label: 'Home Protocol', count: distribution.home, color: 'bg-white/20' },
                                { label: 'Clinical Referral', count: distribution.seek, color: 'bg-primary/60' },
                                { label: 'Emergency Override', count: distribution.urgent, color: 'bg-red-500' }
                            ].map((item, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-white uppercase tracking-wider">{item.label}</span>
                                            <span className="text-[10px] font-bold text-white/20 mt-0.5">{item.count} Active Cases</span>
                                        </div>
                                        <span className="text-sm font-black text-white italic">{calculatePercentage(item.count)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                                            style={{ width: `${calculatePercentage(item.count)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Symptom Cluster Leaderboard */}
                    <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 relative overflow-hidden">
                        {/* Decorative Gradient Overlay */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px]" />

                        <div className="relative z-10 space-y-8">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <Brain className="size-4 text-primary" />
                                Neural Clusters
                            </h3>

                            <div className="space-y-2">
                                {topSymptoms.map(([symptom, count], i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-black text-primary/40 group-hover:text-primary transition-colors">0{i + 1}</span>
                                            <span className="text-[13px] font-bold text-white capitalize">{symptom}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-0.5 w-12 bg-white/5 overflow-hidden rounded-full">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${(count / (topSymptoms[0][1] as number)) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-white italic">{count}</span>
                                        </div>
                                    </div>
                                ))}
                                {topSymptoms.length === 0 && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-20">
                                        <Brain className="size-8 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Clusters Found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
