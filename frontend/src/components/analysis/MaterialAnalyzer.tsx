"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    FileText, Upload, Sparkles, BookOpen, Target,
    CheckCircle, Loader2, Brain, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisResult {
    concepts: Array<{ term: string; importance: number; frequency: number }>;
    keyTopics: string[];
    suggestedFlashcards: Array<{ front: string; back: string }>;
    twentyEightyAnalysis: {
        highValueConcepts: string[];
        coveragePercent: number;
        recommendation: string;
    };
}

export default function MaterialAnalyzer() {
    const [text, setText] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [activeTab, setActiveTab] = useState<"text" | "pdf" | "exam">("text");

    const handleAnalyze = async () => {
        if (!text.trim() || text.length < 50) return;

        setAnalyzing(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/analysis/analyze-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
            }
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Brain className="w-6 h-6 text-purple-500" />
                    教材智慧分析
                </h1>
                <p className="text-muted-foreground">
                    上傳課本、講義或考古題，AI 自動提取核心概念
                </p>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 justify-center">
                {[
                    { key: "text", label: "貼上文字", icon: FileText },
                    { key: "pdf", label: "上傳 PDF", icon: Upload },
                    { key: "exam", label: "考古題分析", icon: Target }
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key as any)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                            activeTab === key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Text Analysis Tab */}
            {activeTab === "text" && (
                <div className="space-y-4">
                    <Textarea
                        placeholder="貼上課本內容、講義文字或學習材料（至少50字）..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="min-h-[200px]"
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                            {text.length} 字
                        </span>
                        <Button
                            onClick={handleAnalyze}
                            disabled={analyzing || text.length < 50}
                            className="gap-2"
                        >
                            {analyzing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            分析內容
                        </Button>
                    </div>
                </div>
            )}

            {/* PDF Upload Tab */}
            {activeTab === "pdf" && (
                <div className="border-2 border-dashed rounded-xl p-12 text-center">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">上傳 PDF 文件</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        支援課本、講義、投影片等 PDF 格式
                    </p>
                    <Button variant="outline">
                        選擇文件
                    </Button>
                </div>
            )}

            {/* Exam Analysis Tab */}
            {activeTab === "exam" && (
                <div className="space-y-4">
                    <Textarea
                        placeholder="貼上考古題內容，每題用換行分隔..."
                        className="min-h-[200px]"
                    />
                    <Button className="w-full gap-2">
                        <Target className="w-4 h-4" />
                        分析考題模式
                    </Button>
                </div>
            )}

            {/* Analysis Results */}
            {result && (
                <div className="space-y-6 pt-6 border-t">
                    {/* 20-80 Analysis */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                            <h2 className="font-semibold">20-80 原則分析</h2>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span>核心概念覆蓋率</span>
                                <span className="font-medium">{result.twentyEightyAnalysis.coveragePercent}%</span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                    style={{ width: `${result.twentyEightyAnalysis.coveragePercent}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                            {result.twentyEightyAnalysis.recommendation}
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {result.twentyEightyAnalysis.highValueConcepts.map((concept, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                                >
                                    {concept}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Key Concepts */}
                    <div>
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            提取的概念 ({result.concepts.length})
                        </h2>
                        <div className="grid gap-2">
                            {result.concepts.slice(0, 10).map((concept, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <span className="font-medium">{concept.term}</span>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>出現 {concept.frequency} 次</span>
                                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${concept.importance * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Suggested Flashcards */}
                    <div>
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            建議 Flashcards ({result.suggestedFlashcards.length})
                        </h2>
                        <div className="grid gap-2">
                            {result.suggestedFlashcards.slice(0, 6).map((card, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/20"
                                >
                                    <p className="font-medium text-sm">{card.front}</p>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="mt-4 w-full">
                            一鍵生成這些 Flashcards
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
