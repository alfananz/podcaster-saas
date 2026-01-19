"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <h2 className="text-4xl font-black tracking-tight mb-2">Settings</h2>
                    <p className="text-slate-500 dark:text-primary/60 text-lg">Manage your personal intelligence, security, and billing preferences.</p>
                </div>

                <div className="flex flex-col gap-12">
                    <section className="glass-panel rounded-xl overflow-hidden bg-white/5 dark:bg-glass p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="material-symbols-outlined text-primary">psychology</span>
                            <h3 className="text-2xl font-bold">Personal Intelligence</h3>
                        </div>

                        <div className="flex flex-col md:flex-row gap-10 items-start">
                            <div className="flex flex-col items-center gap-4 min-w-[160px]">
                                <div className="size-32 rounded-full border-2 border-dashed border-primary/40 p-1">
                                    <div
                                        className="w-full h-full rounded-full bg-cover bg-center"
                                        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAOuW1Wn_LlzaGSAXddGGtcpg4aAoV8WgJ3mbnQWdvGmgKG_4LkXmlM8J16Pv2KgKeYRRuzax2P7305iOvsWW4uyno5VMtK7LI2uRCQJJpglpraYGOUoKBN0pMtBDZd0RP7EYXJef_UWIrbFKMT04YzEtxA0_u5Hp_CsRSrXSxrX3mLOojpYu-zjDpq3BAYONVPEv69LWEP-PzuK2ku2d-DuV1ECrjp9K-YnXyhCQGzHH6sxm1vr7qo66z2WmSy_NBDdhQDqnaJg-Pg')" }}
                                    ></div>
                                </div>
                                <button className="text-xs font-bold text-primary uppercase tracking-widest hover:underline cursor-pointer">Change Photo</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium opacity-70">Full Name</label>
                                    <input className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary outline-none" type="text" defaultValue="Alexander Aurora" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium opacity-70">Email Address</label>
                                    <input className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary outline-none" type="email" defaultValue="alex@mellostudio.io" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium opacity-70">Timezone</label>
                                    <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                                        <option>Pacific Standard Time (PST)</option>
                                        <option>Eastern Standard Time (EST)</option>
                                        <option>Greenwich Mean Time (GMT)</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium opacity-70">Location</label>
                                    <input className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary outline-none" type="text" defaultValue="San Francisco, CA" />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-sm font-medium opacity-70">Bio</label>
                                    <textarea className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary outline-none resize-none" rows={3} defaultValue="Creative Director at Mello Studio. Obsessed with glassmorphism and aurora aesthetics."></textarea>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="glass-panel rounded-xl bg-white/5 dark:bg-glass p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="material-symbols-outlined text-primary">encrypted</span>
                            <h3 className="text-2xl font-bold">Security & Access</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium opacity-70">Current Password</label>
                                    <input className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary outline-none" placeholder="••••••••••••" type="password" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium opacity-70">New Password</label>
                                    <input className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary outline-none" placeholder="Min. 12 characters" type="password" />
                                </div>
                            </div>

                            <div className="bg-primary/5 rounded-xl p-6 border border-primary/20 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold">Two-Factor Auth</h4>
                                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] uppercase font-black rounded">Recommended</span>
                                    </div>
                                    <p className="text-sm opacity-70 leading-relaxed">Add an extra layer of security to your account by requiring more than just a password to log in.</p>
                                </div>
                                <div className="flex items-center justify-between mt-6">
                                    <span className="text-sm font-medium">Status: <span className="text-primary">Enabled</span></span>
                                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                                        <div className="absolute right-1 top-1 size-4 bg-white rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="glowing-border">
                        <section className="glowing-border-inner p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">database</span>
                                    <h3 className="text-2xl font-bold text-white">Plan & Storage</h3>
                                </div>
                                <button className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg text-sm hover:brightness-110 transition-all cursor-pointer">Upgrade Plan</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-slate-400 text-sm mb-1 uppercase tracking-widest font-bold">Current Usage</p>
                                            <h4 className="text-3xl font-bold text-white">1.2 TB <span className="text-lg font-normal opacity-40">/ 2 TB</span></h4>
                                        </div>
                                        <p className="text-primary text-sm font-bold">60% Used</p>
                                    </div>
                                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(255,51,153,0.5)]" style={{ width: "60%" }}></div>
                                    </div>
                                    <p className="text-xs text-slate-400 italic">Next billing cycle: Oct 12, 2024</p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-center">
                                    <p className="text-xs text-primary font-bold uppercase mb-2">Active Plan</p>
                                    <p className="text-xl font-bold text-white mb-1">Aurora Pro</p>
                                    <p className="text-sm text-slate-400">$29.00 / month</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="w-full mt-4 mb-12">
                        <div className="glass-panel bg-white/10 dark:bg-glass/80 rounded-2xl p-4 flex items-center justify-between border border-white/20">
                            <div className="flex items-center gap-4 px-4 text-sm font-medium opacity-60">
                                <span className="material-symbols-outlined text-lg">info</span>
                                <p>Unsaved changes detected</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors cursor-pointer">Discard</button>
                                <button className="bg-primary hover:brightness-110 text-background-dark px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer">
                                    <span className="material-symbols-outlined text-lg">check</span>
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
