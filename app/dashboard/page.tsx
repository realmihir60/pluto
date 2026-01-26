import { auth, signOut } from '@/auth';
import { handleSignOut } from '@/app/lib/actions';
import { PrismaClient } from '@prisma/client';
import { History, Activity, LogOut, FileText, ArrowRight, Pill, User } from 'lucide-react';
import Link from 'next/link';

const prisma = new PrismaClient();

async function getDashboardData(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            triageEvents: {
                orderBy: { createdAt: 'desc' },
                take: 5
            },
            medicalFacts: {
                orderBy: { createdAt: 'desc' },
                take: 3
            }
        }
    });
    return user;
}

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.email) return null;

    const userData = await getDashboardData(session.user.email);

    return (
        <div className="flex flex-col min-h-screen pt-20 pb-10 px-4 md:px-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        Welcome back, {session.user.name?.split(' ')[0]}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Your secure health vault and triage history.
                    </p>
                </div>
                <Link
                    href="/demo"
                    className="inline-flex w-full md:w-auto items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                    Start New Checkup
                    <ArrowRight className="ml-2 size-4" />
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Left Column: Stats & Facts */}
                <div className="md:col-span-4 space-y-6">
                    {/* Health Profile Card */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/60 dark:bg-black/40 border border-white/20 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    <User className="size-5" />
                                </div>
                                <h2 className="font-semibold text-foreground">My Profile</h2>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-secondary/30 border border-border/50">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium text-foreground">{session.user.email}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-secondary/30 border border-border/50">
                                    <span className="text-muted-foreground">Triage Count</span>
                                    <span className="font-medium text-foreground">{userData?.triageEvents.length || 0}</span>
                                </div>
                            </div>
                            <div className="mt-6">
                                <form action={handleSignOut}>
                                    <button className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-red-500 transition-colors py-2">
                                        <LogOut className="size-3.5" />
                                        Sign Out
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Medical Memory Card */}
                    <div className="rounded-3xl bg-white/60 dark:bg-black/40 border border-white/20 shadow-sm backdrop-blur-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-100/50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                    <Activity className="size-5" />
                                </div>
                                <h2 className="font-semibold text-foreground">Health Memory</h2>
                            </div>
                            <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">Beta</span>
                        </div>

                        {userData?.medicalFacts && userData.medicalFacts.length > 0 ? (
                            <div className="space-y-2">
                                {userData.medicalFacts.map((fact: any) => (
                                    <div key={fact.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/50">
                                        <Pill className="size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{fact.value}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{fact.type}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-sm text-muted-foreground">No medical facts learned yet.</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Chat to build your profile.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="md:col-span-8">
                    <div className="rounded-3xl bg-white/60 dark:bg-black/40 border border-white/20 shadow-sm backdrop-blur-md min-h-[500px] flex flex-col">
                        <div className="p-6 border-b border-border/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-100/50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                                    <History className="size-5" />
                                </div>
                                <h2 className="font-semibold text-foreground">Recent Checkups</h2>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {userData?.triageEvents && userData.triageEvents.length > 0 ? (
                                userData.triageEvents.map((event: any) => (
                                    <Link
                                        key={event.id}
                                        href={`/dashboard/triage/${event.id}`}
                                        className="group flex flex-col sm:flex-row gap-4 p-4 rounded-2xl hover:bg-secondary/40 border border-transparent hover:border-border/50 transition-all cursor-pointer"
                                    >
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex h-2 w-2 rounded-full ${event.urgency === 'High' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                                <p className="font-medium text-foreground text-sm">
                                                    {new Date(event.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-sm text-foreground/90 font-medium line-clamp-1">"{event.symptoms}"</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {(event.aiResult as any)?.summary || (event.aiResult as any)?.message || "No summary available."}
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3 sm:mt-0 sm:border-l sm:border-border/40 sm:pl-4 min-w-[120px]">
                                            <div className="flex flex-col gap-1 w-full">
                                                <span className={`text-xs px-2 py-1 rounded-md text-center font-medium w-full
                                                ${event.urgency === 'High'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                    {event.urgency === 'High' ? 'Consult Doctor' : 'Self Care'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="size-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                                        <FileText className="size-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">No history yet</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                        Your future checkups will appear here. Start a chat to check your symptoms.
                                    </p>
                                    <Link
                                        href="/demo"
                                        className="mt-6 text-sm font-medium text-primary hover:underline"
                                    >
                                        Start your first checkup
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
