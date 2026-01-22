"use client";
import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { motion } from 'framer-motion';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen text-white font-display bg-[#0a0612]">
            <Sidebar
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            <motion.main
                initial={{ marginLeft: 288 }}
                animate={{ marginLeft: isCollapsed ? 80 : 288 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="min-h-screen p-8 lg:p-12 relative z-10"
            >
                {children}
            </motion.main>

            {/* Mobile Nav Overlay */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 glass px-6 py-4 rounded-full flex items-center gap-8 z-50 shadow-2xl">
                <button className="material-symbols-outlined text-primary">dashboard</button>
                <button className="material-symbols-outlined text-white/50">video_library</button>
                <button className="size-12 rounded-full gradient-btn flex items-center justify-center -mt-12 border-4 border-background-dark shadow-xl text-white">
                    <span className="material-symbols-outlined">add</span>
                </button>
                <button className="material-symbols-outlined text-white/50">monitoring</button>
                <button className="material-symbols-outlined text-white/50">settings</button>
            </div>
        </div>
    );
}
