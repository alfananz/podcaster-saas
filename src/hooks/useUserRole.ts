import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useUserRole() {
    const user = useQuery(api.users.current);

    return {
        isLoading: user === undefined,
        role: user?.role,
        isAdmin: user?.role === "admin",
        isClient: user?.role === "client",
        user
    };
}
