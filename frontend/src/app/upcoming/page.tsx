"use client";

import { useEffect, useState } from "react";
import { Task } from "@/types/task";
import { fetchTasks, updateTask } from "@/lib/api/tasks";
import { Button } from "@/components/ui/button";
import { Check, Clock, ChevronRight, Bot, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, addDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { zhTW } from "date-fns/locale";

interface GroupedTasks {
    label: string;
    tasks: Task[];
}

export default function UpcomingPage() {
    const [groups, setGroups] = useState<GroupedTasks[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUpcomingTasks();
    }, []);

    const loadUpcomingTasks = async () => {
        try {
            const allTasks = await fetchTasks();
            const upcoming = allTasks.filter(t =>
                !t.isCompleted &&
                t.dueDate &&
                !isToday(new Date(t.dueDate))
            );

            // Group by time periods
            const grouped = groupTasksByDate(upcoming);
            setGroups(grouped);
        } catch (error) {
            console.error("Failed to load upcoming:", error);
        } finally {
            setLoading(false);
        }
    };

    const groupTasksByDate = (tasks: Task[]): GroupedTasks[] => {
        const tomorrow: Task[] = [];
        const thisWeek: Task[] = [];
        const nextWeek: Task[] = [];
        const later: Task[] = [];

        const now = new Date();
        const weekEnd = endOfWeek(now);
        const nextWeekEnd = endOfWeek(addDays(now, 7));

        tasks.forEach(task => {
            if (!task.dueDate) return;
            const dueDate = new Date(task.dueDate);

            if (isTomorrow(dueDate)) {
                tomorrow.push(task);
            } else if (isWithinInterval(dueDate, { start: now, end: weekEnd })) {
                thisWeek.push(task);
            } else if (isWithinInterval(dueDate, { start: weekEnd, end: nextWeekEnd })) {
                nextWeek.push(task);
            } else {
                later.push(task);
            }
        });

        const result: GroupedTasks[] = [];
        if (tomorrow.length > 0) result.push({ label: "明天", tasks: tomorrow });
        if (thisWeek.length > 0) result.push({ label: "本週", tasks: thisWeek });
        if (nextWeek.length > 0) result.push({ label: "下週", tasks: nextWeek });
        if (later.length > 0) result.push({ label: "稍後", tasks: later });

        return result;
    };

    const handleAccept = async (taskId: number) => {
        // Mark as accepted (no change needed)
        console.log("Accepted task:", taskId);
    };

    const handlePostpone = async (taskId: number) => {
        try {
            const newDate = addDays(new Date(), 1);
            await updateTask(taskId, { dueDate: newDate.toISOString() });
            loadUpcomingTasks();
        } catch (error) {
            console.error("Failed to postpone:", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-background sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">📅 Upcoming</h1>
                        <p className="text-sm text-muted-foreground">
                            AI 規劃的未來學習計畫
                        </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Bot className="w-4 h-4" />
                        <span>AI 建議可調整</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <p className="text-muted-foreground">載入中...</p>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-6xl mb-4">🎯</div>
                        <h3 className="text-lg font-semibold mb-2">沒有未來任務</h3>
                        <p className="text-sm text-muted-foreground">
                            去 Inbox 安排一些學習計畫吧
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groups.map(group => (
                            <div key={group.label}>
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    {group.label}
                                </h2>
                                <div className="space-y-2">
                                    {group.tasks.map(task => (
                                        <UpcomingTaskCard
                                            key={task.id}
                                            task={task}
                                            onAccept={() => handleAccept(task.id)}
                                            onPostpone={() => handlePostpone(task.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface UpcomingTaskCardProps {
    task: Task;
    onAccept: () => void;
    onPostpone: () => void;
}

function UpcomingTaskCard({ task, onAccept, onPostpone }: UpcomingTaskCardProps) {
    const [showReason, setShowReason] = useState(false);
    const isAISuggested = Math.random() > 0.5; // TODO: Real AI flag

    const formatDueDate = (date: string) => {
        return format(new Date(date), "M/d (EEE)", { locale: zhTW });
    };

    // Generate AI reasoning
    const getAIReason = () => {
        const reasons = [
            "📊 根據遺忘曲線，這個概念需要在這天複習",
            "📅 考試倒數 7 天，建議提前準備",
            "📈 你上次這個主題表現不佳，建議多練習",
            "🔄 間隔複習：距離上次學習已過 3 天"
        ];
        return reasons[Math.floor(Math.random() * reasons.length)];
    };

    return (
        <div className="p-4 rounded-lg border bg-card hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
                {/* AI indicator */}
                {isAISuggested && (
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 dark:bg-purple-900/30">
                        <Bot className="w-3 h-3" />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{task.title}</span>
                        {task.subject && (
                            <span
                                className="px-1.5 py-0.5 rounded text-xs"
                                style={{
                                    backgroundColor: `${task.subject.color}15`,
                                    color: task.subject.color
                                }}
                            >
                                {task.subject.name}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{task.dueDate && formatDueDate(task.dueDate)}</span>
                    </div>

                    {/* AI Reason (collapsible) */}
                    {isAISuggested && (
                        <div className="mt-2">
                            <button
                                onClick={() => setShowReason(!showReason)}
                                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                            >
                                為什麼是這天？
                                <ChevronRight className={cn(
                                    "w-3 h-3 transition-transform",
                                    showReason && "rotate-90"
                                )} />
                            </button>
                            {showReason && (
                                <p className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                    {getAIReason()}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions - Human in the loop */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onAccept}
                        className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                        <Check className="w-3 h-3 mr-1" />
                        接受
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPostpone}
                        className="h-7 px-2 text-xs"
                    >
                        <Clock className="w-3 h-3 mr-1" />
                        延後
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                    >
                        <Edit3 className="w-3 h-3 mr-1" />
                        改
                    </Button>
                </div>
            </div>
        </div>
    );
}
