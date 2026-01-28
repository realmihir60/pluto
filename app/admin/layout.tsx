'use client';

import {
    LayoutDashboard, Activity, Brain, ShieldCheck,
    ArrowLeft, Settings, Cpu, Users,
    Menu, X
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex min-h-screen bg-[#0f1419] text-[#ededed] font-sans selection:bg-primary/30 selection:text-white overflow-hidden">
            {/* Unified Fixed Header */}
            <header className="fixed top-0 left-0 right-0 h-24 bg-[#1a1f26]/80 backdrop-blur-3xl border-b border-white/5 z-[150] px-8 md:px-12 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-6">
                    <button
                        onClick={toggleSidebar}
                        className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-white transition-all active:scale-95 group"
                    >
                        {isSidebarOpen ? (
                            <X className="size-6 group-hover:rotate-90 transition-transform" />
                        ) : (
                            <Menu className="size-6 group-hover:scale-110 transition-transform" />
                        )}
                    </button>

                    <Link href="/admin" className="flex items-center gap-4 group">
                        <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-black font-black text-xl italic shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all group-hover:scale-105 group-hover:rotate-3">
                            P
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-2xl tracking-tighter text-white leading-none uppercase italic">Pluto</span>
                            <span className="text-[10px] text-white/30 font-black tracking-[0.4em] uppercase mt-1">Intelligence</span>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Logic Node</span>
                        <span className="text-sm font-bold text-primary group-hover:text-white transition-colors tracking-tight italic flex items-center gap-2">
                            ap-south-primary
                            <div className="size-2 rounded-full bg-primary animate-pulse" />
                        </span>
                    </div>
                </div>
            </header>

            {/* Slide-Over Admin Sidebar */}
            <>
                {/* Backdrop overlay */}
                <div
                    className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[180] transition-all duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    onClick={toggleSidebar}
                />

                <aside
                    className={`fixed left-0 top-0 bottom-0 w-[380px] bg-[#1a1f26] border-r border-white/10 z-[200] flex flex-col shadow-[25px_0_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}
                >
                    <div className="p-10 pb-12 flex justify-between items-center bg-white/[0.02] border-b border-white/5">
                        <Link href="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-4 group">
                            <div className="size-14 rounded-2xl bg-white flex items-center justify-center text-black font-black text-2xl italic">
                                P
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-2xl tracking-tighter text-white leading-none uppercase italic">Pluto</span>
                                <span className="text-[11px] text-white/30 font-black tracking-[0.4em] uppercase mt-2">Intelligence</span>
                            </div>
                        </Link>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 group active:scale-95 transition-all outline-none"
                        >
                            <X className="size-6 text-white/40 group-hover:text-white" />
                        </button>
                    </div>

                    <nav className="flex-1 px-8 pt-10 space-y-3 overflow-y-auto custom-scrollbar">
                        <p className="px-5 py-2 text-[10px] font-black uppercase text-white/20 tracking-[0.5em] mb-4">Tactical Interfaces</p>

                        {[
                            { name: 'Terminal Dashboard', href: '/admin', icon: LayoutDashboard },
                            { name: 'Telemetry Streams', href: '/admin/health', icon: Activity },
                            { name: 'Neural Connectivity', href: '/admin/intelligence', icon: Brain },
                            { name: 'Entity Registry', href: '/admin/users', icon: Users },
                            { name: 'Security Audit', href: '/admin/compliance', icon: ShieldCheck },
                        ].map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className="flex items-center gap-5 px-6 py-5 rounded-2xl text-[15px] font-black text-white/40 hover:bg-white/5 hover:text-white transition-all group border border-transparent hover:border-white/10 relative overflow-hidden"
                            >
                                <item.icon className="size-5 transition-all group-hover:text-primary group-hover:scale-110 relative z-10" />
                                <span className="relative z-10 uppercase italic tracking-tight">{item.name}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        ))}

                        <div className="pt-16 space-y-3">
                            <p className="px-5 py-2 text-[10px] font-black uppercase text-white/20 tracking-[0.5em] mb-4">Console Management</p>
                            <Link href="/dashboard" className="flex items-center gap-5 px-6 py-5 rounded-2xl text-[15px] font-black text-white/40 hover:bg-white/5 hover:text-white transition-all border border-transparent hover:border-white/10 group">
                                <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-2" />
                                <span className="uppercase italic tracking-tight text-white/60 group-hover:text-white">Exit Console</span>
                            </Link>
                            <button className="w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-[15px] font-black text-white/40 hover:bg-white/5 hover:text-white transition-all text-left border border-transparent hover:border-white/10 group outline-none">
                                <Settings className="size-5 transition-transform group-hover:rotate-90" />
                                <span className="uppercase italic tracking-tight">System Params</span>
                            </button>
                        </div>
                    </nav>

                    <div className="p-8 bg-white/[0.02] border-t border-white/5">
                        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Cpu className="size-4 text-primary/60" />
                                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Auth Protocol</span>
                                </div>
                                <div className="size-2 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.6)] animate-pulse" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-black text-white italic tracking-tighter">SECURED_V4</span>
                                <span className="text-[9px] font-mono text-primary tracking-widest bg-primary/10 px-2 py-0.5 rounded">CONNECTED</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </>

            {/* Main Content Area */}
            <main className="flex-1 w-full relative overflow-x-hidden min-h-screen">
                <div className="w-full min-h-screen bg-[#0f1419] relative">
                    {/* Refined Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

                    <div className="relative z-10 pt-24">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
