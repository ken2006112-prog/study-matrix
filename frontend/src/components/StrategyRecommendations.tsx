"use client";

import { useState, useEffect } from "react";
import {
    Brain,
    Lightbulb,
    Timer,
    Shuffle,
    Image,
    MessageCircle,
    Zap,
    ChevronRight,
    Star
} from "lucide-react";

interface Strategy {
    id: string;
    name: string;
    nameCn: string;
    description: string;
    bestFor: string[];
    scientificBasis: string;
    howTo: string[];
    effectiveness: number;
}

interface StrategyRecommendation {
    strategy: Strategy;
    relevanceScore: number;
    reason: string;
    suggestedDuration: number;
}

interface Props {
    context?: "memory" | "understanding" | "problem_solving" | "focus" | "general";
    learningStyle?: string;
    onSelectStrategy?: (strategy: Strategy) => void;
}

const STRATEGY_ICONS: Record<string, React.ReactNode> = {
    active_recall: <Brain className="w-5 h-5" />,
    spaced_repetition: <Timer className="w-5 h-5" />,
    interleaving: <Shuffle className="w-5 h-5" />,
    dual_coding: <Image className="w-5 h-5" />,
    feynman: <MessageCircle className="w-5 h-5" />,
    pomodoro: <Zap className="w-5 h-5" />,
    elaboration: <Lightbulb className="w-5 h-5" />,
};

export function StrategyRecommendations({
    context = "general",
    learningStyle = "visual",
    onSelectStrategy
}: Props) {
    const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchRecommendations();
    }, [context, learningStyle]);

    const fetchRecommendations = async () => {
        try {
            const res = await fetch(
                `http://localhost:8000/api/v1/strategies/recommend?context=${context}&learningStyle=${learningStyle}`
            );
            if (res.ok) {
                const data = await res.json();
                setRecommendations(data.recommendations || []);
            }
        } catch (error) {
            console.error("Failed to fetch strategies:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-secondary rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">推薦學習策略</h3>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
                    {context === "general" ? "通用" : context}
                </span>
            </div>

            <div className="space-y-3">
                {recommendations.map((rec, index) => (
                    <div
                        key={rec.strategy.id}
                        className={`rounded-xl border transition-all duration-200 ${index === 0
                                ? "border-primary/50 bg-primary/5"
                                : "border-border/50 bg-secondary/30"
                            }`}
                    >
                        <div
                            className="p-4 cursor-pointer"
                            onClick={() => setExpandedId(
                                expandedId === rec.strategy.id ? null : rec.strategy.id
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${index === 0 ? "bg-primary/20 text-primary" : "bg-secondary"
                                    }`}>
                                    {STRATEGY_ICONS[rec.strategy.id] || <Star className="w-5 h-5" />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium">{rec.strategy.nameCn}</h4>
                                        {index === 0 && (
                                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                                                最推薦
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {rec.strategy.description}
                                    </p>
                                    <p className="text-xs text-primary mt-2">
                                        {rec.reason}
                                    </p>
                                </div>

                                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedId === rec.strategy.id ? "rotate-90" : ""
                                    }`} />
                            </div>
                        </div>

                        {expandedId === rec.strategy.id && (
                            <div className="px-4 pb-4 pt-0 border-t border-border/30">
                                <div className="mt-3 space-y-3">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            科學依據
                                        </p>
                                        <p className="text-sm">{rec.strategy.scientificBasis}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                            如何執行
                                        </p>
                                        <ol className="text-sm space-y-1">
                                            {rec.strategy.howTo.map((step, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-primary">{i + 1}.</span>
                                                    {step}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                效果評分
                                            </span>
                                            <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${rec.strategy.effectiveness}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium">
                                                {rec.strategy.effectiveness}%
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => onSelectStrategy?.(rec.strategy)}
                                            className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90"
                                        >
                                            使用這個策略
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
