"use client";

import { useState, useEffect } from "react";
import {
    AlertTriangle,
    Brain,
    CheckCircle,
    Target,
    RefreshCw,
    BookOpen
} from "lucide-react";

interface ErrorPattern {
    conceptId: number;
    conceptName: string;
    errorType: string;
    frequency: number;
    lastOccurred: string;
    suggestedReview: string;
}

interface ErrorSummary {
    total: number;
    conceptual: number;
    careless: number;
    recommendation: string;
}

interface Props {
    userId?: number;
    onPractice?: (conceptName: string) => void;
}

export function ErrorAnalysis({ userId = 1, onPractice }: Props) {
    const [errors, setErrors] = useState<ErrorPattern[]>([]);
    const [summary, setSummary] = useState<ErrorSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchErrorAnalysis();
    }, [userId]);

    const fetchErrorAnalysis = async () => {
        try {
            const res = await fetch(
                `http://localhost:8000/api/v1/memory/${userId}/errors`
            );
            if (res.ok) {
                const data = await res.json();
                setErrors(data.errors || []);
                setSummary(data.summary || null);
            }
        } catch (error) {
            console.error("Failed to fetch error analysis:", error);
        } finally {
            setLoading(false);
        }
    };

    const getErrorTypeInfo = (type: string) => {
        switch (type) {
            case "conceptual":
                return {
                    label: "概念性錯誤",
                    color: "text-red-500",
                    bg: "bg-red-100 dark:bg-red-900/30",
                    icon: <Brain className="w-4 h-4" />,
                    description: "對核心概念理解不足"
                };
            case "careless":
                return {
                    label: "粗心錯誤",
                    color: "text-yellow-500",
                    bg: "bg-yellow-100 dark:bg-yellow-900/30",
                    icon: <AlertTriangle className="w-4 h-4" />,
                    description: "理解正確但計算或填寫錯誤"
                };
            default:
                return {
                    label: "其他錯誤",
                    color: "text-muted-foreground",
                    bg: "bg-secondary",
                    icon: <Target className="w-4 h-4" />,
                    description: "需要進一步分析"
                };
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-20 bg-secondary rounded-xl" />
                <div className="h-32 bg-secondary rounded-xl" />
            </div>
        );
    }

    if (errors.length === 0) {
        return (
            <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-medium">太棒了！目前沒有常見錯誤</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    繼續練習來收集更多數據
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        錯題分析
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        了解你的錯誤模式，針對性改進
                    </p>
                </div>
                <button
                    onClick={fetchErrorAnalysis}
                    className="p-2 hover:bg-secondary rounded-lg"
                >
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-secondary/30 rounded-xl text-center">
                        <p className="text-2xl font-bold">{summary.total}</p>
                        <p className="text-xs text-muted-foreground">總錯誤數</p>
                    </div>
                    <div className="p-4 bg-red-100/50 dark:bg-red-900/20 rounded-xl text-center">
                        <p className="text-2xl font-bold text-red-500">{summary.conceptual}</p>
                        <p className="text-xs text-muted-foreground">概念性</p>
                    </div>
                    <div className="p-4 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-xl text-center">
                        <p className="text-2xl font-bold text-yellow-500">{summary.careless}</p>
                        <p className="text-xs text-muted-foreground">粗心</p>
                    </div>
                </div>
            )}

            {/* Recommendation */}
            {summary?.recommendation && (
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl">
                    <Brain className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-sm font-medium">{summary.recommendation}</p>
                </div>
            )}

            {/* Error List */}
            <div className="space-y-2">
                {errors.map((error) => {
                    const typeInfo = getErrorTypeInfo(error.errorType);

                    return (
                        <div
                            key={error.conceptId}
                            className={`p-4 rounded-xl border border-border/30 ${typeInfo.bg}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg bg-background ${typeInfo.color}`}>
                                        {typeInfo.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{error.conceptName}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {typeInfo.label} • 出現 {error.frequency} 次
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onPractice?.(error.conceptName)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-background rounded-lg text-xs font-medium hover:bg-secondary transition-colors"
                                >
                                    <BookOpen className="w-3 h-3" />
                                    練習
                                </button>
                            </div>

                            <div className="mt-3 p-2 bg-background/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">建議複習方式</p>
                                <p className="text-sm mt-1">{error.suggestedReview}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tips */}
            <div className="p-4 bg-secondary/30 rounded-xl">
                <h4 className="text-sm font-medium mb-2">💡 改進建議</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 概念性錯誤：回到基礎，用費曼技巧重新理解</li>
                    <li>• 粗心錯誤：做題時放慢速度，檢查每一步</li>
                </ul>
            </div>
        </div>
    );
}
