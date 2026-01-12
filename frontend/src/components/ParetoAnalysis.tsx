"use client";

import { useState, useEffect } from "react";
import { Target, TrendingUp, Star, AlertCircle } from "lucide-react";

interface ConceptAnalysis {
    name: string;
    examWeight: number;
    cumulative: number;
}

interface Props {
    subjectId?: number;
    onSelectConcept?: (conceptName: string) => void;
}

export function ParetoAnalysis({ subjectId = 1, onSelectConcept }: Props) {
    const [analysis, setAnalysis] = useState<ConceptAnalysis[]>([]);
    const [coreConcepts, setCoreConcepts] = useState<ConceptAnalysis[]>([]);
    const [insight, setInsight] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalysis();
    }, [subjectId]);

    const fetchAnalysis = async () => {
        try {
            const res = await fetch(
                `http://localhost:8000/api/v1/analysis/pareto-analysis/${subjectId}`
            );
            if (res.ok) {
                const data = await res.json();
                setAnalysis(data.analysis || []);
                setCoreConcepts(data.coreConcepts || []);
                setInsight(data.insight || "");
            }
        } catch (error) {
            console.error("Failed to fetch Pareto analysis:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-8 w-1/2 bg-secondary rounded" />
                <div className="h-40 bg-secondary rounded-xl" />
            </div>
        );
    }

    const coreThreshold = coreConcepts.length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        20-80 分析
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        專注 20% 概念，掌握 80% 考試範圍
                    </p>
                </div>
            </div>

            {/* Insight Card */}
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
                <Star className="w-6 h-6 text-primary shrink-0" />
                <p className="text-sm font-medium">{insight}</p>
            </div>

            {/* Pareto Bar Chart */}
            <div className="space-y-2">
                {analysis.map((concept, index) => {
                    const isCore = index < coreThreshold;

                    return (
                        <div
                            key={concept.name}
                            className={`group p-3 rounded-xl border transition-all cursor-pointer ${isCore
                                    ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                                    : "border-border/30 bg-secondary/20 hover:bg-secondary/40"
                                }`}
                            onClick={() => onSelectConcept?.(concept.name)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {isCore && (
                                        <Star className="w-4 h-4 text-primary fill-primary" />
                                    )}
                                    <span className={`font-medium ${isCore ? "text-primary" : ""}`}>
                                        {concept.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-muted-foreground">
                                        考試權重
                                    </span>
                                    <span className="font-medium">{concept.examWeight}%</span>
                                </div>
                            </div>

                            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                                {/* Weight bar */}
                                <div
                                    className={`absolute left-0 top-0 h-full rounded-full transition-all ${isCore ? "bg-primary" : "bg-muted-foreground/50"
                                        }`}
                                    style={{ width: `${concept.examWeight}%` }}
                                />
                            </div>

                            {/* Cumulative line */}
                            <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                                <span>累積覆蓋率</span>
                                <span>{concept.cumulative}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 80% Line Explanation */}
            <div className="flex items-center gap-2 p-3 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
                <span className="text-yellow-800 dark:text-yellow-200">
                    前 {coreThreshold} 個概念（{Math.round(coreThreshold / analysis.length * 100)}%）
                    涵蓋了 {coreConcepts[coreConcepts.length - 1]?.cumulative || 80}% 的考試內容
                </span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-secondary/30 rounded-xl">
                    <p className="text-2xl font-bold text-primary">{coreThreshold}</p>
                    <p className="text-xs text-muted-foreground">核心概念</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl">
                    <p className="text-2xl font-bold">{analysis.length}</p>
                    <p className="text-xs text-muted-foreground">總概念數</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl">
                    <p className="text-2xl font-bold text-green-500">
                        {coreConcepts[coreConcepts.length - 1]?.cumulative || 80}%
                    </p>
                    <p className="text-xs text-muted-foreground">考試覆蓋</p>
                </div>
            </div>
        </div>
    );
}
