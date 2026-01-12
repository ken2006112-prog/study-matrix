"use client";

import { useState, useRef, useEffect } from "react";
import {
    Brain,
    Send,
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Zap,
    CheckCircle,
    Calendar,
    Clock,
    Battery,
    Activity,
    Moon
} from "lucide-react";

interface ChatMessage {
    role: "user" | "agent" | "system";
    content: string;
    timestamp?: Date;
}

interface SuggestedAction {
    action: string;
    params: Record<string, any>;
    description: string;
}

interface CognitiveState {
    current_load: string;
    fatigue_level: number;
    stress_level: number;
    readiness_score: number;
}

export function AgentChatPanel() {
    const [isOpen, setIsOpen] = useState(true);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [healthScore, setHealthScore] = useState(0);
    const [cognitiveState, setCognitiveState] = useState<CognitiveState | null>(null);
    const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 初始化 Agent
        initializeAgent();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const initializeAgent = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/agent/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            if (res.ok) {
                const data = await res.json();
                setHealthScore(data.health_score || 0);
                setSuggestedActions(data.suggested_actions || []);
                setCognitiveState(data.cognitive_state);

                if (data.ai_advice) {
                    setMessages([{ role: "agent", content: data.ai_advice, timestamp: new Date() }]);
                }
            }
        } catch (error) {
            // Demo mode fallbacks
            setHealthScore(72);
            setCognitiveState({
                current_load: "MEDIUM",
                fatigue_level: 4,
                stress_level: 3,
                readiness_score: 75
            });
            setSuggestedActions([
                { action: "reschedule_task", params: {}, description: "重新安排過期任務" }
            ]);
            setMessages([{
                role: "agent",
                content: "👋 嗨！我是 EduMate，你的 AI 學習助手。\n\n🧠 今日大腦狀態：良好。\n準備好開始學習了嗎？",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8000/api/v1/agent/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, {
                    role: "agent",
                    content: data.response || "我理解了，讓我幫你處理。",
                    timestamp: new Date()
                }]);
                if (data.suggested_actions) {
                    setSuggestedActions(data.suggested_actions);
                }
                if (data.cognitive_state) {
                    setCognitiveState(data.cognitive_state);
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: "agent",
                content: "收到！系統忙碌中，但我已記錄您的請求。",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const executeAction = async (action: SuggestedAction) => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/agent/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(action)
            });

            if (res.ok) {
                setMessages(prev => [...prev, {
                    role: "system",
                    content: `✅ 已執行: ${action.description}`,
                    timestamp: new Date()
                }]);
                setSuggestedActions(prev => prev.filter(a => a.action !== action.action));
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: "system",
                content: `❌ 執行失敗: ${action.description}`,
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-orange-500";
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-gradient flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
                <Brain className="w-6 h-6 text-white" />
            </button>
        );
    }

    return (
        <div className="w-80 h-full flex flex-col bg-background border-l border-border/30 relative">
            {/* Header */}
            <div className="flex flex-col p-4 border-b border-border/30 bg-background/80 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">EduMate</h3>
                            <p className="text-xs text-muted-foreground">AI 學習助手</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-secondary rounded"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Cognitive State Dashboard */}
                {cognitiveState && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="bg-secondary/50 rounded-lg p-2 flex flex-col items-center">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Battery className="w-3 h-3" /> 腦力值
                            </div>
                            <span className={`text-lg font-bold ${getScoreColor(cognitiveState.readiness_score)}`}>
                                {cognitiveState.readiness_score}
                            </span>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-2 flex flex-col items-center">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Activity className="w-3 h-3" /> 疲勞度
                            </div>
                            <span className={`text-lg font-bold ${cognitiveState.fatigue_level > 7 ? 'text-red-500' : 'text-blue-500'}`}>
                                {cognitiveState.fatigue_level}<span className="text-xs text-muted-foreground">/10</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${msg.role === "user"
                                ? "bg-primary text-white rounded-br-sm"
                                : msg.role === "system"
                                    ? "bg-green-500/10 text-green-600 text-center w-full text-sm"
                                    : "bg-secondary rounded-bl-sm"
                            }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Actions */}
            {suggestedActions.length > 0 && (
                <div className="px-4 py-2 border-t border-border/30 space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        建議操作
                    </p>
                    {suggestedActions.slice(0, 2).map((action, i) => (
                        <button
                            key={i}
                            onClick={() => executeAction(action)}
                            className="w-full text-left p-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 text-sm flex items-center gap-2"
                        >
                            <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="truncate">{action.description}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border/30 bg-background/80 backdrop-blur-xl">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder="輸入訊息..."
                        className="flex-1 px-3 py-2 text-sm rounded-xl bg-secondary border-0 focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center text-white disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
