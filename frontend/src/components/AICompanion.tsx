"use client";

import { useState, useRef, useEffect } from "react";
import {
    MessageCircle,
    Send,
    Sparkles,
    X,
    Trash2,
    Maximize2,
    Minimize2
} from "lucide-react";
import { useAgent } from "@/contexts/AgentContext";

export function AICompanion() {
    const {
        messages,
        isOpen,
        isThinking,
        toggleChat,
        closeChat,
        sendMessage,
        clearMessages
    } = useAgent();

    const [input, setInput] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, messages]);

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;
        const message = input;
        setInput("");
        await sendMessage(message);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        // Cmd/Ctrl + K to toggle
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            toggleChat();
        }
    };

    // Keyboard shortcut to open
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                toggleChat();
            }
            if (e.key === "Escape" && isOpen) {
                closeChat();
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [toggleChat, closeChat, isOpen]);

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={toggleChat}
                className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${isOpen
                        ? "bg-secondary text-foreground scale-90"
                        : "bg-foreground text-background hover:scale-105"
                    }`}
                title="⌘K 開啟 AI 助理"
            >
                {isOpen ? (
                    <X className="w-5 h-5" />
                ) : (
                    <MessageCircle className="w-5 h-5" />
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div
                    className={`fixed z-50 bg-background border border-border/50 shadow-2xl flex flex-col transition-all duration-200 ${isExpanded
                            ? "inset-4 rounded-2xl"
                            : "bottom-20 right-6 w-[380px] h-[500px] rounded-2xl"
                        }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">AI 學習助理</span>
                            <span className="text-xs text-muted-foreground">⌘K</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={clearMessages}
                                className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground"
                                title="清除對話"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground"
                            >
                                {isExpanded ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                                    <Sparkles className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    有什麼我可以幫忙的？
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {[
                                        "解釋這個概念",
                                        "給我學習建議",
                                        "出一題考考我",
                                    ].map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(suggestion)}
                                            className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${message.role === "user"
                                        ? "bg-foreground text-background rounded-br-sm"
                                        : "bg-secondary rounded-bl-sm"
                                    }`}>
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                </div>
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" />
                                        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                                        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-border/50">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="輸入問題..."
                                className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                disabled={isThinking}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isThinking || !input.trim()}
                                className="bg-foreground text-background rounded-xl px-4 disabled:opacity-50 transition-opacity"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
