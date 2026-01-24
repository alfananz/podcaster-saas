"use client";
import React from 'react';
import { useModal } from '@/context/ModalContext';
import { useUserRole } from '@/hooks/useUserRole';

export function DashboardHeader() {
    const { openModal } = useModal();
    const { user } = useUserRole();

    return (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
                <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Good Morning, {user?.name?.split(' ')[0] || "Creator"}</h2>
                <p className="text-white/50 text-lg">Your production queue is looking busy today. 3 active projects.</p>
            </div>
            <button
                onClick={() => openModal()}
                className="flex items-center gap-3 px-8 py-4 rounded-3xl gradient-btn font-bold text-base shadow-xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
                <span className="material-symbols-outlined">add_circle</span>
                <span>New Episode</span>
            </button>
        </header>
    );
}
