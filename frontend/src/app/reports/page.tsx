"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    Clock,
    Brain,
    Loader2,
    BookOpen,
    Target,
    Zap,
    Award,
    RefreshCw,
    ChevronRight,
    Lightbulb
} from "lucide-react";

interface WeeklyReport {
    period: {
        start: string;
        end: string;
    };
    stats: {
        total_study_hours: number;
        total_sessions: number;
        honesty_ratio: number;
        subject_distribution: Record<string, number>;
        review_success_rate: number;
        cards_reviewed: number;
        focus_score: number;
        study_streak: number;
        avg_session_duration: number;
        interruptions_count: number;
    };
    analysis: {
        markdown: string;
        generated: boolean;
    };
    research_tips: Array<{
        title: string;
        source: string;
        insight: string;
        action: string;
    }>;
    weekly_score: number;
    generated_at: string;
}

export default function ReportsPage() {
    const [report, setReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/analytics/weekly-report?userId=1");
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        } catch (error) {
            console.error("Failed to fetch report:", error);
            // Use demo data
            setReport(getDemoReport());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchReport();
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    const getScoreGrade = (score: number) => {
        if (score >= 90) return "A+";
        if (score >= 80) return "A";
        if (score >= 70) return "B";
        if (score >= 60) return "C";
        return "D";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-muted-foreground">生成週報中...</span>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">無法載入報告</h2>
                    <button onClick={handleRefresh} className="gradient-button">
                        重試
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">每週學習報告</h1>
                            <p className="text-xs text-muted-foreground">
                                {new Date(report.period.start).toLocaleDateString('zh-TW')} - {new Date(report.period.end).toLocaleDateString('zh-TW')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="apple-button-secondary"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        重新生成
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Weekly Score Card */}
                <div className="premium-card p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-2">本週綜合評分</p>
                    <div className={`text-7xl font-bold mb-2 ${getScoreColor(report.weekly_score)}`}>
                        {report.weekly_score}
                    </div>
                    <div className="inline-block px-4 py-1 rounded-full bg-secondary text-lg font-semibold">
                        {getScoreGrade(report.weekly_score)}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="stats-card text-center">
                        <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold">{report.stats.total_study_hours}h</p>
                        <p className="text-xs text-muted-foreground">學習時數</p>
                    </div>
                    <div className="stats-card text-center">
                        <Target className="w-5 h-5 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold">{report.stats.honesty_ratio}%</p>
                        <p className="text-xs text-muted-foreground">時間誠實度</p>
                    </div>
                    <div className="stats-card text-center">
                        <Brain className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                        <p className="text-2xl font-bold">{report.stats.review_success_rate}%</p>
                        <p className="text-xs text-muted-foreground">複習成功率</p>
                    </div>
                    <div className="stats-card text-center">
                        <Zap className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                        <p className="text-2xl font-bold">{report.stats.focus_score}</p>
                        <p className="text-xs text-muted-foreground">專注度</p>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="apple-card divide-y divide-border/30">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                            <span>學習天數</span>
                        </div>
                        <span className="font-semibold">{report.stats.study_streak}/7 天</span>
                    </div>
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-muted-foreground" />
                            <span>學習次數</span>
                        </div>
                        <span className="font-semibold">{report.stats.total_sessions} 次</span>
                    </div>
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <Brain className="w-5 h-5 text-muted-foreground" />
                            <span>複習閃卡</span>
                        </div>
                        <span className="font-semibold">{report.stats.cards_reviewed} 張</span>
                    </div>
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <span>平均時長</span>
                        </div>
                        <span className="font-semibold">{report.stats.avg_session_duration} 分鐘</span>
                    </div>
                </div>

                {/* AI Analysis */}
                <div className="premium-card overflow-hidden">
                    <div className="p-4 border-b border-border/30 flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">AI 學習分析</h3>
                        {report.analysis.generated && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                AI 生成
                            </span>
                        )}
                    </div>
                    <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{
                            __html: report.analysis.markdown
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>')
                        }} />
                    </div>
                </div>

                {/* Research-Based Tips */}
                {report.research_tips.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            基於科學研究的建議
                        </h3>
                        <div className="space-y-3">
                            {report.research_tips.map((tip, i) => (
                                <div key={i} className="apple-card p-4 hover:bg-secondary/30 transition-colors cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-subtle flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold mb-1">{tip.title}</h4>
                                            <p className="text-sm text-muted-foreground mb-2">{tip.insight}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground italic">
                                                    {tip.source}
                                                </span>
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                    {tip.action}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Subject Distribution */}
                {Object.keys(report.stats.subject_distribution).length > 0 && (
                    <div className="apple-card p-6">
                        <h3 className="font-semibold mb-4">科目分佈</h3>
                        <div className="space-y-3">
                            {Object.entries(report.stats.subject_distribution).map(([subject, minutes], i) => {
                                const totalMinutes = Object.values(report.stats.subject_distribution).reduce((a, b) => a + b, 0);
                                const percentage = (minutes / totalMinutes) * 100;
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>{subject}</span>
                                            <span className="text-muted-foreground">{Math.round(minutes / 60 * 10) / 10}h ({Math.round(percentage)}%)</span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function getDemoReport(): WeeklyReport {
    return {
        period: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
        },
        stats: {
            total_study_hours: 12.5,
            total_sessions: 8,
            honesty_ratio: 85,
            subject_distribution: { "微積分": 180, "線性代數": 120, "物理": 90 },
            review_success_rate: 78,
            cards_reviewed: 45,
            focus_score: 72,
            study_streak: 5,
            avg_session_duration: 45,
            interruptions_count: 12
        },
        analysis: {
            markdown: "## 整體評價\n\n這週表現良好！你保持了不錯的學習節奏，時間誠實度達到 85% 表示計畫能力很強。\n\n## 優勢\n- 連續 5 天學習，習慣正在養成\n- 閃卡複習效率不錯\n\n## 待改進\n- 專注度還有提升空間，建議使用番茄工作法\n- 物理科目時間較少，注意平衡\n\n## 下週目標\n**每天固定時間進行 15 分鐘閃卡複習**",
            generated: true
        },
        research_tips: [
            {
                title: "間隔重複效應",
                source: "Ebbinghaus (1885)",
                insight: "每天固定時間複習比一次性大量複習更有效",
                action: "設定每日複習提醒"
            },
            {
                title: "分散練習效應",
                source: "Cepeda et al. (2006)",
                insight: "將學習分散到多天比集中學習效果更好",
                action: "保持每日學習習慣"
            }
        ],
        weekly_score: 75,
        generated_at: new Date().toISOString()
    };
}
