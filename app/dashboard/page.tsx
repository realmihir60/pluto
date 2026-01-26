import { auth, signOut } from '@/auth';

export default async function DashboardPage() {
    const session = await auth();

    return (
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-slate-950 text-white">
            <div className="w-full flex-none md:w-64">
                {/* Sidebar placeholder */}
                <div className="flex h-full flex-col px-3 py-4 md:px-2">
                    <div className="mb-2 flex h-20 items-end justify-start rounded-md bg-blue-600 p-4 md:h-40">
                        <div className="w-32 text-white md:w-40">
                            <h1 className="text-2xl font-bold">Pluto Vault</h1>
                        </div>
                    </div>
                    <div className="flex grow justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">

                        <form
                            action={async () => {
                                'use server';
                                await signOut();
                            }}
                        >
                            <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-slate-900 p-3 text-sm font-medium hover:bg-slate-800 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
                                <div className="hidden md:block">Sign Out</div>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div className="flex-grow p-6 md:overflow-y-auto md:p-12">
                <h1 className="text-3xl font-bold mb-8">Welcome back, {session?.user?.name}</h1>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Health Memory Card */}
                    <div className="rounded-xl bg-slate-900 p-6 shadow-sm ring-1 ring-slate-800">
                        <h3 className="text-lg font-medium">Memory Engine</h3>
                        <p className="mt-2 text-sm text-slate-400">
                            0 Active Medical Facts learned.
                        </p>
                    </div>

                    {/* Past Triage Card */}
                    <div className="rounded-xl bg-slate-900 p-6 shadow-sm ring-1 ring-slate-800">
                        <h3 className="text-lg font-medium">Recent Activity</h3>
                        <p className="mt-2 text-sm text-slate-400">
                            No past triage reports found.
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <a href="/demo" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-center text-base font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900">
                        Start New Triage
                    </a>
                </div>
            </div>
        </div>
    );
}
