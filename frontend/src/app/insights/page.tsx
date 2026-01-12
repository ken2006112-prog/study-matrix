"use client";

import { useState } from "react";
import {
    Brain,
    Target,
    TrendingDown,
    Network,
    Lightbulb,
    BarChart3,
    ChevronRight
} from "lucide-react";
import { StrategyRecommendations } from "@/components/StrategyRecommendations";
import { ForgettingCurveChart } from "@/components/ForgettingCurveChart";
import { ConceptRelationGraph } from "@/components/ConceptRelationGraph";
import { ParetoAnalysis } from "@/components/ParetoAnalysis";

type TabType = "strategies" | "forgetting" | "relations" | "pareto";

export default function InsightsPage() {
    const [activeTab, setActiveTab] = useState<TabType>("strategies");
    const [learningContext, setLearningContext] = useState<"memory" | "understanding" | "problem_solving" | "focus" | "general">("general");

    const tabs = [
        { id: "strategies" as TabType, label: "學習策略", icon: <Lightbulb className="w-4 h-4" /> },
        { id: "forgetting" as TabType, label: "遺忘曲線", icon: <TrendingDown className="w-4 h-4" /> },
        { id: "pareto" as TabType, label: "20-80 分析", icon: <Target className="w-4 h-4" /> },
        { id: "relations" as TabType, label: "概念關聯", icon: <Network className="w-4 h-4" /> },
    ];

    const contextOptions = [
        { value: "general", label: "通用" },
        { value: "memory", label: "記憶" },
        { value: "understanding", label: "理解" },
        { value: "problem_solving", label: "解題" },
        { value: "focus", label: "專注" },
    ];

    const handleSelectConcept = (conceptName: string) => {
        console.log("Selected concept:", conceptName);
        // Could navigate to concept detail or open study session
    };

    const handleReviewConcept = (conceptName: string) => {
        console.log("Review concept:", conceptName);
        // Could navigate to flashcard review
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Brain className="w-6 h-6 text-primary" />
                                學習洞察
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                基於認知科學的個人化分析
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 overflow-x-auto pb-2 -mb-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? "bg-primary text-white"
                                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Context selector for strategies */}
                {activeTab === "strategies" && (
                    <div className="mb-6 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">學習情境：</span>
                        <div className="flex gap-2">
                            {contextOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setLearningContext(opt.value as typeof learningContext)}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${learningContext === opt.value
                                            ? "bg-primary/20 text-primary"
                                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === "strategies" && (
                        <StrategyRecommendations
                            context={learningContext}
                            learningStyle="visual"
                            onSelectStrategy={(strategy) => {
                                console.log("Selected strategy:", strategy);
                            }}
                        />
                    )}

                    {activeTab === "forgetting" && (
                        <ForgettingCurveChart
                            userId={1}
                            onReviewConcept={handleReviewConcept}
                        />
                    )}

                    {activeTab === "pareto" && (
                        <ParetoAnalysis
                            subjectId={1}
                            onSelectConcept={handleSelectConcept}
                        />
                    )}

                    {activeTab === "relations" && (
                        <ConceptRelationGraph
                            subjectId={1}
                            onSelectConcept={handleSelectConcept}
                        />
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 p-4 bg-secondary/30 rounded-xl">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-primary" />
                        快速操作
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setActiveTab("forgetting")}
                            className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/30 hover:border-primary/30 transition-colors"
                        >
                            <span className="text-sm">查看需要複習的概念</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                            onClick={() => setActiveTab("pareto")}
                            className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/30 hover:border-primary/30 transition-colors"
                        >
                            <span className="text-sm">找出高價值概念</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
