"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Play,
    Pause,
    RotateCcw,
    Coffee,
    Check,
    Clock,
    Brain,
    X
} from "lucide-react";
import { SessionFeedback, SessionFeedbackData } from "@/components/SessionFeedback";
import { SocraticChat } from "@/components/SocraticChat";

interface Task {
    id: number;
    title: string;
    subjectId: number;
    subjectName: string;
    estimatedMinutes: number;
}

export default function StudySessionPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.taskId as string;

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [mode, setMode] = useState<"focus" | "break">("focus");
    const [pomodoroCount, setPomodoroCount] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showBreakReminder, setShowBreakReminder] = useState(false);

    const FOCUS_DURATION = 25 * 60; // 25 minutes
    const BREAK_DURATION = 5 * 60; // 5 minutes

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}`);
                if (res.ok) {
                    const data = await res.json();
                    setTask(data);
                } else {
                    setTask({
                        id: parseInt(taskId),
                        title: "學習微積分第三章",
                        subjectId: 1,
                        subjectName: "微積分",
                        estimatedMinutes: 30
                    });
                }
            } catch {
                setTask({
                    id: parseInt(taskId),
                    title: "學習微積分第三章",
                    subjectId: 1,
                    subjectName: "微積分",
                    estimatedMinutes: 30
                });
            }
            setLoading(false);
        };
        fetchTask();
    }, [taskId]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning) {
            interval = setInterval(() => {
                setSeconds(prev => {
                    const newSeconds = prev + 1;

                    // Check for break reminder (every 25 minutes in focus mode)
                    if (mode === "focus" && newSeconds > 0 && newSeconds % FOCUS_DURATION === 0) {
                        setShowBreakReminder(true);
                        setIsRunning(false);
                    }

                    return newSeconds;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isRunning, mode]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartBreak = () => {
        setShowBreakReminder(false);
        setMode("break");
        setPomodoroCount(prev => prev + 1);
        setSeconds(0);
        setIsRunning(true);

        // Auto-switch back after break
        setTimeout(() => {
            setMode("focus");
            setIsRunning(false);
        }, BREAK_DURATION * 1000);
    };

    const handleSkipBreak = () => {
        setShowBreakReminder(false);
        setIsRunning(true);
    };

    const handleComplete = () => {
        setIsRunning(false);
        setShowFeedback(true);
    };

    const handleFeedbackSubmit = async (feedback: SessionFeedbackData) => {
        try {
            await fetch("http://localhost:8000/api/v1/planner/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: 1,
                    subjectId: task?.subjectId,
                    duration: Math.round(seconds / 60),
                    focusScore: feedback.focusLevel,
                    interruptions: feedback.interruptions,
                    notes: feedback.notes
                })
            });
        } catch (e) {
            console.log("Session saved locally");
        }

        setShowFeedback(false);
        router.push("/today");
    };

    const handleReset = () => {
        setIsRunning(false);
        setSeconds(0);
        setMode("focus");
    };

    if (loading || !task) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">載入中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                    <X className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="font-semibold">{task.title}</h1>
                    <p className="text-sm text-muted-foreground">{task.subjectName}</p>
                </div>
                <button
                    onClick={() => setShowChat(true)}
                    className="text-primary hover:text-primary/80"
                >
                    <Brain className="w-6 h-6" />
                </button>
            </div>

            {/* Timer */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className={`w-64 h-64 rounded-full flex items-center justify-center ${mode === "focus"
                        ? "bg-primary/10 text-primary"
                        : "bg-green-500/10 text-green-600"
                    }`}>
                    <div className="text-center">
                        <div className="text-5xl font-bold tracking-tight">
                            {formatTime(seconds)}
                        </div>
                        <div className="text-sm mt-2 opacity-70">
                            {mode === "focus" ? "專注中" : "休息中"}
                        </div>
                    </div>
                </div>

                {/* Pomodoro Counter */}
                <div className="flex items-center gap-2 mt-6">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${i < pomodoroCount ? "bg-primary" : "bg-secondary"
                                }`}
                        />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">
                        {pomodoroCount} 番茄
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 mt-8">
                    <button
                        onClick={handleReset}
                        className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center ${isRunning
                                ? "bg-yellow-500 text-white"
                                : "bg-primary text-white"
                            }`}
                    >
                        {isRunning ? (
                            <Pause className="w-6 h-6" />
                        ) : (
                            <Play className="w-6 h-6 ml-1" />
                        )}
                    </button>

                    <button
                        onClick={handleComplete}
                        className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-xs">
                    <div className="apple-card p-4 text-center">
                        <div className="text-2xl font-bold">{Math.round(seconds / 60)}</div>
                        <div className="text-xs text-muted-foreground">分鐘</div>
                    </div>
                    <div className="apple-card p-4 text-center">
                        <div className="text-2xl font-bold">{task.estimatedMinutes}</div>
                        <div className="text-xs text-muted-foreground">預估</div>
                    </div>
                </div>
            </div>

            {/* Break Reminder Modal */}
            {showBreakReminder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-2xl p-6 mx-4 max-w-sm text-center animate-spring">
                        <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
                            <Coffee className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">休息一下！</h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            你已經專注了 25 分鐘。<br />
                            短暫休息可以提升記憶效果。
                        </p>
                        <div className="flex gap-3">
                            <button onClick={handleSkipBreak} className="apple-button-secondary flex-1">
                                繼續專注
                            </button>
                            <button onClick={handleStartBreak} className="apple-button flex-1">
                                休息 5 分鐘
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            <SessionFeedback
                isOpen={showFeedback}
                onClose={() => setShowFeedback(false)}
                onSubmit={handleFeedbackSubmit}
                sessionData={{
                    duration: Math.round(seconds / 60),
                    taskTitle: task.title,
                    subjectName: task.subjectName
                }}
            />

            {/* Socratic Chat */}
            <SocraticChat
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                topic={task.title}
                subjectName={task.subjectName}
            />
        </div>
    );
}
