"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { NewEpisodeModal } from "@/components/modals/NewEpisodeModal";

interface ModalContextType {
    openModal: () => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    // We defined NewEpisodeModal import but haven't created it yet. 
    // This will be resolved in the next step.
    // We place the modal here so it overlays everything in 'children'.

    return (
        <ModalContext.Provider value={{ openModal: () => setIsOpen(true), closeModal: () => setIsOpen(false) }}>
            {children}
            <NewEpisodeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </ModalContext.Provider>
    );
}

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};
