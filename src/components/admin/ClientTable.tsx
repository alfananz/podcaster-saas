"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import AddClientModal from "./AddClientModal";

interface ClientTableProps {
    token: string | null;
}

export default function ClientTable({ token }: ClientTableProps) {
    const clients = useQuery(api.clients.listClientsWithStats, token ? { token } : "skip");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock stats for the dashboard cards
    const totalClients = clients?.length || 0;
    const activeProjects = clients?.reduce((acc: any, curr: any) => acc + (curr.episodeCount || 0), 0) || 0;

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <div className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-1">Database V1.0</div>
                    <h1 className="text-4xl font-bold text-white mb-2">Client Roster</h1>
                    <p className="text-gray-400">Managing {totalClients} high-fidelity podcast partners.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1a232e] border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-lg transition-all text-sm font-medium">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span>Export List</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg shadow-lg shadow-pink-900/20 transition-all text-sm font-bold"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span>Add New Client</span>
                    </button>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#131b24] border border-pink-500/10 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-[64px] text-pink-500">group</span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Clients</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{totalClients}</span>
                        <span className="text-xs font-bold text-green-400">~12%</span>
                    </div>
                </div>

                <div className="bg-[#131b24] border border-blue-500/10 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-[64px] text-blue-500">cloud</span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Storage Used</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">64%</span>
                        <span className="text-xs font-bold text-green-400">~5.2TB</span>
                    </div>
                </div>

                <div className="bg-[#131b24] border border-purple-500/10 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-[64px] text-purple-500">movie</span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Projects</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{activeProjects}</span>
                        <span className="text-xs font-bold text-pink-500 flex items-center gap-1">
                            ⚡ Priority
                        </span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#131b24] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#0f171f] border-b border-white/5">
                                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Identity</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Project Type</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Storage</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Activity</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {clients === undefined ? (
                                // Loading Skeleton
                                [1, 2, 3].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-4 px-6"><div className="h-10 w-40 bg-white/5 rounded-lg"></div></td>
                                        <td className="py-4 px-6"><div className="h-6 w-20 bg-white/5 rounded-full"></div></td>
                                        <td className="py-4 px-6"><div className="h-2 w-32 bg-white/5 rounded-full"></div></td>
                                        <td className="py-4 px-6"><div className="h-2 w-20 bg-white/5 rounded-full"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 w-24 bg-white/5 rounded"></div></td>
                                        <td className="py-4 px-6"></td>
                                    </tr>
                                ))
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500">
                                        No clients found. Invite your first client above.
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client: any) => (
                                    <tr key={client._id} className="hover:bg-[#1a232e]/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={client.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${client.name}`}
                                                    alt={client.name}
                                                    className="w-10 h-10 rounded-xl bg-white/5 object-cover border border-white/10"
                                                />
                                                <div>
                                                    <div className="font-bold text-white text-sm">{client.name}</div>
                                                    <div className="text-xs text-gray-500">{client.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 font-medium">
                                                Podcast Series
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[60%]"></div>
                                                </div>
                                                <span className="text-xs text-gray-400 font-mono">60%</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                                <span className="text-xs font-bold text-gray-300">Active</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs text-gray-500">2 hours ago</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100">
                                                <span className="material-symbols-outlined text-[16px]">more_vert</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="py-4 px-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                    <div>Showing {clients?.length || 0} clients</div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-pink-600 text-white rounded shadow-lg shadow-pink-900/40">1</button>
                        <button className="px-3 py-1 hover:bg-white/5 rounded transition-colors">2</button>
                        <button className="px-3 py-1 hover:bg-white/5 rounded transition-colors">3</button>
                    </div>
                </div>
            </div>

            <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
