'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ServerOff, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0f1419] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Critical Error Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 max-w-md w-full p-1 rounded-[2.5rem] bg-gradient-to-b from-red-500/20 to-transparent">
                <div className="bg-[#161b22] rounded-[2.4rem] p-10 border border-red-500/20 shadow-[0_0_50px_-10px_rgba(220,38,38,0.3)] text-center backdrop-blur-3xl">
                    <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 relative group">
                        <ServerOff className="size-8 relative z-10" />
                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-3">
                        Telemetry <span className="text-red-500">Lost</span>
                    </h2>

                    <div className="space-y-4 mb-10">
                        <p className="text-white/60 text-xs font-medium leading-relaxed">
                            The secure uplink to the Pluto Clinical Kernel has been severed. This is likely a database timeout or network partition.
                        </p>
                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                            <code className="text-[10px] text-red-400 font-mono break-all">
                                {error.message || "ERR_CONNECTION_REFUSED_0x99"}
                            </code>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => reset()}
                            className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group"
                        >
                            <RefreshCw className="size-3 group-hover:rotate-180 transition-transform duration-500" />
                            Reinitialize Handshake
                        </button>
                        <Link
                            href="/"
                            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                        >
                            Return to Safe Mode
                        </Link>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                    <ShieldAlert className="size-3 text-red-500" />
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">System Halted</span>
                </div>
            </div>
        </div>
    );
}
