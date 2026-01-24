import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

export function useUserRole() {
    const [token, setToken] = useState<string | null>(null);
    const [isTokenLoaded, setIsTokenLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("mello_auth_token");
        setToken(stored);
        setIsTokenLoaded(true);
    }, []);

    // Pass token if we have it, otherwise skip or pass undefined
    const args = isTokenLoaded ? { token: token || undefined } : "skip";
    const user = useQuery(api.users.current, args === "skip" ? "skip" : args);

    const isLoading = !isTokenLoaded || (user === undefined && !!token);

    return {
        isLoading,
        role: user?.role,
        isAdmin: user?.role === "admin",
        isClient: user?.role === "client",
        user
    };
}
