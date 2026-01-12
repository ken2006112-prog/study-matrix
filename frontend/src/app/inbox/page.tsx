"use client";

import { useEffect, useState } from "react";
import { Task } from "@/types/task";
import { fetchTasks, updateTask, createTask } from "@/lib/api/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, User, ArrowRight, Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InboxItem extends Task {
    source: "ai" | "manual" | "sync";
}

export default function InboxPage() {
    const [items, setItems] = useState<InboxItem[]>([]);
    const [quickAdd, setQuickAdd] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInboxItems();
    }, []);

    const loadInboxItems = async () => {
        try {
            const allTasks = await fetchTasks();
            // Inbox = tasks without due date and not completed
            const inboxTasks = allTasks
                .filter(t => !t.dueDate && !t.isCompleted)
                .map(t => ({
                    ...t,
                    source: Math.random() > 0.5 ? "ai" : "manual" as "ai" | "manual"
                }));
            setItems(inboxTasks as InboxItem[]);
        } catch (error) {
            console.error("Failed to load inbox:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdd = async () => {
        if (!quickAdd.trim()) return;
        try {
            await createTask({
                title: quickAdd,
                priority: 0,
                isCompleted: false
            });
            setQuickAdd("");
            loadInboxItems();
        } catch (error) {
            console.error("Failed to add task:", error);
        }
    };

    const handleScheduleToday = async (taskId: number) => {
        try {
            await updateTask(taskId, {
                dueDate: new Date().toISOString()
            });
            loadInboxItems();
        } catch (error) {
            console.error("Failed to schedule task:", error);
        }
    };

    const handleScheduleLater = async (taskId: number) => {
        // Open date picker - for now, schedule to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        try {
            await updateTask(taskId, {
                dueDate: tomorrow.toISOString()
            });
            loadInboxItems();
        } catch (error) {
            console.error("Failed to schedule task:", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-background sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">📥 收件匣</h1>
                        <p className="text-sm text-muted-foreground">
                            認知緩衝區 - 還沒安排的學習想法
                        </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {items.length} 項目
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <p className="text-muted-foreground">載入中...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-6xl mb-4">✨</div>
                        <h3 className="text-lg font-semibold mb-2">收件匣已清空</h3>
                        <p className="text-sm text-muted-foreground">
                            所有想法都已經安排好了
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map(item => (
                            <InboxItemCard
                                key={item.id}
                                item={item}
                                onScheduleToday={() => handleScheduleToday(item.id)}
                                onScheduleLater={() => handleScheduleLater(item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Add */}
            <div className="px-6 py-4 border-t bg-background/95 backdrop-blur sticky bottom-0">
                <div className="flex gap-2">
                    <Input
                        placeholder="快速記下一個學習想法..."
                        value={quickAdd}
                        onChange={(e) => setQuickAdd(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                        className="flex-1"
                    />
                    <Button onClick={handleQuickAdd}>
                        添加
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface InboxItemCardProps {
    item: InboxItem;
    onScheduleToday: () => void;
    onScheduleLater: () => void;
}

function InboxItemCard({ item, onScheduleToday, onScheduleLater }: InboxItemCardProps) {
    return (
        <div className="group p-4 rounded-lg border bg-card hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
                {/* Source indicator */}
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    item.source === "ai"
                        ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                )}>
                    {item.source === "ai" ? (
                        <Bot className="w-4 h-4" />
                    ) : (
                        <User className="w-4 h-4" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        來源: {item.source === "ai" ? "AI 建議" : "手動添加"}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onScheduleToday}
                        className="h-8 px-2 text-xs"
                    >
                        <ArrowRight className="w-3 h-3 mr-1" />
                        Today
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onScheduleLater}
                        className="h-8 px-2 text-xs"
                    >
                        <Calendar className="w-3 h-3 mr-1" />
                        選日期
                    </Button>
                </div>
            </div>
        </div>
    );
}
