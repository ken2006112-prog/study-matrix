"use client";

import { useEffect, useState } from "react";
import { Task } from "@/types/task";
import { fetchTasks } from "@/lib/api/tasks";
import { Play, Plus, CheckCircle, ChevronRight, Clock, Brain, Sparkles, Zap, Target } from "lucide-react";
import { isToday, format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function TodayPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
    const [focusTask, setFocusTask] = useState<Task | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);
    const [quickAddInput, setQuickAddInput] = useState("");

    useEffect(() => {
        loadTodayTasks();
    }, []);

    const loadTodayTasks = async () => {
        try {
            const allTasks = await fetchTasks();
            const todayTasks = allTasks.filter(task =>
                !task.isCompleted &&
                task.dueDate &&
                isToday(new Date(task.dueDate))
            );
            const completed = allTasks.filter(task =>
                task.isCompleted &&
                task.dueDate &&
                isToday(new Date(task.dueDate))
            );

            const focus = determineFocusTask(todayTasks);
            setFocusTask(focus);
            setTasks(todayTasks.filter(t => t.id !== focus?.id));
            setCompletedTasks(completed);
        } catch (error) {
            console.error("Failed to load tasks:", error);
        }
    };

    const determineFocusTask = (tasks: Task[]): Task | null => {
        if (tasks.length === 0) return null;
        return [...tasks].sort((a, b) => b.priority - a.priority)[0];
    };

    const handleStartLearning = () => {
        if (focusTask) {
            window.location.href = `/study/${focusTask.id}`;
        }
    };

    const currentTime = format(new Date(), "EEEE, M月d日", { locale: zhTW });

    return (
        <div className="min-h-full bg-background">
            {/* Header - Apple style large title */}
            <div className="apple-page pt-12 pb-6">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {currentTime}
                </p>
                <h1 className="text-5xl font-bold tracking-tight text-gradient">Today</h1>
            </div>

            {/* Content */}
            <div className="apple-page pt-0 space-y-8 stagger-children">

                {/* Quick Stats */}
                <section className="grid grid-cols-3 gap-3">
                    <div className="stats-card text-center">
                        <p className="value">{tasks.length + (focusTask ? 1 : 0)}</p>
                        <p className="text-xs text-muted-foreground">待完成</p>
                    </div>
                    <div className="stats-card text-center">
                        <p className="value">{completedTasks.length}</p>
                        <p className="text-xs text-muted-foreground">已完成</p>
                    </div>
                    <div className="stats-card text-center">
                        <p className="value">75%</p>
                        <p className="text-xs text-muted-foreground">專注度</p>
                    </div>
                </section>

                {/* Focus Task - Hero Card */}
                {focusTask && (
                    <section>
                        <div className="premium-card overflow-hidden animate-glow">
                            {/* Gradient header */}
                            <div className="h-1.5 bg-gradient" />

                            <div className="p-6">
                                {/* Label */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="apple-badge">
                                        <Zap className="w-3 h-3" />
                                        Focus
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        AI 推薦最該做的事
                                    </span>
                                </div>

                                {/* Task title */}
                                <h2 className="text-2xl font-bold mb-3">
                                    {focusTask.title}
                                </h2>

                                {/* Subject badge */}
                                {focusTask.subject && (
                                    <div
                                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium mb-4"
                                        style={{
                                            backgroundColor: `${focusTask.subject.color}20`,
                                            color: focusTask.subject.color,
                                            border: `1px solid ${focusTask.subject.color}30`
                                        }}
                                    >
                                        {focusTask.subject.name}
                                    </div>
                                )}

                                {/* Why today - expandable */}
                                <div className="bg-gradient-subtle rounded-xl p-4 mb-6 border border-primary/10">
                                    <p className="text-sm text-muted-foreground flex items-start gap-3">
                                        <Brain className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                                        <span>
                                            根據 FSRS 遺忘曲線，這個概念的記憶保持率正在下降，
                                            今天複習效率最高。
                                        </span>
                                    </p>
                                </div>

                                {/* Action button */}
                                <button
                                    onClick={handleStartLearning}
                                    className="w-full gradient-button text-base py-4"
                                >
                                    <Play className="w-5 h-5" />
                                    開始學習
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Other Tasks */}
                {tasks.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                其他任務
                            </h3>
                            <span className="text-xs text-primary">{tasks.length} 項</span>
                        </div>
                        <div className="apple-card divide-y divide-border/30">
                            {tasks.map((task, idx) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/50 transition-all group"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <button className="w-6 h-6 rounded-full border-2 border-border group-hover:border-primary transition-all flex-shrink-0 group-hover:scale-110" />

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                                            {task.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            {task.subject && (
                                                <span
                                                    className="text-xs font-medium"
                                                    style={{ color: task.subject.color }}
                                                >
                                                    {task.subject.name}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                25分
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <section>
                        <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="flex items-center gap-2 w-full text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 hover:text-foreground transition-colors"
                        >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            已完成 ({completedTasks.length})
                            <ChevronRight className={cn(
                                "w-4 h-4 transition-transform ml-auto",
                                showCompleted && "rotate-90"
                            )} />
                        </button>

                        {showCompleted && (
                            <div className="apple-card divide-y divide-border/30 opacity-70">
                                {completedTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-4 p-4">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="text-sm line-through text-muted-foreground">{task.title}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Empty State */}
                {!focusTask && tasks.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-subtle flex items-center justify-center">
                            <Target className="w-12 h-12 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">今天沒有任務</h3>
                        <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                            很好！你已經完成了所有計劃，或者還沒有添加任務
                        </p>
                        <button className="gradient-button">
                            <Plus className="w-5 h-5" />
                            添加新任務
                        </button>
                    </div>
                )}

                {/* Spacer for bottom bar */}
                <div className="h-24" />
            </div>

            {/* Quick Add - Fixed at bottom */}
            <div className="fixed bottom-20 md:bottom-0 left-0 right-0 p-4 apple-glass border-t border-border/30 md:pl-68">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <input
                        type="text"
                        placeholder="添加任務..."
                        value={quickAddInput}
                        onChange={(e) => setQuickAddInput(e.target.value)}
                        className="apple-input flex-1"
                    />
                    <button className="gradient-button px-5">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
