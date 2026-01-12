"use client";

import { useState, useEffect } from "react";
import { Moon, Zap, Activity, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CheckInModal({ onComplete }: { onComplete?: () => void }) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);

    // State
    const [sleepQuality, setSleepQuality] = useState(7);
    const [stressLevel, setStressLevel] = useState(5);
    const [mood, setMood] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Check if check-in done today
        const lastCheckIn = localStorage.getItem("lastCheckInDate");
        const today = new Date().toDateString();

        if (lastCheckIn !== today) {
            // Delay slightly for effect
            setTimeout(() => setIsOpen(true), 1000);
        }
    }, []);

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/study/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    sleepQuality,
                    stressLevel,
                    mood: mood || "CALM"
                })
            });

            if (res.ok) {
                localStorage.setItem("lastCheckInDate", new Date().toDateString());
                setTimeout(() => {
                    setIsOpen(false);
                    onComplete?.();
                }, 500);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-300">

                {/* Header Gradient */}
                <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                <div className="p-8 space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">Good Morning, {user?.name}</h2>
                        <p className="text-muted-foreground">讓我了解你的狀態，以安排最佳學習路徑。</p>
                    </div>

                    {/* Step 1: Sleep */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right fade-in">
                            <div className="flex items-center justify-center gap-4 text-primary">
                                <Moon className="w-8 h-8" />
                                <span className="text-xl font-medium">昨晚睡得如何？</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm text-muted-foreground px-2">
                                    <span>很糟</span>
                                    <span className="font-bold text-foreground text-lg">{sleepQuality}</span>
                                    <span>超棒</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="10"
                                    value={sleepQuality}
                                    onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                                下一步
                            </button>
                        </div>
                    )}

                    {/* Step 2: Stress & Mood */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right fade-in">
                            {/* Stress */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-orange-500">
                                    <Activity className="w-5 h-5" />
                                    <span className="font-medium">目前的壓力指數？</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="10"
                                    value={stressLevel}
                                    onChange={(e) => setStressLevel(parseInt(e.target.value))}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                            </div>

                            {/* Mood */}
                            <div className="space-y-4">
                                <span className="font-medium flex items-center gap-3 text-purple-500">
                                    <Zap className="w-5 h-5" />
                                    現在的心情？
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                    {["CALM", "TIRED", "ANXIOUS", "EXCITED"].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMood(m)}
                                            className={`p-3 rounded-xl border transition-all ${mood === m
                                                    ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20"
                                                    : "border-border hover:bg-secondary"
                                                }`}
                                        >
                                            {m === "CALM" && "😌 平靜"}
                                            {m === "TIRED" && "🥱 疲憊"}
                                            {m === "ANXIOUS" && "😰 焦慮"}
                                            {m === "EXCITED" && "🤩 興奮"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!mood || isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? "分析中..." : (
                                    <>
                                        <span>生成今日計畫</span>
                                        <Check className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
