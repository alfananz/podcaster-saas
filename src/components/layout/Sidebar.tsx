"use client";
import Link from 'next/link';
import { usePathname, useRouter } from "next/navigation";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useModal } from '@/context/ModalContext';
import { useUserRole } from '@/hooks/useUserRole';


function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { openModal } = useModal();
    const { isAdmin, user, isLoading, isClient } = useUserRole();




    const links = [
        { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
        { href: "/episodes", label: "Episodes", icon: "video_library" },
        // Conditional Revisions link
        ...(isAdmin ? [
            { href: "/revisions", label: "Revisions", icon: "history_edu" },
            { href: "/admin/clients", label: "Clients", icon: "group" }
        ] : []),
        //   { href: "/media", label: "Media Library", icon: "folder_open" },
        //  { href: "#", label: "Analytics", icon: "monitoring" },
    ];

    return (
        <motion.aside
            initial={{ width: 288 }}
            animate={{ width: isCollapsed ? 80 : 288 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full glass z-50 flex flex-col pt-6 pb-6 hidden lg:flex overflow-hidden border-r border-white/5"
        >
            {/* Toggle Button */}
            <button
                onClick={toggleCollapse}
                className="absolute top-6 right-[-12px] w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-colors z-50 border border-white/10"
                style={{ right: isCollapsed ? '28px' : '24px' }} // Adjust position based on state if needed, or keep simpler
            >
                <span className={`material-symbols-outlined text-[14px] text-white/60 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
                    chevron_left
                </span>
            </button>

            <div className={`flex items-center gap-3 mb-10 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-mello-blue flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                    <span className="material-symbols-outlined text-white">music_video</span>
                </div>

                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="whitespace-nowrap"
                        >
                            <h1 className="text-xl font-bold tracking-tight">Mello Studio</h1>
                            <p className="text-xs text-primary font-medium tracking-widest uppercase">Creator Pro</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <nav className="flex-1 space-y-2 px-4">
                {links.map((link) => {
                    const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

                    return (
                        <Link
                            key={link.label}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-4 py-3 rounded-2xl transition-all group overflow-hidden relative",
                                isCollapsed ? "justify-center px-0" : "px-4",
                                isActive
                                    ? "bg-white/10 text-white border border-white/5"
                                    : "text-white/50 hover:bg-white/5 hover:text-white"
                            )}
                            title={isCollapsed ? link.label : undefined}
                        >
                            <span className={cn(
                                "material-symbols-outlined transition-colors shrink-0",
                                isActive ? "text-primary" : "group-hover:text-white"
                            )}>
                                {link.icon}
                            </span>

                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="font-medium whitespace-nowrap"
                                >
                                    {link.label}
                                </motion.span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className={`mt-auto pt-6 space-y-4 px-4`}>

                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white/5 rounded-3xl p-4 border border-white/5"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-white/60">Storage used</p>
                            <p className="text-xs font-bold">82%</p>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '82%' }}></div>
                        </div>
                    </motion.div>
                )}

                <button
                    onClick={() => openModal()}
                    className={cn(
                        "w-full rounded-3xl gradient-btn font-bold text-sm tracking-wide shadow-xl shadow-primary/30 active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2",
                        isCollapsed ? "aspect-square p-0" : "py-4"
                    )}
                    title={isCollapsed ? "New Episode" : undefined}
                >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    {!isCollapsed && <span className="whitespace-nowrap">New Episode</span>}
                </button>

                <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center flex-col px-0" : "px-2")}>
                    <Link href="/settings" className="size-10 rounded-full border-2 border-primary/40 p-0.5 cursor-pointer block hover:border-primary transition-colors shrink-0">
                        <img
                            className="w-full h-full rounded-full object-cover"
                            src={user?.image || "https://ui-avatars.com/api/?name=User&background=random"}
                            alt="User profile"
                        />
                    </Link>

                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <p className="text-sm font-bold truncate">{user?.name || "Guest"}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-tighter truncate">{user?.role || "Visitor"}</p>
                        </motion.div>
                    )}

                    {!isCollapsed && (
                        <button className="ml-auto text-white/40 hover:text-white cursor-pointer">
                            <span className="material-symbols-outlined">settings</span>
                        </button>
                    )}
                </div>

                <button
                    onClick={() => router.push("/")}
                    className={cn(
                        "flex items-center gap-3 py-3 rounded-2xl text-white/40 hover:bg-white/5 hover:text-white transition-all group w-full cursor-pointer mt-2",
                        isCollapsed ? "justify-center px-0" : "px-4"
                    )}
                    title="Log Out"
                >
                    <span className="material-symbols-outlined transition-colors group-hover:text-red-400">logout</span>
                    {!isCollapsed && (
                        <span className="font-medium group-hover:text-red-400 whitespace-nowrap">Log Out</span>
                    )}
                </button>
            </div >
        </motion.aside >
    );
}
