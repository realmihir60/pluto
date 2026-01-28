'use client';

import { Users, Mail, Calendar, Shield, Trash2, UserPlus } from 'lucide-react';
import { StatsExportButton } from '@/components/admin/export-button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: string, userEmail: string) => {
        if (!confirm(`Delete user ${userEmail}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/delete-user?id=${userId}`, {
                method: 'POST',
            });

            if (response.ok) {
                await fetchUsers();
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting user');
        }
    };

    const [showAddModal, setShowAddModal] = useState(false);
    const [newData, setNewData] = useState({ name: '', email: '', password: '', isAdmin: false });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/add-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData),
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewData({ name: '', email: '', password: '', isAdmin: false });
                await fetchUsers();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to add user');
            }
        } catch (error) {
            alert('Error adding user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalUsers = users.length;
    const consentedUsers = users.filter(u => u.hasConsented).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen pb-20 px-6 md:px-10 max-w-[1600px] mx-auto w-full font-sans text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-16 mb-12 border-b border-white/5">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-1">
                            <div className="size-3 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]" />
                            <div className="size-3 rounded-full bg-primary/20" />
                        </div>
                        <span className="text-xs font-black text-white/40 uppercase tracking-[0.6em]">Registry Module 04.2</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-[0.7] md:text-8xl flex flex-col">
                        <span>User</span>
                        <span className="text-primary mt-2">Registry</span>
                    </h1>
                    <p className="text-white/40 text-lg max-w-2xl font-medium leading-relaxed mt-6">
                        Distributed identity management for all authenticated platform entities. <br className="hidden md:block" />
                        Full lifecycle control over user certificates and telemetry.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-8 px-8 py-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-2xl">
                        <div className="space-y-2">
                            <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Total Nodes</p>
                            <p className="text-4xl font-black text-white tracking-tighter">{totalUsers}</p>
                        </div>
                        <div className="w-px h-14 bg-white/10" />
                        <div className="space-y-2">
                            <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Verified</p>
                            <p className="text-4xl font-black text-primary tracking-tighter">{consentedUsers}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-primary text-black text-xs font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]"
                        >
                            <UserPlus className="size-5" />
                            Provision Node
                        </button>

                        <StatsExportButton
                            data={users.map((u: any) => ({
                                id: u.id,
                                email: u.email,
                                name: u.name || 'Anonymous',
                                consented: u.hasConsented ? 'YES' : 'NO',
                                joined: new Date(u.createdAt).toLocaleString(),
                            }))}
                            filename={`pluto-users-${new Date().toISOString().split('T')[0]}`}
                            label="EXPORT LOGS"
                            className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-[0.2em] text-white transition-all border border-white/10"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] italic flex items-center gap-4">
                        <Users className="size-6 text-primary" />
                        Neural Identity Stream
                    </h3>
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                        <Shield className="size-4 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Operational Security Level A</span>
                    </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl shadow-2xl relative">
                    {/* Abstract UI Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left">
                            <thead className="border-b border-white/10 bg-white/[0.04]">
                                <tr>
                                    <th className="px-10 py-8 text-sm font-black uppercase text-white/50 tracking-[0.4em]">Node Identity</th>
                                    <th className="px-10 py-8 text-sm font-black uppercase text-white/50 tracking-[0.4em]">Encryption / Email</th>
                                    <th className="px-10 py-8 text-sm font-black uppercase text-white/50 tracking-[0.4em]">Auth Status</th>
                                    <th className="px-10 py-8 text-right text-sm font-black uppercase text-white/50 tracking-[0.4em]">Timestamp</th>
                                    <th className="px-10 py-8 text-right text-sm font-black uppercase text-white/50 tracking-[0.4em]">Admin Commands</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {users.map((user: any) => (
                                    <tr key={user.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                        <td className="px-10 py-10">
                                            <div className="flex flex-col space-y-2">
                                                <span className="text-2xl font-black text-white group-hover:text-primary transition-colors tracking-tighter uppercase italic">
                                                    {user.name || 'ANON_ENTITY'}
                                                </span>
                                                <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                                                    UID: {user.id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-10">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary/30 transition-colors">
                                                    <Mail className="size-5 text-primary/60 group-hover:text-primary transition-colors" />
                                                </div>
                                                <span className="text-lg font-bold text-white/90 group-hover:text-white transition-colors tracking-tight">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-10">
                                            {user.hasConsented ? (
                                                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20">
                                                    <div className="size-2.5 rounded-full bg-primary animate-pulse" />
                                                    <span className="text-xs font-black text-primary uppercase tracking-[0.2em] italic">Access Verified</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10">
                                                    <div className="size-2.5 rounded-full bg-white/20" />
                                                    <span className="text-xs font-black text-white/30 uppercase tracking-[0.2em] italic">Pending Validation</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-10 text-right">
                                            <div className="flex flex-col items-end space-y-1">
                                                <span className="text-lg font-black text-white tracking-widest">
                                                    {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">
                                                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-10 text-right">
                                            <button
                                                onClick={() => handleDelete(user.id, user.email)}
                                                className="p-4 rounded-2xl bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/40 text-red-500/50 hover:text-red-400 transition-all group/btn"
                                            >
                                                <Trash2 className="size-6 group-hover/btn:scale-110 group-hover/btn:rotate-6 transition-all" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {users.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-60 text-center space-y-6">
                            <div className="p-8 rounded-full bg-white/5 animate-pulse">
                                <Users className="size-16 text-white/10" />
                            </div>
                            <p className="text-sm font-black text-white/20 uppercase tracking-[0.6em]">Neural Database Empty</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/60">
                    <div className="w-full max-w-xl bg-[#141a21] border border-white/10 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />

                        <div className="mb-10 text-center">
                            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white mb-2">Provision New Node</h2>
                            <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Internal Entity Creation Protocol</p>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-8">
                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-4">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newData.name}
                                        onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-lg focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-white/10"
                                        placeholder="Enter entity name..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-4">Email Certificate</label>
                                    <input
                                        type="email"
                                        required
                                        value={newData.email}
                                        onChange={(e) => setNewData({ ...newData, email: e.target.value })}
                                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-lg focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-white/10"
                                        placeholder="entity@pluto.protocol"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-4">Access Key (Password)</label>
                                    <input
                                        type="password"
                                        required
                                        value={newData.password}
                                        onChange={(e) => setNewData({ ...newData, password: e.target.value })}
                                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-lg focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-white/10"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                    <input
                                        type="checkbox"
                                        id="isAdmin"
                                        checked={newData.isAdmin}
                                        onChange={(e) => setNewData({ ...newData, isAdmin: e.target.checked })}
                                        className="size-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="isAdmin" className="text-xs font-black uppercase text-white/60 tracking-widest cursor-pointer">Elevate to Authority (Admin)</label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 h-16 rounded-2xl border border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 h-16 rounded-2xl bg-primary text-black text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Synchronizing...' : 'Execute Protocol'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
