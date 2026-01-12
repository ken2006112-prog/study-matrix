"use client";

import { useState, useEffect } from "react";
import {
    Brain,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Zap,
    Clock,
    Target,
    BookOpen,
    Star,
    Loader2,
    RefreshCw,
    ChevronRight,
    Sparkles,
    Award,
    Flame
} from "lucide-react";

interface AnalysisData {
    overview: {
        health_score: number;
        trend: number;
        streak: number;
    };
    metrics: {
        study_hours_this_week: number;
        honesty_ratio: number;
        focus_score: number;
        card_success_rate: number;
        due_cards: number;
        task_completion_rate: number;
        pending_tasks: number;
        overdue_tasks: number;
        upcoming_exams: number;
        urgent_exams: number;
        balance_score: number;
        subject_distribution: Record<string, number>;
    };
    insights: Array<{
        type: string;
        category: string;
        title: string;
        description: string;
        priority: string;
    }>;
    recommendations: string;
    action_items: Array<{
        title: string;
        urgency: string;
        estimated_time: string;
        link: string;
    }>;
}

export default function CoachPage() {
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAnalysis();
    }, []);

    const fetchAnalysis = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/coach/analysis?userId=1");
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch analysis:", error);
            // Demo data
            setData(getDemoData());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAnalysis();
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        if (score >= 40) return "text-orange-500";
        return "text-red-500";
    };

    const getScoreGrade = (score: number) => {
        if (score >= 90) return { grade: "A+", label: "優秀" };
        if (score >= 80) return { grade: "A", label: "很好" };
        if (score >= 70) return { grade: "B", label: "良好" };
        if (score >= 60) return { grade: "C", label: "及格" };
        return { grade: "D", label: "需加油" };
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case "critical": return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case "high": return <Flame className="w-5 h-5 text-orange-500" />;
            case "medium": return <Clock className="w-5 h-5 text-yellow-500" />;
            case "positive": return <Star className="w-5 h-5 text-green-500" />;
            default: return <CheckCircle className="w-5 h-5 text-blue-500" />;
        }
    };

    const getInsightBg = (type: string) => {
        switch (type) {
            case "alert": return "bg-red-500/10 border-red-500/30";
            case "warning": return "bg-orange-500/10 border-orange-500/30";
            case "suggestion": return "bg-yellow-500/10 border-yellow-500/30";
            case "achievement": return "bg-green-500/10 border-green-500/30";
            default: return "bg-secondary/30 border-border/30";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-muted-foreground">分析中...</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { grade, label } = getScoreGrade(data.overview.health_score);

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">AI 學習教練</h1>
                            <p className="text-xs text-muted-foreground">全面分析 · 智能建議</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="apple-button-secondary"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        重新分析
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Health Score Card */}
                <div className="premium-card p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-2">學習健康度</p>
                    <div className={`text-7xl font-bold mb-2 ${getScoreColor(data.overview.health_score)}`}>
                        {data.overview.health_score}
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <span className="inline-block px-4 py-1 rounded-full bg-secondary text-lg font-semibold">
                            {grade}
                        </span>
                        <span className="text-muted-foreground">{label}</span>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-border/30">
                        <div className="text-center">
                            <div className="flex items-center gap-1 text-lg font-semibold">
                                {data.overview.trend >= 0 ? (
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                ) : (
                                    <TrendingDown className="w-5 h-5 text-red-500" />
                                )}
                                {Math.abs(data.overview.trend)}%
                            </div>
                            <p className="text-xs text-muted-foreground">較上週</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center gap-1 text-lg font-semibold">
                                <Flame className="w-5 h-5 text-orange-500" />
                                {data.overview.streak}
                            </div>
                            <p className="text-xs text-muted-foreground">連續天數</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="stats-card text-center">
                        <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                        <p className="text-xl font-bold">{data.metrics.study_hours_this_week}h</p>
                        <p className="text-xs text-muted-foreground">本週學習</p>
                    </div>
                    <div className="stats-card text-center">
                        <Zap className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                        <p className="text-xl font-bold">{data.metrics.focus_score}</p>
                        <p className="text-xs text-muted-foreground">專注度</p>
                    </div>
                    <div className="stats-card text-center">
                        <BookOpen className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                        <p className="text-xl font-bold">{data.metrics.due_cards}</p>
                        <p className="text-xs text-muted-foreground">待複習</p>
                    </div>
                    <div className="stats-card text-center">
                        <Target className="w-5 h-5 mx-auto mb-2 text-green-500" />
                        <p className="text-xl font-bold">{data.metrics.task_completion_rate}%</p>
                        <p className="text-xs text-muted-foreground">完成率</p>
                    </div>
                </div>

                {/* Urgent Action Items */}
                {data.action_items.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            立即行動
                        </h3>
                        <div className="space-y-2">
                            {data.action_items.map((action, i) => (
                                <a
                                    key={i}
                                    href={action.link}
                                    className="apple-card p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors block"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.urgency === "now" ? "bg-red-500/20 text-red-500" : "bg-orange-500/20 text-orange-500"
                                        }`}>
                                        {action.urgency === "now" ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{action.title}</p>
                                        <p className="text-sm text-muted-foreground">{action.estimated_time}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Insights */}
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        洞察分析
                    </h3>
                    <div className="space-y-2">
                        {data.insights.map((insight, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl border ${getInsightBg(insight.type)}`}
                            >
                                <div className="flex items-start gap-3">
                                    {getPriorityIcon(insight.priority)}
                                    <div>
                                        <p className="font-medium">{insight.title}</p>
                                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Recommendations */}
                <div className="premium-card overflow-hidden">
                    <div className="p-4 border-b border-border/30 flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">AI 個性化建議</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-auto">
                            GPT-4 生成
                        </span>
                    </div>
                    <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{
                            __html: data.recommendations
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>')
                        }} />
                    </div>
                </div>

                {/* Detailed Metrics */}
                <div className="apple-card divide-y divide-border/30">
                    <div className="p-4">
                        <h3 className="font-semibold mb-4">詳細指標</h3>
                    </div>
                    <div className="flex items-center justify-between p-4">
                        <span>時間誠實度</span>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.metrics.honesty_ratio}%` }} />
                            </div>
                            <span className="font-semibold w-12 text-right">{data.metrics.honesty_ratio}%</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4">
                        <span>專注度</span>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${data.metrics.focus_score}%` }} />
                            </div>
                            <span className="font-semibold w-12 text-right">{data.metrics.focus_score}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4">
                        <span>閃卡成功率</span>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${data.metrics.card_success_rate}%` }} />
                            </div>
                            <span className="font-semibold w-12 text-right">{data.metrics.card_success_rate}%</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4">
                        <span>科目平衡</span>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.metrics.balance_score}%` }} />
                            </div>
                            <span className="font-semibold w-12 text-right">{data.metrics.balance_score}</span>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                <div className="grid grid-cols-2 gap-3">
                    {data.metrics.overdue_tasks > 0 && (
                        <a href="/matrix" className="apple-card p-4 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 transition-colors">
                            <p className="text-2xl font-bold text-red-500">{data.metrics.overdue_tasks}</p>
                            <p className="text-sm text-muted-foreground">過期任務</p>
                        </a>
                    )}
                    {data.metrics.urgent_exams > 0 && (
                        <a href="/calendar" className="apple-card p-4 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 transition-colors">
                            <p className="text-2xl font-bold text-orange-500">{data.metrics.urgent_exams}</p>
                            <p className="text-sm text-muted-foreground">一週內考試</p>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

function getDemoData(): AnalysisData {
    return {
        overview: {
            health_score: 72,
            trend: 15,
            streak: 5
        },
        metrics: {
            study_hours_this_week: 12.5,
            honesty_ratio: 85,
            focus_score: 68,
            card_success_rate: 78,
            due_cards: 23,
            task_completion_rate: 65,
            pending_tasks: 8,
            overdue_tasks: 2,
            upcoming_exams: 3,
            urgent_exams: 1,
            balance_score: 55,
            subject_distribution: { "微積分": 180, "線性代數": 90, "物理": 60 }
        },
        insights: [
            {
                type: "alert",
                category: "exams",
                title: "考試將至",
                description: "1 個考試在一週內，請確認準備狀態",
                priority: "critical"
            },
            {
                type: "warning",
                category: "flashcards",
                title: "閃卡待複習",
                description: "23 張閃卡待複習，建議今天完成",
                priority: "high"
            },
            {
                type: "suggestion",
                category: "focus",
                title: "專注度可提升",
                description: "嘗試番茄工作法提升專注度",
                priority: "medium"
            },
            {
                type: "achievement",
                category: "streak",
                title: "連續學習 5 天！",
                description: "習慣養成中，繼續保持！",
                priority: "positive"
            }
        ],
        recommendations: "1. **優先準備考試**: 一週內有考試，建議今天花 2 小時複習核心章節\n\n2. **清理閃卡積壓**: 23 張閃卡待複習，建議分兩次完成\n\n3. **平衡科目**: 物理學習時間偏少，安排一次 30 分鐘複習\n\n4. **提升專注**: 嘗試 25+5 番茄工作法",
        action_items: [
            {
                title: "準備一週內考試",
                urgency: "now",
                estimated_time: "2 小時",
                link: "/calendar"
            },
            {
                title: "複習 23 張閃卡",
                urgency: "today",
                estimated_time: "20 分鐘",
                link: "/flashcards"
            }
        ]
    };
}
