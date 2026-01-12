"use client";

import { useState, useRef, useEffect } from "react";
import {
    Send,
    X,
    Brain,
    Lightbulb,
    MessageCircle,
    Sparkles,
    RefreshCw
} from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface SocraticChatProps {
    isOpen: boolean;
    onClose: () => void;
    topic?: string;
    subjectName?: string;
}

const PROMPT_TEMPLATES = {
    understanding: [
        "用你自己的話解釋一下「{topic}」是什麼？",
        "如果要教一個完全不懂的人，你會怎麼解釋{topic}？",
        "你覺得{topic}最核心的概念是什麼？"
    ],
    application: [
        "{topic}在現實生活中可以怎麼應用？",
        "如果考試出一題關於{topic}的問題，你預期會怎麼考？",
        "請舉一個{topic}的具體例子。"
    ],
    recall: [
        "不看筆記，你能列出{topic}的關鍵要點嗎？",
        "{topic}最容易混淆的地方是什麼？",
        "你能畫出{topic}的概念關係圖嗎？"
    ]
};

import { useAuth } from "@/contexts/AuthContext";

export function SocraticChat({ isOpen, onClose, topic = "這個概念", subjectName = "學習內容" }: SocraticChatProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<"understanding" | "application" | "recall">("understanding");
    const [useSearch, setUseSearch] = useState(false); // New State
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ... useEffects unchanged ...

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            role: "user",
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8000/api/v1/ai-tutor/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.id || 1,
                    message: input,
                    topic,
                    mode,
                    useSearch, // Pass toggle
                    context: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (res.ok) {
                const data = await res.json();

                let content = data.response;
                // Append sources if available
                if (data.sources && data.sources.length > 0) {
                    content += "\n\n📚 參考資料:\n" + data.sources.map((s: string) => `• ${s}`).join("\n");
                }

                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: content,
                    timestamp: new Date()
                }]);
            } else {
                // ... fallback logic ...
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: "抱歉，連線有點問題，請稍後再試。",
                    timestamp: new Date()
                }]);
            }
        } catch {
            // ... catch logic ...
        }

        setLoading(false);
    };

    const changeMode = (newMode: "understanding" | "application" | "recall") => {
        setMode(newMode);
        const templates = PROMPT_TEMPLATES[newMode];
        const randomQuestion = templates[Math.floor(Math.random() * templates.length)]
            .replace("{topic}", topic);

        setMessages(prev => [...prev, {
            role: "assistant",
            content: `🔄 好，讓我們換個角度！\n\n${randomQuestion}`,
            timestamp: new Date()
        }]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg mx-4 h-[600px] flex flex-col overflow-hidden animate-spring">
                {/* Header */}
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold">AI 蘇格拉底對話</h2>
                            <p className="text-xs text-muted-foreground">{subjectName} • {topic}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mode Selector & Search Toggle */}
                <div className="p-3 border-b border-border/50 flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button onClick={() => changeMode("understanding")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${mode === "understanding" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}><Lightbulb className="w-3 h-3" />理解</button>
                        <button onClick={() => changeMode("application")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${mode === "application" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}><Sparkles className="w-3 h-3" />應用</button>
                        <button onClick={() => changeMode("recall")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${mode === "recall" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}><RefreshCw className="w-3 h-3" />回憶</button>
                    </div>

                    {/* Search Toggle */}
                    <div className="flex items-center gap-2 px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-8 h-4 rounded-full transition-colors relative ${useSearch ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${useSearch ? "left-4.5" : "left-0.5"}`} style={{ left: useSearch ? '18px' : '2px' }} />
                            </div>
                            <input type="checkbox" className="hidden" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                {useSearch ? "🔍 已啟用筆記搜尋 (RAG)" : "🔍 搜尋我的筆記"}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, i) => (
                        <div key={i} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                                ? "bg-primary text-white rounded-br-md"
                                : "bg-secondary text-foreground rounded-bl-md"
                                }`}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border/50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                            placeholder="用你自己的話回答..."
                            className="apple-input flex-1"
                            disabled={loading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="apple-button px-4 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        💡 主動回答比閱讀更能加深記憶
                    </p>
                </div>
            </div>
        </div>
    );
}
