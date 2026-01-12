"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Flame, TrendingUp, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface EncouragementData {
    message: string;
    type: "progress" | "streak" | "improvement" | "support";
    emoji: string;
    data?: {
        thisWeekHours?: number;
        streak?: number;
        weeklyImprovement?: number;
    };
}

export default function DailyEncouragement() {
    const [encouragement, setEncouragement] = useState<EncouragementData | null>(null);
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already shown today
        const lastShown = localStorage.getItem("encouragement_last_shown");
        const today = new Date().toDateString();

        if (lastShown === today) {
            return; // Already shown today
        }

        fetchEncouragement();
    }, []);

    const fetchEncouragement = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/motivation/encouragement");
            if (res.ok) {
                const data = await res.json();
                setEncouragement(data);
                setVisible(true);

                // Mark as shown today
                localStorage.setItem("encouragement_last_shown", new Date().toDateString());
            }
        } catch (error) {
            console.error("Failed to fetch encouragement:", error);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        setTimeout(() => setVisible(false), 300);
    };

    if (!visible || !encouragement) return null;

    const typeIcons = {
        progress: <TrendingUp className="w-5 h-5" />,
        streak: <Flame className="w-5 h-5" />,
        improvement: <Sparkles className="w-5 h-5" />,
        support: <Heart className="w-5 h-5" />
    };

    const typeColors = {
        progress: "from-blue-500 to-cyan-500",
        streak: "from-orange-500 to-red-500",
        improvement: "from-purple-500 to-pink-500",
        support: "from-green-500 to-emerald-500"
    };

    return (
        <div
            className={cn(
                "fixed top-4 right-4 z-50 max-w-sm transition-all duration-300",
                dismissed ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
            )}
        >
            <div className={cn(
                "rounded-xl shadow-2xl overflow-hidden",
                "bg-gradient-to-r",
                typeColors[encouragement.type]
            )}>
                <div className="p-4 text-white">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {typeIcons[encouragement.type]}
                            <span className="font-semibold text-sm">每日鼓勵</span>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Message */}
                    <p className="text-lg font-medium leading-relaxed">
                        {encouragement.message}
                    </p>

                    {/* Stats (if available) */}
                    {encouragement.data && (
                        <div className="flex gap-4 mt-4 pt-3 border-t border-white/20">
                            {encouragement.data.streak && encouragement.data.streak > 0 && (
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{encouragement.data.streak}</p>
                                    <p className="text-xs opacity-80">連續天數</p>
                                </div>
                            )}
                            {encouragement.data.thisWeekHours !== undefined && (
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{encouragement.data.thisWeekHours}h</p>
                                    <p className="text-xs opacity-80">本週學習</p>
                                </div>
                            )}
                            {encouragement.data.weeklyImprovement !== undefined && encouragement.data.weeklyImprovement > 0 && (
                                <div className="text-center">
                                    <p className="text-2xl font-bold">+{encouragement.data.weeklyImprovement}%</p>
                                    <p className="text-xs opacity-80">進步</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
