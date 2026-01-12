"use client";

import { useState, useEffect } from "react";
import { X, Brain, Zap, Clock, TrendingDown } from "lucide-react";
import { SocraticChat } from "./SocraticChat";

interface AIInterventionProps {
    userId?: number;
}

interface InterventionData {
    type: "struggle" | "break" | "strategy" | "encouragement";
    message: string;
    suggestion?: string;
    action?: {
        label: string;
        type: "practice" | "break" | "switch" | "chat";
    };
    topic?: string;
    subjectName?: string;
}

export function AIIntervention({ userId = 1 }: AIInterventionProps) {
    const [intervention, setIntervention] = useState<InterventionData | null>(null);
    const [visible, setVisible] = useState(false);
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        // Check for interventions periodically
        const checkInterventions = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/v1/ai-tutor/intervention?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.shouldIntervene) {
                        setIntervention(data);
                        setVisible(true);
                    }
                }
            } catch {
                // In demo mode, occasionally show interventions
                const demoInterventions: InterventionData[] = [
                    {
                        type: "struggle",
                        message: "我注意到你在「極限」這個概念上花了比較多時間",
                        suggestion: "要不要試試用 Feynman 方法來解釋它？",
                        action: { label: "開始對話", type: "chat" },
                        topic: "極限",
                        subjectName: "微積分"
                    },
                    {
                        type: "break",
                        message: "你已經專注學習 45 分鐘了，做得很好！",
                        suggestion: "建議休息 5-10 分鐘，讓大腦鞏固記憶",
                        action: { label: "開始休息", type: "break" }
                    },
                    {
                        type: "strategy",
                        message: "根據你的學習數據，純閱讀的效果可能不是最佳",
                        suggestion: "試試主動回憶：合上書，回想剛才學的重點",
                        action: { label: "練習回憶", type: "practice" },
                        topic: "主動回憶",
                        subjectName: "學習策略"
                    }
                ];

                // 10% chance to show intervention during demo
                if (Math.random() < 0.1) {
                    const randomIntervention = demoInterventions[Math.floor(Math.random() * demoInterventions.length)];
                    setIntervention(randomIntervention);
                    setVisible(true);
                }
            }
        };

        // Check every 5 minutes
        const interval = setInterval(checkInterventions, 5 * 60 * 1000);

        // Also check once after 30 seconds for demo
        const initialCheck = setTimeout(checkInterventions, 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialCheck);
        };
    }, [userId]);

    const dismiss = () => {
        setVisible(false);
        setTimeout(() => setIntervention(null), 300);
    };

    const handleAction = () => {
        if (!intervention?.action) return;

        switch (intervention.action.type) {
            case "chat":
                setShowChat(true);
                break;
            case "break":
                // Could navigate to break timer
                dismiss();
                break;
            case "practice":
                setShowChat(true);
                break;
            case "switch":
                // Could navigate to different subject
                dismiss();
                break;
        }
    };

    const getIcon = () => {
        switch (intervention?.type) {
            case "struggle": return <TrendingDown className="w-5 h-5" />;
            case "break": return <Clock className="w-5 h-5" />;
            case "strategy": return <Zap className="w-5 h-5" />;
            default: return <Brain className="w-5 h-5" />;
        }
    };

    const getColor = () => {
        switch (intervention?.type) {
            case "struggle": return "from-yellow-500 to-orange-500";
            case "break": return "from-green-500 to-emerald-500";
            case "strategy": return "from-blue-500 to-purple-500";
            default: return "from-primary to-primary/80";
        }
    };

    if (!intervention) return null;

    return (
        <>
            {/* Intervention Card */}
            <div className={`fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40 w-80 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                }`}>
                <div className="apple-card overflow-hidden">
                    {/* Gradient Header */}
                    <div className={`h-1 bg-gradient-to-r ${getColor()}`} />

                    <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor()} flex items-center justify-center text-white`}>
                                {getIcon()}
                            </div>
                            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Message */}
                        <p className="text-sm font-medium mb-2">{intervention.message}</p>

                        {intervention.suggestion && (
                            <p className="text-sm text-muted-foreground mb-4">
                                💡 {intervention.suggestion}
                            </p>
                        )}

                        {/* Action */}
                        {intervention.action && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAction}
                                    className="apple-button flex-1 text-sm py-2"
                                >
                                    {intervention.action.label}
                                </button>
                                <button
                                    onClick={dismiss}
                                    className="apple-button-secondary text-sm py-2 px-4"
                                >
                                    稍後
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Socratic Chat Modal */}
            <SocraticChat
                isOpen={showChat}
                onClose={() => { setShowChat(false); dismiss(); }}
                topic={intervention.topic}
                subjectName={intervention.subjectName}
            />
        </>
    );
}
