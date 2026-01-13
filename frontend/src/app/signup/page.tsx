"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await register(email, password, name);
            router.push("/setup");
        } catch (e: any) {
            setError(e.message || "註冊失敗，請稍後再試");
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = () => {
        if (password.length === 0) return { width: "0%", color: "bg-slate-600", text: "" };
        if (password.length < 6) return { width: "33%", color: "bg-red-500", text: "弱" };
        if (password.length < 10) return { width: "66%", color: "bg-amber-500", text: "中" };
        return { width: "100%", color: "bg-emerald-500", text: "強" };
    };

    const strength = passwordStrength();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/landing" className="inline-flex items-center gap-2 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">Study Matrix</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">創建帳號</h1>
                    <p className="text-slate-400">開始你的 AI 學習之旅</p>
                </div>

                {/* Signup Form */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                姓名
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="你的名字"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                電子郵件
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                密碼
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="至少 6 個字元"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {/* Password Strength */}
                            {password && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${strength.color} transition-all duration-300`}
                                            style={{ width: strength.width }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-400">{strength.text}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                required
                                className="w-4 h-4 mt-1 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                            />
                            <span className="text-sm text-slate-400">
                                我同意{" "}
                                <a href="#" className="text-emerald-400 hover:underline">服務條款</a>
                                {" "}和{" "}
                                <a href="#" className="text-emerald-400 hover:underline">隱私政策</a>
                            </span>
                        </div>

                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-6 text-lg border-0"
                        >
                            {loading ? "註冊中..." : "免費開始使用"}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </form>

                    {/* Benefits */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="space-y-2">
                            {["免費使用基礎功能", "無需信用卡", "隨時升級或取消"].map((text, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 text-center text-slate-400">
                        已有帳號？{" "}
                        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                            登入
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
