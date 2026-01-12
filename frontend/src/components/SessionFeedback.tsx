"use client";

import { useState } from "react";
import { X, Star, Zap, Coffee, Brain, Check } from "lucide-react";

interface SessionFeedbackProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: SessionFeedbackData) => void;
    sessionData: {
        duration: number;
        taskTitle: string;
        subjectName: string;
    };
}

export interface SessionFeedbackData {
    focusLevel: number;
    interruptions: number;
    understanding: number;
    feeling: "great" | "okay" | "tired" | "distracted";
    notes: string;
}

const FEELINGS = [
    { value: "great", icon: <Zap className="w-5 h-5" />, label: "超專注", color: "text-green-500" },
    { value: "okay", icon: <Check className="w-5 h-5" />, label: "還不錯", color: "text-blue-500" },
    { value: "tired", icon: <Coffee className="w-5 h-5" />, label: "有點累", color: "text-yellow-500" },
    { value: "distracted", icon: <Brain className="w-5 h-5" />, label: "不太專心", color: "text-red-500" },
];

export function SessionFeedback({ isOpen, onClose, onSubmit, sessionData }: SessionFeedbackProps) {
    const [focusLevel, setFocusLevel] = useState(80);
    const [interruptions, setInterruptions] = useState(0);
    const [understanding, setUnderstanding] = useState(4);
    const [feeling, setFeeling] = useState<"great" | "okay" | "tired" | "distracted">("okay");
    const [notes, setNotes] = useState("");
    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit({
            focusLevel,
            interruptions,
            understanding,
            feeling,
            notes
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-spring">
                {/* Header */}
                <div className="p-6 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">學習完成！🎉</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {sessionData.subjectName} • {sessionData.duration} 分鐘
                            </p>
                        </div>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {step === 1 && (
                        <>
                            {/* Focus Level */}
                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    這次學習的專注程度如何？
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={focusLevel}
                                        onChange={(e) => setFocusLevel(parseInt(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className={`text-2xl font-bold ${focusLevel >= 80 ? "text-green-500" :
                                            focusLevel >= 50 ? "text-yellow-500" : "text-red-500"
                                        }`}>
                                        {focusLevel}%
                                    </span>
                                </div>
                            </div>

                            {/* Feeling */}
                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    你現在感覺如何？
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {FEELINGS.map((f) => (
                                        <button
                                            key={f.value}
                                            onClick={() => setFeeling(f.value as any)}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${feeling === f.value
                                                    ? "bg-primary/10 ring-2 ring-primary"
                                                    : "bg-secondary hover:bg-secondary/80"
                                                }`}
                                        >
                                            <span className={f.color}>{f.icon}</span>
                                            <span className="text-xs">{f.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* Understanding */}
                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    對這次學習的內容理解多少？
                                </label>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setUnderstanding(star)}
                                            className="p-2"
                                        >
                                            <Star
                                                className={`w-8 h-8 transition-all ${star <= understanding
                                                        ? "text-yellow-400 fill-yellow-400"
                                                        : "text-gray-300"
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-center text-sm text-muted-foreground mt-2">
                                    {understanding === 1 && "還需要更多練習"}
                                    {understanding === 2 && "理解了一部分"}
                                    {understanding === 3 && "大致理解"}
                                    {understanding === 4 && "理解得不錯"}
                                    {understanding === 5 && "完全掌握！"}
                                </p>
                            </div>

                            {/* Interruptions */}
                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    學習期間被中斷了幾次？
                                </label>
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => setInterruptions(Math.max(0, interruptions - 1))}
                                        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg"
                                    >
                                        -
                                    </button>
                                    <span className="text-3xl font-bold w-12 text-center">{interruptions}</span>
                                    <button
                                        onClick={() => setInterruptions(interruptions + 1)}
                                        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    任何想記錄的？（選填）
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="例如：這章的某個概念還不太懂..."
                                    className="apple-input h-20 resize-none"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border/50 flex gap-3">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            className="apple-button-secondary flex-1"
                        >
                            上一步
                        </button>
                    )}
                    {step === 1 ? (
                        <button
                            onClick={() => setStep(2)}
                            className="apple-button flex-1"
                        >
                            下一步
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="apple-button flex-1"
                        >
                            完成 ✓
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
