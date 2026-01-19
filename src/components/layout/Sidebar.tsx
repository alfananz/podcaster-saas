"use client";
import Link from 'next/link';
import { usePathname, useRouter } from "next/navigation";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useModal } from '@/context/ModalContext';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { openModal } = useModal();

    const links = [
        { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
        { href: "/revisions", label: "Revisions", icon: "history_edu" },
        { href: "/episodes", label: "Episodes", icon: "video_library" },
        { href: "#", label: "Templates", icon: "auto_awesome_motion" },
        { href: "/media", label: "Media Library", icon: "folder_open" },
        { href: "#", label: "Analytics", icon: "monitoring" },
    ];

    return (
        <aside className="fixed top-0 left-0 h-full w-72 glass z-50 flex flex-col p-6 hidden lg:flex">
            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-mello-blue flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-white">music_video</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Mello Studio</h1>
                    <p className="text-xs text-primary font-medium tracking-widest uppercase">Creator Pro</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {links.map((link) => {
                    const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

                    return (
                        <Link
                            key={link.label}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group",
                                isActive
                                    ? "bg-white/10 text-white border border-white/5"
                                    : "text-white/50 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span className={cn(
                                "material-symbols-outlined transition-colors",
                                isActive ? "text-primary" : "group-hover:text-white"
                            )}>
                                {link.icon}
                            </span>
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-6 space-y-4">
                <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/60">Storage used</p>
                        <p className="text-xs font-bold">82%</p>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '82%' }}></div>
                    </div>
                </div>

                <button
                    onClick={() => openModal()}
                    className="w-full py-4 rounded-3xl gradient-btn font-bold text-sm tracking-wide shadow-xl shadow-primary/30 active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    New Episode
                </button>

                <div className="flex items-center gap-3 px-2">
                    <Link href="/settings" className="size-10 rounded-full border-2 border-primary/40 p-0.5 cursor-pointer block hover:border-primary transition-colors">
                        <img
                            className="w-full h-full rounded-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuLkBcC5FfT_jSF5Ogr-KOqQxr5Ool8Bj8cMH63lGs9_giuMNPvlyF0gRM1Mkf4l1JXMmuT5Ihk8PMSwQoiToA4hoaHVAzUQgdyxhmroJF6-mCli4xQlylHjWjKM3HYJNekcc4u9Y4VoY3ZJL4e3PlsZ8AWMvzENqBuIW-PjcZti5qupfwmxEAwaYyzd443iLxbex5uJJxwox6OzUOu9rDpkFgUoIvR3Lf-t9QlX8VSQ9ElfWOkByx2J1-f-R5MzBG-F5-FV17v8n7"
                            alt="User profile"
                        />
                    </Link>
                    <div>
                        <p className="text-sm font-bold">Alex Rivera</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-tighter">Premium Account</p>
                    </div>
                    <button className="ml-auto text-white/40 hover:text-white cursor-pointer">
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>

                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/40 hover:bg-white/5 hover:text-white transition-all group w-full cursor-pointer mt-2"
                >
                    <span className="material-symbols-outlined transition-colors group-hover:text-red-400">logout</span>
                    <span className="font-medium group-hover:text-red-400">Log Out</span>
                </button>
            </div>
        </aside>
    );
}
