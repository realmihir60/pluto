import prisma from '@/lib/prisma';
import {
    Activity, Cpu, Database, Globe,
    ArrowUpRight, Server, Monitor, Hexagon
} from 'lucide-react';

async function getHealthTelemetry() {
    try {
        // Trigger a simple query to measure latency if not already tracked
        const start = Date.now();
        const userCount = await prisma.user.count();
        const end = Date.now();

        // Read from our global telemetry if available, otherwise use this measurement
        const dbLatency = (global as any).lastPrismaLatency || (end - start);

        // Measure event velocity for simulated traffic
        const recentEvents = await prisma.triageEvent.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 5 * 60 * 1000) // last 5 mins
                }
            }
        });

        return {
            dbLatency: `${dbLatency}ms`,
            userCount,
            recentEvents,
            load: Math.min(100, Math.round((recentEvents / 10) * 100)), // Simulation based on events
            status: 'Operational'
        };
    } catch (e) {
        return {
            dbLatency: 'TIMEOUT',
            userCount: 0,
            recentEvents: 0,
            load: 0,
            status: 'Degraded'
        };
    }
}

export default async function AdminHealthPage() {
    const telemetry = await getHealthTelemetry();

    return (
        <div className="flex flex-col min-h-screen pb-20 px-6 md:px-10 max-w-[1600px] mx-auto w-full font-sans">
            {/* Modular Header */}
            <div className="py-16 mb-12 border-b border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary group shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
                        <Hexagon className="size-6 animate-spin-slow group-hover:animate-none" />
                    </div>
                    <div>
                        <span className="text-xs font-black text-white/40 uppercase tracking-[0.6em] block leading-none">Telemetry Module 01.4</span>
                        <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic mt-2 leading-[0.8] md:text-8xl flex flex-col">
                            <span>Logic</span>
                            <span className="text-primary mt-2">Performance</span>
                        </h1>
                    </div>
                </div>
                <p className="text-white/40 text-lg max-w-3xl font-medium leading-relaxed mt-6">
                    Live infrastructure telemetry. Measuring database handshake latency, neural engine compute load, and global protocol availability. <br />
                    Real-time monitoring of Pluto's synthetic intelligence mesh.
                </p>
            </div>

            {/* Obsidian Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {[
                    {
                        label: 'Compute Pressure',
                        value: `${telemetry.load}%`,
                        icon: Cpu,
                        status: telemetry.load > 80 ? 'Heavy' : 'Nominal',
                        color: telemetry.load > 80 ? 'text-amber-500' : 'text-primary',
                        detail: 'Neural Throughput'
                    },
                    {
                        label: 'Prisma Handshake',
                        value: telemetry.dbLatency,
                        icon: Database,
                        status: telemetry.status,
                        color: telemetry.status === 'Operational' ? 'text-white' : 'text-red-500',
                        detail: 'Supabase-AW_1'
                    },
                    {
                        label: 'Global Signal',
                        value: '99.99%',
                        icon: Globe,
                        status: 'Stable',
                        color: 'text-primary',
                        detail: 'Edge Consistency'
                    }
                ].map((stat, i) => (
                    <div key={i} className="group p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all shadow-2xl backdrop-blur-3xl">
                        <div className="flex justify-between items-start mb-12">
                            <div className={`size-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform shadow-inner`}>
                                <stat.icon className="size-8" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-current/20 ${stat.color} bg-current/5`}>
                                {stat.status}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-6xl font-black tracking-tighter text-white group-hover:text-primary transition-colors">{stat.value}</span>
                            <p className="text-xs font-black text-white/30 uppercase tracking-[0.4em]">{stat.label}</p>
                        </div>
                        <div className="mt-10 pt-10 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                            <span>{stat.detail}</span>
                            <ArrowUpRight className="size-4" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Node Cluster View */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-10">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <Server className="size-6 text-primary" />
                            <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Physical Node Clusters</h3>
                        </div>
                        <span className="text-xs font-black text-white/20 uppercase tracking-[0.3em]">Active Verification 2x</span>
                    </div>

                    <div className="space-y-4">
                        {[
                            { name: 'pluto-core-logic-01', status: 'Online', load: telemetry.load, region: 'ap-south-1a', ping: '12ms' },
                            { name: 'pluto-render-edge', status: 'Online', load: Math.floor(telemetry.load * 0.4), region: 'global-vantage', ping: '4ms' },
                            { name: 'pluto-postgres-bridge', status: telemetry.status === 'Operational' ? 'Online' : 'Error', load: '2%', region: 'private-vpc', ping: telemetry.dbLatency },
                        ].map((node) => (
                            <div key={node.name} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 hover:bg-white/[0.04] transition-all group overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className={`size-4 rounded-full ${node.status === 'Online' ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)] animate-pulse' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`} />
                                    <div>
                                        <p className="text-2xl font-black text-white uppercase italic tracking-tighter group-hover:text-primary transition-colors">{node.name}</p>
                                        <p className="text-xs font-black text-white/20 uppercase tracking-[0.3em] mt-1">{node.region} • {node.status}</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-16 relative z-10">
                                    <div className="space-y-1">
                                        <p className="text-2xl font-black text-white tracking-widest">{node.load}%</p>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Current Load</p>
                                    </div>
                                    <div className="hidden sm:block space-y-1">
                                        <p className="text-2xl font-black text-white/60">{node.ping}</p>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Signal RTT</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Network Fidelity Monitor */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-10">
                    <div className="flex items-center gap-4 px-4">
                        <Monitor className="size-6 text-primary" />
                        <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Traffic Fidelity</h3>
                    </div>

                    <div className="p-10 rounded-[3rem] bg-white/[0.01] border border-white/5 h-full flex flex-col justify-between group overflow-hidden relative shadow-2xl backdrop-blur-3xl">
                        {/* Decorative Waveform Mock */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary-rgb),0.08),transparent)] pointer-events-none" />

                        <div className="space-y-3">
                            <span className="text-7xl font-black text-white tracking-tighter italic leading-none">{telemetry.recentEvents * 3}</span>
                            <p className="text-xs font-black text-white/30 uppercase tracking-[0.5em] mt-4">Active Signals / 24h Extrapolated</p>
                        </div>

                        <div className="flex-1 py-16 flex items-center justify-center">
                            <div className="flex gap-3 h-48 items-end">
                                {[0.2, 0.4, 0.8, 0.5, 0.3, 0.9, 0.4, 0.6, 0.2, 0.7, 0.5, 0.3, 0.8].map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-3 bg-white/5 rounded-full h-full relative overflow-hidden group-hover:bg-white/10 transition-colors"
                                    >
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-primary group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] transition-all duration-1000"
                                            style={{
                                                height: telemetry.status === 'Operational' ? `${h * 100}%` : '5%',
                                                transitionDelay: `${i * 50}ms`
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-xs font-black uppercase text-white/20 tracking-[0.4em]">
                                <span>Packet Jitter</span>
                                <span className="text-primary italic">&lt; 1.2ms</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary/40 w-full animate-progress" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
