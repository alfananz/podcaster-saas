"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface AuthContextType {
    userId: Id<"users"> | null;
    isLoading: boolean;
    login: (userId: Id<"users">) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [userId, setUserId] = useState<Id<"users"> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedId = localStorage.getItem("podcaster_user_id");
        if (storedId) {
            setUserId(storedId as Id<"users">);
        }
        setIsLoading(false);
    }, []);

    const login = (id: Id<"users">) => {
        localStorage.setItem("podcaster_user_id", id);
        setUserId(id);
    };

    const logout = () => {
        localStorage.removeItem("podcaster_user_id");
        setUserId(null);
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ userId, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
