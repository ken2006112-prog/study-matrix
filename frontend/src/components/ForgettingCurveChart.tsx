"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";

interface ForgettingCurveData {
    conceptName: string;
    initialStrength: number;
    currentRetention: number;
    optimalReviewTime: string;
    daysUntilForget: number;
    reviewsCompleted: number;
}

interface Props {
    userId?: number;
    onReviewConcept?: (conceptName: string) => void;
}

export function ForgettingCurveChart({ userId = 1, onReviewConcept }: Props) {
    const [concepts, setConcepts] = useState<ForgettingCurveData[]>([]);
    const [loading, setLoading] = useState(true);
    const [urgentCount, setUrgentCount] = useState(0);

    useEffect(() => {
        fetchCurveData();
    }, [userId]);

    const fetchCurveData = async () => {
        try {
            const res = await fetch(
                `http://localhost:8000/api/v1/strategies/forgetting-curve/${userId}`
            );
            if (res.ok) {
                const data = await res.json();
                setConcepts(data.concepts || []);
                setUrgentCount(data.urgentReviews?.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch forgetting curve:", error);
        } finally {
            setLoading(false);
        }
    };

    const getRetentionColor = (retention: number) => {
        if (retention >= 0.7) return "text-green-500";
        if (retention >= 0.5) return "text-yellow-500";
        return "text-red-500";
    };

    const getRetentionBg = (retention: number) => {
        if (retention >= 0.7) return "bg-green-500";
        if (retention >= 0.5) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getStatusIcon = (retention: number) => {
        if (retention >= 0.7) return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (retention >= 0.5) return <Clock className="w-4 h-4 text-yellow-500" />;
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 bg-secondary rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with urgent alert */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-primary" />
                        遺忘曲線追蹤
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        基於 Ebbinghaus 遺忘曲線預測
                    </p>
                </div>
                {urgentCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            {urgentCount} 個需要複習
                        </span>
                    </div>
                )}
            </div>

            {/* Concepts list */}
            <div className="space-y-2">
                {concepts.map((concept, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-xl border transition-all ${concept.currentRetention < 0.5
                                ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                                : "border-border/50 bg-secondary/30"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(concept.currentRetention)}
                                <span className="font-medium">{concept.conceptName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-muted-foreground">
                                    複習 {concept.reviewsCompleted} 次
                                </span>
                                <span className={`font-medium ${getRetentionColor(concept.currentRetention)}`}>
                                    {Math.round(concept.currentRetention * 100)}%
                                </span>
                            </div>
                        </div>

                        {/* Retention bar */}
                        <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-2">
                            <div
                                className={`absolute left-0 top-0 h-full rounded-full transition-all ${getRetentionBg(concept.currentRetention)}`}
                                style={{ width: `${concept.currentRetention * 100}%` }}
                            />
                            {/* 50% threshold marker */}
                            <div
                                className="absolute top-0 h-full w-0.5 bg-yellow-500/50"
                                style={{ left: "50%" }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                                {concept.daysUntilForget > 0
                                    ? `約 ${concept.daysUntilForget} 天後遺忘`
                                    : "建議立即複習"
                                }
                            </span>
                            <button
                                onClick={() => onReviewConcept?.(concept.conceptName)}
                                className={`px-3 py-1 rounded-lg transition-colors ${concept.currentRetention < 0.5
                                        ? "bg-red-500 text-white hover:bg-red-600"
                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                    }`}
                            >
                                {concept.currentRetention < 0.5 ? "立即複習" : "複習"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>穩定 ≥70%</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>衰退中 50-70%</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>危險 &lt;50%</span>
                </div>
            </div>
        </div>
    );
}
