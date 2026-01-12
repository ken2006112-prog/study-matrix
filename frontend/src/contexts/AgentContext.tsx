"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// === Agent Types ===
interface AgentMessage {
    id: string;
    role: "agent" | "user";
    content: string;
    timestamp: Date;
}

interface AgentContextType {
    // State
    messages: AgentMessage[];
    isOpen: boolean;
    isThinking: boolean;

    // Actions
    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
    sendMessage: (message: string) => Promise<void>;
    clearMessages: () => void;

    // Context awareness
    setContext: (context: AgentContext) => void;
}

interface AgentContext {
    currentPage?: string;
    currentSubject?: string;
    currentTopic?: string;
    recentActivity?: string;
}

const AgentContext = createContext<AgentContextType | null>(null);

// === System Prompt (Antigravity-style) ===
const SYSTEM_PROMPT = `你是一個 AI 學習助理，風格類似 Google Antigravity Agent：

核心原則：
1. 不主動打擾用戶
2. 用戶詢問時才提供幫助
3. 回答簡潔、專業、有幫助
4. 使用蘇格拉底式提問引導思考
5. 記住對話上下文

你可以：
- 解釋學習概念
- 提供學習策略建議
- 幫助規劃學習計畫
- 用提問引導理解
- 生成練習題

風格：
- 友善但不過度熱情
- 簡潔精準
- 適時使用 emoji 但不氾濫
- 像一個專業的助教`;

export function AgentProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [context, setContextState] = useState<AgentContext>({});

    const openChat = useCallback(() => setIsOpen(true), []);
    const closeChat = useCallback(() => setIsOpen(false), []);
    const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);
    const clearMessages = useCallback(() => setMessages([]), []);

    const setContext = useCallback((newContext: AgentContext) => {
        setContextState(prev => ({ ...prev, ...newContext }));
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        // Add user message
        const userMessage: AgentMessage = {
            id: Date.now().toString(),
            role: "user",
            content,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsThinking(true);

        try {
            // Build context-aware request
            const contextInfo = context.currentTopic
                ? `（用戶當前在學習：${context.currentSubject || ""}/${context.currentTopic}）`
                : "";

            const res = await fetch("http://localhost:8000/api/v1/ai-tutor/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: 1,
                    message: content + contextInfo,
                    topic: context.currentTopic || "學習",
                    mode: "understanding",
                    context: messages.slice(-10).map(m => ({
                        role: m.role === "agent" ? "assistant" : "user",
                        content: m.content
                    })),
                }),
            });

            let responseText = "";

            if (res.ok) {
                const data = await res.json();
                responseText = data.response;
            } else {
                // Intelligent fallback responses
                responseText = getIntelligentResponse(content, context);
            }

            const agentMessage: AgentMessage = {
                id: (Date.now() + 1).toString(),
                role: "agent",
                content: responseText,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, agentMessage]);
        } catch {
            const agentMessage: AgentMessage = {
                id: (Date.now() + 1).toString(),
                role: "agent",
                content: getIntelligentResponse(content, context),
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, agentMessage]);
        } finally {
            setIsThinking(false);
        }
    }, [messages, context]);

    return (
        <AgentContext.Provider value={{
            messages,
            isOpen,
            isThinking,
            openChat,
            closeChat,
            toggleChat,
            sendMessage,
            clearMessages,
            setContext,
        }}>
            {children}
        </AgentContext.Provider>
    );
}

// === Intelligent Response Generator ===
function getIntelligentResponse(input: string, context: AgentContext): string {
    const lowerInput = input.toLowerCase();

    // Detect intent and respond accordingly
    if (lowerInput.includes("解釋") || lowerInput.includes("什麼是") || lowerInput.includes("explain")) {
        const topic = context.currentTopic || "這個概念";
        return `關於「${topic}」，讓我用簡單的方式解釋：

這是一個需要理解核心原理的概念。試著回答這個問題：如果要用一句話向朋友解釋，你會怎麼說？

這樣的主動思考比閱讀更能加深理解。`;
    }

    if (lowerInput.includes("測驗") || lowerInput.includes("考") || lowerInput.includes("練習")) {
        return `好的，來測試一下！

**問題：** ${context.currentTopic || "這個概念"}的核心要點是什麼？為什麼它重要？

先試著不看筆記回答，這就是主動回憶練習。`;
    }

    if (lowerInput.includes("建議") || lowerInput.includes("策略") || lowerInput.includes("方法")) {
        return `根據認知科學研究，以下策略最有效：

1. **主動回憶** - 合上書回想剛學的內容
2. **間隔重複** - 分散學習比集中更有效
3. **交錯練習** - 混合不同類型的題目

你目前用什麼方法學習？我可以給更具體的建議。`;
    }

    if (lowerInput.includes("計畫") || lowerInput.includes("安排") || lowerInput.includes("規劃")) {
        return `制定學習計畫時，記住 Time Honesty 原則：

• 預估時間通常會偏樂觀
• 建議先追蹤幾天實際學習時間
• 然後根據實際數據調整計畫

你每週大約有多少時間可以學習？`;
    }

    // Default thoughtful response
    return `這是個好問題。讓我們一起思考：

你覺得這個問題最關鍵的部分是什麼？把你的想法告訴我，我們可以一起探討。`;
}

export function useAgent() {
    const context = useContext(AgentContext);
    if (!context) {
        throw new Error("useAgent must be used within AgentProvider");
    }
    return context;
}
