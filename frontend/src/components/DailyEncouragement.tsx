"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, TrendingUp, Flame, Clock, Award } from "lucide-react";

interface DailyEncouragementProps {
    show: boolean;
    onDismiss: () => void;
}

interface EncouragementData {
    message: string;
    stat?: {
        label: string;
        value: string;
        icon: React.ReactNode;
        color: string;
    };
    tip?: string;
}

export function DailyEncouragement({ show, onDismiss }: DailyEncouragementProps) {
    const [data, setData] = useState<EncouragementData | null>(null);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            fetchEncouragement();
        }
    }, [show]);

    const fetchEncouragement = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/motivation/daily?userId=1");
            if (res.ok) {
                const motivationData = await res.json();
                setData({
                    message: motivationData.message || getRandomMessage(),
                    stat: motivationData.highlight ? {
                        label: motivationData.highlight.label,
                        value: motivationData.highlight.value,
                        icon: getIcon(motivationData.highlight.type),
                        color: motivationData.highlight.color || "text-primary"
                    } : getRandomStat(),
                    tip: motivationData.tip
                });
            } else {
                setData({
                    message: getRandomMessage(),
                    stat: getRandomStat()
                });
            }
        } catch {
            setData({
                message: getRandomMessage(),
                stat: getRandomStat()
            });
        }
        setLoading(false);
        setTimeout(() => setVisible(true), 100);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "streak": return <Flame className="w-5 h-5" />;
            case "time": return <Clock className="w-5 h-5" />;
            case "progress": return <TrendingUp className="w-5 h-5" />;
            default: return <Award className="w-5 h-5" />;
        }
    };

    const getRandomMessage = () => {
        const messages = [
            "新的一天，新的進步！準備好學習了嗎？ 🚀",
            "每一次複習都是在鍛鍊你的大腦 💪",
            "今天的努力，是明天的實力 ✨",
            "保持專注，你比昨天更進步了！",
            "記住：持續比完美更重要 🎯",
            "你已經養成了學習習慣，繼續保持！",
            "今天也要加油哦！你可以的 💫"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    };

    const getRandomStat = () => {
        const stats = [
            { label: "連續學習", value: "5 天", icon: <Flame className="w-5 h-5" />, color: "text-orange-500" },
            { label: "本週學習", value: "12 小時", icon: <Clock className="w-5 h-5" />, color: "text-blue-500" },
            { label: "記憶保留", value: "78%", icon: <TrendingUp className="w-5 h-5" />, color: "text-green-500" },
            { label: "完成任務", value: "18 個", icon: <Award className="w-5 h-5" />, color: "text-purple-500" },
        ];
        return stats[Math.floor(Math.random() * stats.length)];
    };

    if (!show || loading || !data) return null;

    return (
        <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                }`}
        >
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-xl rounded-2xl border border-primary/20 shadow-lg overflow-hidden">
                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-primary">每日鼓勵</span>
                        </div>
                        <button
                            onClick={onDismiss}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Message */}
                    <p className="text-foreground mb-4">{data.message}</p>

                    {/* Stat Highlight */}
                    {data.stat && (
                        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-xl">
                            <div className={`${data.stat.color}`}>
                                {data.stat.icon}
                            </div>
                            <div>
                                <div className="text-lg font-bold">{data.stat.value}</div>
                                <div className="text-xs text-muted-foreground">{data.stat.label}</div>
                            </div>
                        </div>
                    )}

                    {/* Tip */}
                    {data.tip && (
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                            💡 {data.tip}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Hook to manage daily encouragement
export function useDailyEncouragement() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if we've shown encouragement today
        const lastShown = localStorage.getItem("lastEncouragementDate");
        const today = new Date().toDateString();

        if (lastShown !== today) {
            // Show after a short delay
            const timer = setTimeout(() => {
                setShow(true);
                localStorage.setItem("lastEncouragementDate", today);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        setShow(false);
    };

    return { show, dismiss };
}
