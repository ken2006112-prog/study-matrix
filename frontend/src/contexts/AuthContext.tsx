"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    id: number;
    email: string;
    name: string | null;
    avatar: string | null;
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://localhost:8000/api/v1";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/auth/login", "/auth/register", "/"];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Load token from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("auth_user");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            // Verify token is still valid
            verifyToken(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    // Redirect to login if not authenticated (except public routes)
    useEffect(() => {
        if (!isLoading && !user && !PUBLIC_ROUTES.includes(pathname)) {
            router.push("/auth/login");
        }
    }, [isLoading, user, pathname, router]);

    const verifyToken = async (authToken: string) => {
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    "Authorization": `Bearer ${authToken}`
                }
            });

            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else {
                // Token invalid, clear storage
                logout();
            }
        } catch {
            console.error("Failed to verify token");
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || "登入失敗");
        }

        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        localStorage.setItem("auth_expires", data.expiresAt);

        router.push("/today");
    };

    const register = async (email: string, password: string, name: string) => {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || "註冊失敗");
        }

        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        localStorage.setItem("auth_expires", data.expiresAt);

        router.push("/onboarding");
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_expires");
        router.push("/auth/login");
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!token) return;

        const res = await fetch(`${API_BASE}/auth/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const updated = await res.json();
            setUser(prev => prev ? { ...prev, ...updated } : null);
            localStorage.setItem("auth_user", JSON.stringify({ ...user, ...updated }));
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                updateProfile
            }}
        >
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

// HOC for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedRoute(props: P) {
        const { isAuthenticated, isLoading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                router.push("/auth/login");
            }
        }, [isLoading, isAuthenticated, router]);

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
            );
        }

        if (!isAuthenticated) {
            return null;
        }

        return <Component {...props} />;
    };
}
