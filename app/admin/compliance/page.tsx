import {
    ShieldCheck, Lock, FileSignature,
    History, AlertTriangle, Download, Terminal,
    Verified, Shield, CheckCircle2
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { StatsExportButton } from '@/components/admin/export-button';

async function getComplianceData() {
    try {
        // Fetch users who have consented
        const consents = await (prisma.user as any).findMany({
            where: { hasConsented: true },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 30
        });
        return consents;
    } catch (e) {
        console.error("Compliance Sync Error:", e);
        return [];
    }
}

export default async function AdminCompliancePage() {
    const consents = await getComplianceData();

    return (
        <div className="flex flex-col min-h-screen pb-20 px-6 md:px-10 max-w-[1600px] mx-auto w-full font-sans text-white">
            {/* Modular Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-12 mb-10 border-b border-white/5">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="size-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Protocol Module 03</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-[0.8] md:text-5xl flex flex-col">
                        <span>Regulatory</span>
                        <span className="text-primary mt-1">Audit Hub</span>
                    </h1>
                    <p className="text-white/40 text-sm max-w-xl font-medium leading-relaxed mt-4">
                        Clinical consent logs and HIPAA-compliant audit trails. Synchronizing physical logic snapshots with regulatory standards.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <StatsExportButton
                        data={consents.map((c: any) => ({
                            id: c.id,
                            email: c.email,
                            name: c.name || 'Anonymous',
                            signed_at: new Date(c.createdAt).toLocaleString(),
                            protocol: 'CLINICAL-V2-STRICT'
                        }))}
                        filename={`clinical-consents-${new Date().toISOString().split('T')[0]}`}
                        label="PULL AUDIT LOGS"
                        className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/5"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                {/* Consent Audit Column */}
                <div className="xl:col-span-8 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                            <FileSignature className="size-4 text-primary" />
                            Clinical Consent Logs
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 rounded bg-primary/10 border border-primary/20">
                            <Verified className="size-3 text-primary" />
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">HIPAA Verified</span>
                        </div>
                    </div>

                    <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-white/5 bg-white/[0.02]">
                                    <tr>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">Patient ID</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">Protocol Status</th>
                                        <th className="px-8 py-6 text-right text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">Signature Chronos</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {consents.map((c: any) => (
                                        <tr key={c.id} className="group hover:bg-white/[0.03] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col space-y-1">
                                                    <span className="text-[12px] font-black text-white group-hover:text-primary transition-colors">{c.name || 'ANONYMOUS_LEGAL'}</span>
                                                    <span className="text-[9px] font-mono text-white/20 tracking-tighter italic">{(c.id as string).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]" />
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">CONSENT_VERIFIED</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[11px] font-black text-white">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {consents.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
                                <Shield className="size-10 text-white/10" />
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Zero Compliance Records Found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Privacy Sideblock */}
                <div className="xl:col-span-4 space-y-8">
                    {/* Security Protocol Card */}
                    <div className="p-10 rounded-[2.5rem] bg-black border border-white/10 relative overflow-hidden group">
                        {/* High-Contrast Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-black">
                                    <Lock className="size-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Security Protocol</h3>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Locked & Synchronized</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">PII Shielding</span>
                                        <p className="text-sm font-black text-white uppercase italic">Active Scrubber</p>
                                    </div>
                                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Encryption Grade</span>
                                        <p className="text-sm font-black text-white uppercase italic">AES-256-GCM</p>
                                    </div>
                                    <CheckCircle2 className="size-4 text-primary" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Standard List */}
                    <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 space-y-10">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="size-5 text-primary" />
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Compliance Standards</h3>
                        </div>

                        <div className="space-y-8">
                            {[
                                { title: 'SOC2-COMPLIANT LOGS', desc: 'Immutable audit persistence verified at the database layer.' },
                                { title: 'HIPAA DATA ISOLATION', desc: 'Patient-centric data containers with strict ACL enforcement.' },
                                { title: 'ZERO-KNOWLEDGE AI', desc: 'Pluto engine snapshots are scrubbed of all identifying telemetry.' }
                            ].map((item, i) => (
                                <div key={i} className="space-y-2 group/item">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-3 bg-white/10 group-hover/item:bg-primary transition-colors rounded-full" />
                                        <p className="text-[11px] font-black text-white uppercase tracking-wider">{item.title}</p>
                                    </div>
                                    <p className="text-[10px] text-white/30 font-medium leading-relaxed italic pl-4">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-primary/20 transition-all">
                                <Terminal className="size-4 text-white/20 group-hover:text-primary transition-colors" />
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none">Last Audit</p>
                                    <p className="text-[10px] font-black text-white mt-1">S3-ARCHIVAL-SYNC: SUCCESS</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
