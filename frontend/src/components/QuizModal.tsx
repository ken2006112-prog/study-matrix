"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, BookOpen } from "lucide-react";

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface QuizModalProps {
    questions: Question[];
    onClose: () => void;
}

export function QuizModal({ questions, onClose }: QuizModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);

    const question = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;

    const handleAnswer = (idx: number) => {
        setSelectedOption(idx);
        setShowExplanation(true);
        if (idx === question.correctIndex) {
            setScore(s => s + 1);
        }
    };

    const next = () => {
        if (isLast) onClose();
        else {
            setCurrentIndex(i => i + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        }
    };

    if (!question) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border shadow-lg rounded-xl max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        AI Quiz Mode
                    </h2>
                    <span className="text-sm font-medium text-muted-foreground">
                        Question {currentIndex + 1} / {questions.length}
                    </span>
                </div>

                <div className="space-y-4">
                    <p className="text-lg font-medium">{question.question}</p>

                    <div className="grid gap-3">
                        {question.options.map((opt, idx) => {
                            const isSelected = selectedOption === idx;
                            const isCorrect = idx === question.correctIndex;

                            let variant = "outline";
                            if (showExplanation) {
                                if (isCorrect) variant = "success"; // Green
                                else if (isSelected) variant = "destructive"; // Red
                            }

                            return (
                                <button
                                    key={idx}
                                    disabled={showExplanation}
                                    onClick={() => handleAnswer(idx)}
                                    className={`text-left p-3 rounded-lg border transition-all 
                                        ${isSelected ? 'ring-2 ring-primary' : ''}
                                        ${showExplanation && isCorrect ? 'bg-green-100 border-green-500 dark:bg-green-900/30' : ''}
                                        ${showExplanation && isSelected && !isCorrect ? 'bg-red-100 border-red-500 dark:bg-red-900/30' : ''}
                                        ${!showExplanation ? 'hover:bg-accent' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 flex items-center justify-center rounded-full border text-xs">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        {opt}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {showExplanation && (
                    <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2 animate-in fade-in slide-in-from-top-2">
                        <div className="font-semibold flex items-center gap-2">
                            {selectedOption === question.correctIndex ? (
                                <span className="text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Correct!</span>
                            ) : (
                                <span className="text-red-600 flex items-center gap-1"><X className="w-4 h-4" /> Incorrect</span>
                            )}
                        </div>
                        <p>{question.explanation}</p>
                    </div>
                )}

                <div className="flex justify-between items-center pt-2">
                    <div className="text-sm text-muted-foreground">
                        Score: {score} / {questions.length}
                    </div>
                    <Button onClick={next} disabled={!showExplanation}>
                        {isLast ? "Finish" : "Next Question"} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
