import { Hexagon, Loader2 } from 'lucide-react';

export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-[#0f1419] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Hexagon className="size-8 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                </div>

                <div className="text-center space-y-2">
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-lg animate-pulse">Initializing Telemetry</h3>
                    <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Secure Handshake in progress...</p>
                </div>

                <div className="flex gap-1 h-1 w-24 mx-auto mt-4">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-full flex-1 bg-white/10 rounded-full overflow-hidden"
                        >
                            <div
                                className="h-full bg-primary w-full animate-[shimmer_1s_infinite]"
                                style={{ animationDelay: `${i * 100}ms` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
