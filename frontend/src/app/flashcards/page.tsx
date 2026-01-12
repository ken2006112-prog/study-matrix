"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Check,
    X,
    Brain,
    Zap,
    Clock,
    Sparkles,
    Trophy,
    Plus
} from "lucide-react";

interface Flashcard {
    id: number;
    front: string;
    back: string;
    subjectId: number;
    stability: number;
    difficulty: number;
    due: string;
}

interface Subject {
    id: number;
    name: string;
    color: string;
}

export default function FlashcardsPage() {
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewComplete, setReviewComplete] = useState(false);
    const [stats, setStats] = useState({ correct: 0, incorrect: 0, total: 0 });

    // Generation Effect & Calibration State
    const [generationStep, setGenerationStep] = useState<"question" | "generating" | "calibration" | "answer">("question");
    const [userThought, setUserThought] = useState("");
    const [confidence, setConfidence] = useState(50); // Default 50%

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch due cards
                const cardsRes = await fetch("http://localhost:8000/api/v1/cards/due");
                if (cardsRes.ok) {
                    const cardsData = await cardsRes.json();
                    setCards(cardsData);
                    setStats(prev => ({ ...prev, total: cardsData.length }));
                }

                // Fetch subjects
                const subjectsRes = await fetch("http://localhost:8000/api/v1/planner/subjects/");
                if (subjectsRes.ok) {
                    const subjectsData = await subjectsRes.json();
                    setSubjects(subjectsData);
                }
            } catch (e) {
                console.error("Failed to fetch flashcards data:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);


    const handleFlipRequest = () => {
        setGenerationStep("generating");
    };

    const confirmGeneration = () => {
        // Move to calibration instead of answer
        setGenerationStep("calibration");
    };

    const confirmConfidence = () => {
        setIsFlipped(true);
        setGenerationStep("answer");
    };

    const handleRating = async (rating: number) => {
        try {
            // Note: Updated endpoint to /study/review/log as per new backend
            // Or keep using cards/.../review but update it to accept confidence?
            // The existing endpoint usage was: fetch(`.../api/v1/cards/${cards[currentIndex].id}/review`...)
            // But I created `POST /api/v1/study/review/log` in new router.
            // I should use the NEW router endpoint for full features.

            await fetch("http://localhost:8000/api/v1/study/review/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    flashcardId: cards[currentIndex].id,
                    rating,
                    confidence: confidence, // Send confidence
                    duration: 0 // Mock duration for now
                })
            });
        } catch {
            console.log("Demo mode or network error");
        }
        if (rating >= 3) {
            setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
        } else {
            setStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
        }

        // Logic for next card
        if (currentIndex < cards.length - 1) {
            setTimeout(() => {
                setIsFlipped(false);
                setGenerationStep("question");
                setUserThought("");
                setConfidence(50); // Reset
                setCurrentIndex(currentIndex + 1);
            }, 200);
        } else {
            setReviewComplete(true);
        }
    };

    const resetReview = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setGenerationStep("question");
        setUserThought("");
        setReviewComplete(false);
        setStats({ correct: 0, incorrect: 0, total: cards.length });
    };

    const getSubject = (subjectId: number) => {
        return subjects.find(s => s.id === subjectId) || { name: "未知", color: "#888" };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient animate-pulse" />
                    <span className="text-muted-foreground">載入卡片...</span>
                </div>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-subtle flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient">今天沒有要複習的卡片！</h1>
                    <p className="text-muted-foreground">明天再來看看，或建立新的閃卡</p>
                    <Link href="/flashcards/create" className="gradient-button inline-flex">
                        <Plus className="w-5 h-5" />
                        建立閃卡
                    </Link>
                </div>
            </div>
        );
    }

    if (reviewComplete) {
        const accuracy = Math.round((stats.correct / stats.total) * 100);
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center space-y-8 max-w-md animate-fade-in-up">
                    <div className="w-28 h-28 mx-auto rounded-full bg-gradient flex items-center justify-center shadow-glow">
                        <Trophy className="w-14 h-14 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-2">複習完成！</h1>
                        <p className="text-muted-foreground">
                            {accuracy >= 80
                                ? "太棒了！你的記憶保持得很好 🌟"
                                : accuracy >= 60
                                    ? "不錯！繼續練習會更好"
                                    : "需要更多練習，別灰心！"
                            }
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="stats-card text-center">
                            <div className="value text-green-500">{stats.correct}</div>
                            <div className="text-xs text-muted-foreground mt-1">記得</div>
                        </div>
                        <div className="stats-card text-center">
                            <div className="value text-red-500">{stats.incorrect}</div>
                            <div className="text-xs text-muted-foreground mt-1">忘記</div>
                        </div>
                        <div className="stats-card text-center">
                            <div className="value">{accuracy}%</div>
                            <div className="text-xs text-muted-foreground mt-1">正確率</div>
                        </div>
                    </div>

                    <button onClick={resetReview} className="gradient-button">
                        <RotateCcw className="w-5 h-5" /> 再練一次
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];
    const subject = getSubject(currentCard.subjectId);
    const progress = ((currentIndex) / cards.length) * 100;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border/30 apple-glass">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Flashcards</h1>
                            <p className="text-xs text-muted-foreground">FSRS 智慧複習</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/flashcards/create" className="apple-button-secondary text-sm px-3 py-2">
                            <Plus className="w-4 h-4" />
                            建立
                        </Link>
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 text-xs font-bold">{stats.correct}</span>
                            <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 text-xs font-bold">{stats.incorrect}</span>
                        </div>
                        <div className="apple-badge">
                            {currentIndex + 1}/{cards.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="px-6 pt-4 max-w-2xl mx-auto w-full">
                <div className="apple-progress">
                    <div className="apple-progress-bar" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Card Area */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div
                    className="w-full max-w-lg"
                    style={{ perspective: "1200px" }}
                >
                    <div
                        className="relative w-full h-[400px]"
                        style={{
                            transformStyle: "preserve-3d",
                            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                    >
                        {/* Front (Question + Generation Input) */}
                        <div
                            className="absolute inset-0 premium-card p-8 flex flex-col"
                            style={{ backfaceVisibility: "hidden" }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: subject.color, boxShadow: `0 0 10px ${subject.color}40` }}
                                />
                                <span className="text-sm font-medium" style={{ color: subject.color }}>{subject.name}</span>
                                <div className="ml-auto apple-badge">
                                    <Sparkles className="w-3 h-3" />
                                    問題
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                <p className="text-2xl text-center font-semibold leading-relaxed">{currentCard.front}</p>

                                {/* Generation Effect Interface */}
                                {generationStep === "question" && (
                                    <button
                                        onClick={handleFlipRequest}
                                        className="mt-4 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm font-medium animate-pulse"
                                    >
                                        <Brain className="w-4 h-4" />
                                        點擊開始思考答案
                                    </button>
                                )}

                                {generationStep === "generating" && (
                                    <div className="w-full animate-fade-in space-y-3">
                                        <textarea
                                            value={userThought}
                                            onChange={(e) => setUserThought(e.target.value)}
                                            placeholder="試著簡述你的答案 (即使不確定)..."
                                            className="w-full p-3 rounded-xl bg-secondary/50 border border-border/50 text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none h-24"
                                            autoFocus
                                        />
                                        <button
                                            onClick={confirmGeneration}
                                            className="w-full gradient-button justify-center"
                                        >
                                            我已構思完成，下一步
                                        </button>
                                    </div>
                                )}

                                {/* Calibration Interface */}
                                {generationStep === "calibration" && (
                                    <div className="w-full animate-fade-in space-y-4">
                                        <p className="text-center font-medium text-muted-foreground">
                                            在看答案前，你有多大信心？(Metacognition)
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-red-500">0%</span>
                                            <input
                                                type="range"
                                                min="0" max="100" step="10"
                                                value={confidence}
                                                onChange={(e) => setConfidence(parseInt(e.target.value))}
                                                className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                            <span className="text-sm font-bold text-green-500">100%</span>
                                        </div>
                                        <div className="text-center text-2xl font-bold text-primary">
                                            {confidence}%
                                        </div>
                                        <button
                                            onClick={confirmConfidence}
                                            className="w-full gradient-button justify-center"
                                        >
                                            <Zap className="w-4 h-4" />
                                            確認並揭曉答案
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-center text-xs text-muted-foreground mt-4">
                                {generationStep === "question" ? "💡 生成效應：主動提取記憶比被動閱讀更有效" :
                                    generationStep === "calibration" ? "⚖️ 元認知校準：評估你的自信程度與實際表現的差距" :
                                        "🧠 試著自己回答，不要直接看答案"}
                            </p>
                        </div>

                        {/* Back */}
                        <div
                            className="absolute inset-0 premium-card p-8 flex flex-col"
                            style={{
                                backfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                                background: "linear-gradient(135deg, var(--color-card) 0%, color-mix(in srgb, var(--color-card) 90%, var(--color-primary)) 100%)"
                            }}
                        >
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-gradient flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-bold text-gradient">答案</span>
                            </div>

                            <div className="flex-1 overflow-y-auto mb-4">
                                <p className="text-xl text-center leading-relaxed">{currentCard.back}</p>

                                {userThought && (
                                    <div className="mt-6 p-4 rounded-lg bg-black/5 dark:bg-white/5 text-sm">
                                        <p className="text-xs text-muted-foreground mb-1">你的回答：</p>
                                        <p className="italic">{userThought}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating Buttons */}
            {isFlipped && (
                <div className="p-6 border-t border-border/30 apple-glass animate-slide-in">
                    <div className="max-w-lg mx-auto">
                        <p className="text-center text-sm text-muted-foreground mb-4">你的回答準確嗎？</p>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { rating: 1, icon: X, label: "完全不懂", color: "red" },
                                { rating: 2, icon: Clock, label: "模糊", color: "orange" },
                                { rating: 3, icon: Check, label: "記得", color: "blue" },
                                { rating: 4, icon: Zap, label: "精通", color: "green" }
                            ].map(({ rating, icon: Icon, label, color }) => (
                                <button
                                    key={rating}
                                    onClick={() => handleRating(rating)}
                                    // ... existing styles
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 active:scale-95
                                        bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 hover:shadow-md`}
                                    style={{
                                        backgroundColor: `var(--color-${color === 'orange' ? 'warning' : color}-100, color-mix(in srgb, ${color === 'red' ? '#ef4444' : color === 'orange' ? '#f97316' : color === 'blue' ? '#3b82f6' : '#22c55e'} 15%, transparent))`,
                                        color: color === 'red' ? '#dc2626' : color === 'orange' ? '#ea580c' : color === 'blue' ? '#2563eb' : '#16a34a'
                                    }}
                                >
                                    <Icon className="w-6 h-6" />
                                    <span className="text-xs font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation (simplified since logic is now linear) */}
            {!isFlipped && generationStep === "question" && (
                <div className="p-6 border-t border-border/30 apple-glass opacity-50 pointer-events-none">
                    {/* Placeholder to keep layout stable */}
                    <div className="h-10"></div>
                </div>
            )}
        </div>
    );
}
