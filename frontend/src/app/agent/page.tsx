"use client";

import { useState, useEffect, useRef } from "react";
import {
    Brain,
    Send,
    Loader2,
    TrendingUp,
    TrendingDown,
    Zap,
    CheckCircle,
    AlertTriangle,
    Clock,
    Play,
    Trash2,
    Calendar,
    RefreshCw,
    Sparkles,
    MessageCircle,
    ChevronRight
} from "lucide-react";

interface AgentResponse {
    context_summary: string;
    health_score: number;
    weekly_report: any;
    insights: Array<{
        type: string;
        priority: string;
        title: string;
        action_suggestion: string;
    }>;
    ai_advice: string;
    suggested_actions: Array<{
        action: string;
        params: Record<string, any>;
        description: string;
        auto_execute: boolean;
    }>;
    executed_actions: any[];
    conversation_response: string;
}

export default function AgentPage() {
    const [data, setData] = useState<AgentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
    const [executing, setExecuting] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        runAgent();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const runAgent = async (userMessage?: string) => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/agent/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage })
            });

            if (res.ok) {
                const result = await res.json();
                setData(result);

                if (userMessage && result.conversation_response) {
                    setChatHistory(prev => [
                        ...prev,
                        { role: "user", content: userMessage },
                        { role: "agent", content: result.conversation_response }
                    ]);
                }
            }
        } catch (error) {
            console.error("Agent error:", error);
            // Demo data
            setData(getDemoData());
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!message.trim()) return;
        runAgent(message);
        setMessage("");
    };

    const executeAction = async (action: string, params: Record<string, any>, description: string) => {
        setExecuting(action);
        try {
            const res = await fetch("http://localhost:8000/api/v1/agent/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, params })
            });

            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setChatHistory(prev => [
                        ...prev,
                        { role: "system", content: `✅ 已執行: ${description}` }
                    ]);
                    // 重新運行 agent 獲取最新狀態
                    runAgent();
                }
            }
        } catch (error) {
            setChatHistory(prev => [
                ...prev,
                { role: "system", content: `❌ 執行失敗: ${description}` }
            ]);
        } finally {
            setExecuting(null);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-orange-500";
    };

    const getPriorityBg = (priority: string) => {
        switch (priority) {
            case "critical": return "bg-red-500/10 border-red-500/30 text-red-500";
            case "high": return "bg-orange-500/10 border-orange-500/30 text-orange-500";
            case "medium": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-500";
            case "positive": return "bg-green-500/10 border-green-500/30 text-green-500";
            default: return "bg-secondary/30 border-border/30";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient flex items-center justify-center animate-pulse">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-muted-foreground">Agent 分析中...</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold">EduMate Agent</h1>
                            <p className="text-xs text-muted-foreground">智能分析 · 自動執行</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold ${getScoreColor(data.health_score)}`}>
                            {data.health_score}
                        </div>
                        <button
                            onClick={() => runAgent()}
                            className="apple-button-secondary"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6 overflow-y-auto">

                {/* Insights */}
                {data.insights.length > 0 && (
                    <div className="space-y-2">
                        {data.insights.map((insight, i) => (
                            <div key={i} className={`p-4 rounded-xl border ${getPriorityBg(insight.priority)}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium">{insight.title}</p>
                                        <p className="text-sm opacity-80 mt-1">{insight.action_suggestion}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Suggested Actions */}
                {data.suggested_actions.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            建議操作
                        </h3>
                        <div className="space-y-2">
                            {data.suggested_actions.map((action, i) => (
                                <div key={i} className="apple-card p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        {action.action.includes("task") ? <CheckCircle className="w-5 h-5 text-primary" /> :
                                            action.action.includes("plan") ? <Calendar className="w-5 h-5 text-primary" /> :
                                                <Sparkles className="w-5 h-5 text-primary" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{action.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {action.action} · {JSON.stringify(action.params).slice(0, 50)}...
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => executeAction(action.action, action.params, action.description)}
                                        disabled={executing === action.action}
                                        className="gradient-button"
                                    >
                                        {executing === action.action ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Play className="w-4 h-4" />
                                        )}
                                        執行
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat History */}
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        對話
                    </h3>
                    <div className="apple-card p-4 min-h-[200px] max-h-[400px] overflow-y-auto space-y-4">
                        {/* Initial AI Response */}
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient flex-shrink-0 flex items-center justify-center">
                                <Brain className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 bg-secondary/30 rounded-2xl rounded-tl-none p-4">
                                <p className="text-sm whitespace-pre-wrap">{data.ai_advice}</p>
                            </div>
                        </div>

                        {/* Chat History */}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                {msg.role !== "system" && (
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-primary" : "bg-gradient"
                                        }`}>
                                        {msg.role === "user" ? "我" : <Brain className="w-4 h-4 text-white" />}
                                    </div>
                                )}
                                <div className={`flex-1 rounded-2xl p-4 ${msg.role === "user"
                                        ? "bg-primary text-white rounded-tr-none"
                                        : msg.role === "system"
                                            ? "bg-green-500/10 text-green-600 text-center text-sm"
                                            : "bg-secondary/30 rounded-tl-none"
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/30 p-4">
                <div className="max-w-4xl mx-auto flex gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder="問我任何學習相關的問題..."
                        className="apple-input flex-1"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!message.trim()}
                        className="gradient-button px-6"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function getDemoData(): AgentResponse {
    return {
        context_summary: "本週學習 12h，待複習 23 張閃卡，待完成 8 個任務",
        health_score: 72,
        weekly_report: null,
        insights: [
            { type: "alert", priority: "critical", title: "⚠️ 微積分期中考還有 5 天", action_suggestion: "建議今天花 2 小時複習第 1-3 章" },
            { type: "warning", priority: "high", title: "📌 2 個任務已過期", action_suggestion: "建議重新安排或刪除" },
            { type: "achievement", priority: "positive", title: "🔥 連續學習 5 天！", action_suggestion: "繼續保持！" }
        ],
        ai_advice: "👋 嗨！根據分析，你的學習狀態正穩步提升。\n\n🎯 今日建議：\n1. 優先處理 5 天後的考試準備\n2. 清理 2 個過期任務\n3. 複習 15 張閃卡保持記憶\n\n加油！你正在養成良好的學習習慣 💪",
        suggested_actions: [
            { action: "reschedule_task", params: { task_id: 1, new_date: "2026-01-13" }, description: "將「完成作業」重新安排到明天", auto_execute: false },
            { action: "create_study_plan", params: { exam_id: 1, weekly_hours: 10 }, description: "為「微積分期中考」生成80/20學習計劃", auto_execute: false }
        ],
        executed_actions: [],
        conversation_response: ""
    };
}
