"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
    const inviteClient = useMutation(api.clients.inviteClient);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Client"); // Visual only
    const [isLoading, setIsLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Get token for auth
    const token = typeof window !== "undefined" ? localStorage.getItem("mello_auth_token") : null;

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setStatusMessage(null);
        if (!name || !email) {
            setStatusMessage({ type: 'error', text: "Please fill in all fields" });
            return;
        }

        setIsLoading(true);
        try {
            await inviteClient({
                name,
                email,
                temporaryPassword: "tempPassword123!", // In real app, generate random or let user set
                token: token || undefined
            });

            // Mock link generation for the UI effect
            const mockLink = `https://mello.aurora/onboard/${Math.random().toString(36).substring(7)}`;
            setGeneratedLink(mockLink);

            setStatusMessage({ type: 'success', text: "Client added successfully" });
            // Don't close immediately to show the "link"
        } catch (error: any) {
            setStatusMessage({ type: 'error', text: error.message || "Failed to invite client" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setStatusMessage({ type: 'success', text: "Link copied to clipboard" });
            setTimeout(onClose, 1000); // Close after copy with delay
        }
    };

    const handleClose = () => {
        setStatusMessage(null);
        setName("");
        setEmail("");
        setGeneratedLink(null);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0f171f] border border-cyan-900/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Generate Access Link
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Invite a new client to the exclusive podcast network.
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">

                    {/* Status Message */}
                    {statusMessage && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${statusMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {statusMessage.text}
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                            Client Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Startup Stories"
                            className="w-full bg-[#1a232e] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                            Client Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="client@example.com"
                            className="w-full bg-[#1a232e] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                            Access Role
                        </label>
                        <select
                            disabled
                            className="w-full bg-[#1a232e] border border-white/10 rounded-lg px-4 py-3 text-gray-300 focus:outline-none appearance-none cursor-not-allowed"
                        >
                            <option>Studio Head (Client Access)</option>
                        </select>
                    </div>

                    {/* Action Button */}
                    {!generatedLink ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full mt-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px] group-hover:-rotate-45 transition-transform duration-300">link</span>
                                    <span>Create Unique Onboarding URL</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-[#1a232e] border border-dashed border-cyan-500/30 rounded-lg p-3 flex items-center justify-between group">
                                <code className="text-xs text-cyan-400 font-mono truncate max-w-[250px]">
                                    {generatedLink}
                                </code>
                                <button
                                    onClick={handleCopy}
                                    className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5"
                                >
                                    COPY
                                </button>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-full text-sm text-gray-400 hover:text-white transition-colors py-2"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-[#131b24] p-4 text-center border-t border-white/5">
                    <p className="text-[10px] font-medium text-cyan-500/70 flex items-center justify-center gap-1.5 tracking-wide">
                        <span className="material-symbols-outlined text-[12px]">info</span>
                        LINK EXPIRES IN 24 HOURS
                    </p>
                </div>
            </div>
        </div>
    );
}
