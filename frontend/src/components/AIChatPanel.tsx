"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, X, MessageSquare } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function AIChatPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "你好！我是 Study Matrix AI。你可以問我任何關於你上傳文件的問題，例如：\n\n• 「這份 PDF 的重點是什麼？」\n• 「幫我解釋微積分的基本概念」\n• 「產生 5 個複習問題」"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            // Use the chat endpoint with RAG context
            const res = await fetch("http://localhost:8000/api/v1/chat/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: "assistant", content: data.response || data.message || "抱歉，我無法處理這個請求。" }]);
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: "⚠️ 請確認後端伺服器正在運行，並且已設定 OPENAI_API_KEY。" }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: "assistant", content: "⚠️ 無法連接到 AI 服務。" }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-screen w-96 bg-card border-l shadow-2xl flex flex-col z-50 animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">AI 學習助理</h3>
                        <p className="text-xs text-muted-foreground">問我任何問題</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                        {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                        )}
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === "user"
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-secondary rounded-bl-sm"
                            }`}>
                            {msg.content}
                        </div>
                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary animate-pulse" />
                        </div>
                        <div className="bg-secondary p-3 rounded-2xl rounded-bl-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="問我關於你的學習內容..."
                        className="flex-1 bg-secondary px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Floating toggle button for chat
export function ChatToggleButton({ onClick, hasNewMessage }: { onClick: () => void; hasNewMessage?: boolean }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
        >
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {hasNewMessage && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
        </button>
    );
}
