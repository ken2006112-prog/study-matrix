"use client";

import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Clock, Brain, Book, RefreshCw, PenTool, MessageCircle, Play, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { updateTask } from "@/lib/api/tasks";

interface FocusTaskCardProps {
    task: Task;
    onComplete: () => void;
    onStart: () => void;
}

// Learning type icons mapping
const LEARNING_TYPES = {
    reading: { icon: Book, label: "阅读", color: "text-blue-500" },
    recall: { icon: Brain, label: "主动回忆", color: "text-purple-500" },
    practice: { icon: PenTool, label: "解题练习", color: "text-green-500" },
    review: { icon: RefreshCw, label: "间隔复习", color: "text-orange-500" },
    tutor: { icon: MessageCircle, label: "AI Tutor", color: "text-pink-500" },
};

// Determine learning type from task properties
function getLearningType(task: Task): keyof typeof LEARNING_TYPES {
    // Logic to determine type based on task title, description, or tags
    const title = task.title.toLowerCase();

    if (title.includes("回忆") || title.includes("recall")) return "recall";
    if (title.includes("阅读") || title.includes("reading")) return "reading";
    if (title.includes("练习") || title.includes("practice")) return "practice";
    if (title.includes("复习") || title.includes("review")) return "review";
    if (title.includes("tutor") || title.includes("ai")) return "tutor";

    // Default to recall (most effective learning method)
    return "recall";
}

// Get retention status color
function getRetentionColor(task: Task): string {
    // TODO: Calculate based on FSRS data or last review
    // For now, use priority as proxy
    if (task.priority >= 3) return "border-red-500 bg-red-500/5";
    if (task.priority === 2) return "border-yellow-500 bg-yellow-500/5";
    return "border-green-500 bg-green-500/5";
}

export function FocusTaskCard({ task, onComplete, onStart }: FocusTaskCardProps) {
    const [showWhy, setShowWhy] = useState(false);
    const learningType = getLearningType(task);
    const TypeIcon = LEARNING_TYPES[learningType].icon;

    const handleComplete = async () => {
        try {
            await updateTask(task.id, { isCompleted: true });
            onComplete();
        } catch (error) {
            console.error("Failed to complete task:", error);
        }
    };

    // Generate AI reasoning for why this is the focus task
    const whyToday = generateWhyToday(task);

    return (
        <div className={cn(
            "relative rounded-xl border-2 p-5 transition-all hover:shadow-lg",
            getRetentionColor(task)
        )}>
            {/* Task Content */}
            <div className="space-y-4">
                {/* Header with checkbox and title */}
                <div className="flex items-start gap-3">
                    <button
                        onClick={handleComplete}
                        className="mt-1 flex-shrink-0"
                    >
                        <div className="w-6 h-6 rounded-full border-2 border-primary hover:bg-primary/10 transition-colors" />
                    </button>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {task.title}
                        </h3>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            {/* Learning Type */}
                            <div className={cn("flex items-center gap-1.5", LEARNING_TYPES[learningType].color)}>
                                <TypeIcon className="w-4 h-4" />
                                <span className="font-medium">{LEARNING_TYPES[learningType].label}</span>
                            </div>

                            {/* Estimated Time */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>预估 25min</span>
                            </div>

                            {/* Difficulty */}
                            {task.priority >= 2 && (
                                <div className="flex items-center gap-1.5">
                                    <Brain className="w-4 h-4 text-orange-500" />
                                    <span className="text-orange-500 font-medium">
                                        {task.priority === 3 ? "高难度" : "中难度"}
                                    </span>
                                </div>
                            )}

                            {/* Subject badge */}
                            {task.subject && (
                                <div
                                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: `${task.subject.color}20`,
                                        color: task.subject.color
                                    }}
                                >
                                    {task.subject.name}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Why Today - Collapsible */}
                <div className="border-t pt-3">
                    <button
                        onClick={() => setShowWhy(!showWhy)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                    >
                        <span className="font-medium">Why today?</span>
                        <ChevronDown className={cn(
                            "w-4 h-4 transition-transform",
                            showWhy && "rotate-180"
                        )} />
                    </button>

                    {showWhy && (
                        <div className="mt-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                            {whyToday}
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <Button
                    onClick={onStart}
                    className="w-full gap-2"
                    size="lg"
                >
                    <Play className="w-4 h-4" />
                    开始学习这个任务
                </Button>
            </div>

            {/* Status Indicator (colored bar) */}
            <div className={cn(
                "absolute top-0 left-0 w-1 h-full rounded-l-xl",
                task.priority >= 3 ? "bg-red-500" :
                    task.priority === 2 ? "bg-yellow-500" : "bg-green-500"
            )} />
        </div>
    );
}

// Generate AI reasoning for why this task is prioritized today
function generateWhyToday(task: Task): string {
    const reasons = [];

    if (task.priority === 3) {
        reasons.push("🔴 高优先级任务");
    }

    if (task.dueDate) {
        const daysUntilDue = Math.ceil(
            (new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue === 0) {
            reasons.push("⏰ 今天截止");
        } else if (daysUntilDue <= 3) {
            reasons.push(`📅 还有${daysUntilDue}天截止`);
        }
    }

    // TODO: Add FSRS-based reasoning
    // if (retrievability < 0.8) {
    //     reasons.push("🧠 记忆保留率降至临界点");
    // }

    if (reasons.length === 0) {
        return "AI建议今天完成这个任务以保持学习进度稳定";
    }

    return reasons.join(" • ");
}
