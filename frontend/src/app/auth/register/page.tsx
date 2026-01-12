"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, Check } from "lucide-react";

export default function RegisterPage() {
    const { register } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const passwordStrength = () => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return Math.min(strength, 4);
    };

    const strengthLabels = ["", "弱", "中等", "強", "非常強"];
    const strengthColors = ["", "bg-red-500", "bg-yellow-500", "bg-green-500", "bg-green-600"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("密碼不一致");
            return;
        }

        if (password.length < 6) {
            setError("密碼需至少 6 個字元");
            return;
        }

        setIsLoading(true);
        try {
            await register(email, password, name);
        } catch (err) {
            setError(err instanceof Error ? err.message : "註冊失敗");
        } finally {
            setIsLoading(false);
        }
    };

    const strength = passwordStrength();

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 text-center text-white px-12">
                    <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">開始你的學習之旅</h1>
                    <p className="text-lg opacity-90 max-w-md">
                        加入 Study Matrix，讓 AI 成為你的個人學習教練
                    </p>

                    <div className="mt-12 text-left space-y-4">
                        {[
                            "基於遺忘曲線的智慧複習",
                            "AI 驅動的學習策略推薦",
                            "視覺化概念圖與 Tag Cloud",
                            "個人化每週學習報告"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <Check className="w-4 h-4" />
                                </div>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10" />
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
            </div>

            {/* Right side - Register Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-6">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gradient">Study Matrix</h1>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold">建立帳號</h2>
                        <p className="text-muted-foreground mt-2">
                            免費開始，隨時升級
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">名稱</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="你的名字"
                                    required
                                    className="apple-input pl-12"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="apple-input pl-12"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">密碼</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="至少 6 個字元"
                                    required
                                    className="apple-input pl-12 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {/* Password strength indicator */}
                            {password && (
                                <div className="space-y-1">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded-full transition-colors ${level <= strength ? strengthColors[strength] : "bg-secondary"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        密碼強度: {strengthLabels[strength]}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">確認密碼</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="再次輸入密碼"
                                    required
                                    className="apple-input pl-12"
                                />
                                {confirmPassword && password === confirmPassword && (
                                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                )}
                            </div>
                        </div>

                        <label className="flex items-start gap-3 text-sm">
                            <input type="checkbox" required className="mt-1 rounded" />
                            <span className="text-muted-foreground">
                                我同意{" "}
                                <Link href="/terms" className="text-primary hover:underline">服務條款</Link>
                                {" "}和{" "}
                                <Link href="/privacy" className="text-primary hover:underline">隱私政策</Link>
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full gradient-button py-4 text-base"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    建立帳號中...
                                </>
                            ) : (
                                "建立帳號"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        已經有帳號？{" "}
                        <Link href="/auth/login" className="text-primary font-medium hover:underline">
                            登入
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
