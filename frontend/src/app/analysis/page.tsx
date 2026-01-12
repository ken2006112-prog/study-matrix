"use client";

import { useState, useEffect } from "react";
import { Loader2, Brain, Trophy, Calendar, Clock, Target, ArrowUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Report {
    period: { start: string; end: string };
    stats: {
        total_study_hours: number;
        study_streak: number;
        honesty_ratio: number;
        review_success_rate: number;
        focus_score: number;
        subject_distribution: Record<string, number>;
        recent_sessions_log: Array<{
            subject: string;
            duration: number;
            date: string;
            type: string;
        }>;
    };
    analysis: {
        markdown: string;
        generated: boolean;
    };
    research_tips: Array<{
        title: string;
        insight: string;
        action: string;
    }>;
    weekly_score: number;
}

export default function AnalysisPage() {
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:8000/api/v1/analytics/weekly-report")
            .then(res => res.json())
            .then(data => setReport(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Gathering your learning data...</p>
            </div>
        );
    }

    if (!report) return <div>Failed to load report.</div>;

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Brain className="w-8 h-8 text-primary" />
                    Neural Analysis
                </h1>
                <p className="text-muted-foreground mt-2">
                    Weekly cognitive performance report · {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                </p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-border flex items-center justify-between">
                    <div>
                        <div className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Weekly Score</div>
                        <div className={`text-5xl font-bold mt-2 ${getScoreColor(report.weekly_score)}`}>
                            {report.weekly_score}
                        </div>
                    </div>
                    <div className="p-4 bg-secondary/20 rounded-full">
                        <Trophy className={`w-8 h-8 ${getScoreColor(report.weekly_score)}`} />
                    </div>
                </div>

                {/* Hours Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <Clock className="w-4 h-4" />
                        <span>Total Focus</span>
                    </div>
                    <div className="text-3xl font-bold">{report.stats.total_study_hours} h</div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <ArrowUp className="w-3 h-3" />
                        <span>{report.stats.study_streak} day streak</span>
                    </div>
                </div>

                {/* Cognitive State */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <Target className="w-4 h-4" />
                        <span>Cognitive State</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span>Focus</span>
                            <span className="font-medium">{report.stats.focus_score}/100</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all" style={{ width: `${report.stats.focus_score}%` }} />
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Retention</span>
                            <span className="font-medium">{report.stats.review_success_rate}%</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full transition-all" style={{ width: `${report.stats.review_success_rate}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-2xl border bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
                        <div className="flex items-center gap-2 mb-4">
                            <Brain className="w-5 h-5 text-indigo-600" />
                            <h2 className="font-semibold text-indigo-900 dark:text-indigo-300">AI Coach Assessment</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                            <ReactMarkdown>{report.analysis.markdown}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Subject Breakdown (Simple List for now) */}
                    <div>
                        <h3 className="font-semibold mb-4 text-lg">Subject Distribution</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(report.stats.subject_distribution).map(([subject, hours]) => (
                                <div key={subject} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                                    <span className="font-medium">{subject}</span>
                                    <span className="text-muted-foreground">{Math.round((hours as number) / 60 * 10) / 10}h</span>
                                </div>
                            ))}
                            {Object.keys(report.stats.subject_distribution).length === 0 && (
                                <div className="text-muted-foreground text-sm col-span-2 text-center py-4">No data yet</div>
                            )}
                        </div>
                    </div>

                    {/* Recent History Log */}
                    <div>
                        <h3 className="font-semibold mb-4 text-lg">Recent Logs</h3>
                        <div className="space-y-3">
                            {report.stats.recent_sessions_log?.map((log, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-card/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{log.subject}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(log.date).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium">{log.duration} min</div>
                                </div>
                            ))}
                            {(!report.stats.recent_sessions_log || report.stats.recent_sessions_log.length === 0) && (
                                <div className="text-muted-foreground text-sm text-center py-4">No recent sessions recorded.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Research Tips */}
                <div className="space-y-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Scientifically Proven Tips
                    </h3>
                    <div className="space-y-4">
                        {report.research_tips.map((tip, i) => (
                            <div key={i} className="p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30">
                                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">{tip.title}</h4>
                                <p className="text-xs text-amber-700/80 dark:text-amber-400 mb-2">{tip.insight}</p>
                                <div className="flex items-start gap-2 mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/30">
                                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span className="text-xs font-medium text-amber-800 dark:text-amber-200">{tip.action}</span>
                                </div>
                            </div>
                        ))}
                        {report.research_tips.length === 0 && (
                            <div className="text-sm text-muted-foreground">Keep studying to generate personalized tips!</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
