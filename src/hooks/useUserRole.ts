import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";

export function useUserRole() {
    const { userId, isLoading: isAuthLoading } = useAuth();
    const user = useQuery(api.users.current, { userId: userId ?? undefined });

    // Extended loading state: Auth loading OR Query loading (if userId exists)
    const isLoading = isAuthLoading || (!!userId && user === undefined);

    return {
        isLoading,
        role: user?.role,
        isAdmin: user?.role === "admin",
        isClient: user?.role === "client",
        user
    };
}
