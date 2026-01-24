"use client";

import { useUserRole } from "../../../hooks/useUserRole";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ClientTable from "../../../components/admin/ClientTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function ClientManagementHub() {
    const { role, isLoading, isClient } = useUserRole();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isClient) {
            // Redirect clients to dashboard
            router.push("/");
        }
    }, [isLoading, isClient, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full bg-[#05090e] items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-cyan-500">progress_activity</span>
            </div>
        );
    }

    // Double check if redirect hasn't happened yet but we are client
    if (isClient) return null;

    // Get token for passing to non-hook queries if needed
    const token = typeof window !== "undefined" ? localStorage.getItem("mello_auth_token") : null;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <ClientTable token={token} />
            </div>
        </DashboardLayout>
    );
}
