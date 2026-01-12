"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Mic, RefreshCw, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    role: "ai" | "user";
    content: string;
    type?: "question" | "feedback" | "explanation";
}

interface AITutorProps {
    subjectName?: string;
    conceptName?: string;
    onClose?: () => void;
}

// Feynman teaching method prompt templates
const QUESTION_TEMPLATES = {
    explain: [
        "不看任何筆記，用你自己的話解釋一下「{concept}」是什麼？",
        "假設我是一個初學者，你要怎麼向我解釋「{concept}」？",
        "「{concept}」的核心概念是什麼？用最簡單的方式說明。"
    ],
    apply: [
        "如果考試這樣出題：{scenario}，你會怎麼解？",
        "「{concept}」在實際應用中會怎麼用到？給我一個例子。",
        "這個概念和「{related}」有什麼關係？"
    ],
    recall: [
        "列出「{concept}」的三個最重要的要點。",
        "「{concept}」和「{related}」有什麼相同和不同的地方？",
        "如果要記住「{concept}」，你會用什麼方法？"
    ]
};

export default function AITutor({ subjectName, conceptName, onClose }: AITutorProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"explain" | "apply" | "recall">("explain");
    const [questionCount, setQuestionCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Start with an initial question
        startSession();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const startSession = () => {
        const concept = conceptName || "這個概念";
        const templates = QUESTION_TEMPLATES[mode];
        const template = templates[Math.floor(Math.random() * templates.length)];
        const question = template.replace("{concept}", concept);

        setMessages([{
            role: "ai",
            content: question,
            type: "question"
        }]);
        setQuestionCount(1);
    };

    const handleSubmit = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            role: "user",
            content: input
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Call AI API for feedback
            const response = await fetch("http://localhost:8000/api/v1/chat/tutor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: input,
                    context: {
                        subject: subjectName,
                        concept: conceptName,
                        mode: mode,
                        history: messages.map(m => ({ role: m.role, content: m.content }))
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();

                // Add AI feedback
                setMessages(prev => [...prev, {
                    role: "ai",
                    content: data.feedback || generateLocalFeedback(input),
                    type: "feedback"
                }]);

                // If we should ask follow-up
                if (questionCount < 3 && data.shouldFollowUp !== false) {
                    setTimeout(() => {
                        askFollowUp();
                    }, 1500);
                }
            } else {
                // Fallback to local generation
                setMessages(prev => [...prev, {
                    role: "ai",
                    content: generateLocalFeedback(input),
                    type: "feedback"
                }]);

                if (questionCount < 3) {
                    setTimeout(() => askFollowUp(), 1500);
                }
            }
        } catch (error) {
            console.error("AI Tutor error:", error);
            // Fallback
            setMessages(prev => [...prev, {
                role: "ai",
                content: generateLocalFeedback(input),
                type: "feedback"
            }]);

            if (questionCount < 3) {
                setTimeout(() => askFollowUp(), 1500);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const generateLocalFeedback = (userAnswer: string): string => {
        const feedbacks = [
            "不錯的解釋！讓我來補充一個重點...",
            "你抓到了核心概念。不過還有一個角度可以思考...",
            "很好的嘗試！讓我們再深入一點...",
            "你講得很清楚。這裡有個小細節可以注意..."
        ];
        return feedbacks[Math.floor(Math.random() * feedbacks.length)];
    };

    const askFollowUp = () => {
        const followUps = [
            "很好！那我再問你一個：這和我們之前學的有什麼關聯？",
            "不錯。那如果換個情境，這個概念怎麼應用？",
            "好的理解！最後一個問題：如果要教別人，你會怎麼說？",
            "理解了。那你覺得這個概念最容易混淆的地方是什麼？"
        ];

        setMessages(prev => [...prev, {
            role: "ai",
            content: followUps[Math.floor(Math.random() * followUps.length)],
            type: "question"
        }]);
        setQuestionCount(prev => prev + 1);
    };

    const handleModeChange = (newMode: "explain" | "apply" | "recall") => {
        setMode(newMode);
        setMessages([]);
        setQuestionCount(0);
        setTimeout(() => {
            const concept = conceptName || "這個概念";
            const templates = QUESTION_TEMPLATES[newMode];
            const template = templates[Math.floor(Math.random() * templates.length)];
            const question = template.replace("{concept}", concept);

            setMessages([{
                role: "ai",
                content: question,
                type: "question"
            }]);
            setQuestionCount(1);
        }, 100);
    };

    const endSession = () => {
        setMessages(prev => [...prev, {
            role: "ai",
            content: `🎉 太棒了！你完成了${questionCount}個主動回憶練習。這種方式比單純閱讀有效3倍！下次見！`,
            type: "feedback"
        }]);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <div>
                            <h2 className="font-semibold">AI Tutor</h2>
                            <p className="text-xs text-muted-foreground">
                                {subjectName && `${subjectName} • `}
                                Feynman 教學法
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                            問題 {questionCount}/3
                        </span>
                    </div>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-2 mt-3">
                    {[
                        { key: "explain", label: "解釋概念", icon: Lightbulb },
                        { key: "apply", label: "應用題", icon: Brain },
                        { key: "recall", label: "主動回憶", icon: RefreshCw }
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => handleModeChange(key as any)}
                            className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                mode === key
                                    ? "bg-purple-600 text-white"
                                    : "bg-muted hover:bg-muted/80"
                            )}
                        >
                            <Icon className="w-3 h-3" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex",
                            message.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-3",
                                message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : message.type === "question"
                                        ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800"
                                        : "bg-muted"
                            )}
                        >
                            {message.type === "question" && (
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs font-medium mb-1">
                                    <Brain className="w-3 h-3" />
                                    主動提問
                                </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-75" />
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-150" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-background">
                {questionCount >= 3 ? (
                    <div className="text-center space-y-3">
                        <p className="text-sm text-muted-foreground">
                            🎉 完成了3個主動回憶練習！
                        </p>
                        <div className="flex justify-center gap-2">
                            <Button variant="outline" onClick={() => {
                                setMessages([]);
                                setQuestionCount(0);
                                startSession();
                            }}>
                                <RefreshCw className="w-4 h-4 mr-1" />
                                再來一輪
                            </Button>
                            <Button onClick={onClose}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                結束學習
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="用你自己的話回答..."
                            className="min-h-[60px] resize-none"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <div className="flex flex-col gap-2">
                            <Button
                                size="icon"
                                onClick={handleSubmit}
                                disabled={!input.trim() || isLoading}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="outline">
                                <Mic className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
