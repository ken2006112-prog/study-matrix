"use client";

import { Task } from "@/types/task";
import { Clock, Flag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTask, deleteTask } from "@/lib/api/tasks";

interface TodayTaskListProps {
    tasks: Task[];
    onUpdate: () => void;
}

export function TodayTaskList({ tasks, onUpdate }: TodayTaskListProps) {
    const handleComplete = async (taskId: number) => {
        try {
            await updateTask(taskId, { isCompleted: true });
            onUpdate();
        } catch (error) {
            console.error("Failed to complete task:", error);
        }
    };

    const handlePostpone = async (taskId: number) => {
        // TODO: Implement postpone logic
        console.log("Postpone task:", taskId);
    };

    return (
        <div className="space-y-2">
            {tasks.map(task => (
                <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onPostpone={handlePostpone}
                    onClick={() => window.location.href = `/planner?task=${task.id}`}
                />
            ))}
        </div>
    );
}

interface TaskItemProps {
    task: Task;
    onComplete: (id: number) => void;
    onPostpone: (id: number) => void;
    onClick: () => void;
}

function TaskItem({ task, onComplete, onPostpone, onClick }: TaskItemProps) {
    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 3: return "text-red-500";
            case 2: return "text-orange-500";
            case 1: return "text-blue-500";
            default: return "text-transparent";
        }
    };

    const getStatusColor = (priority: number) => {
        // TODO: Use FSRS retrievability data
        switch (priority) {
            case 3: return "border-l-red-500";
            case 2: return "border-l-yellow-500";
            default: return "border-l-green-500";
        }
    };

    return (
        <div
            className={cn(
                "group relative flex items-center gap-3 p-3 rounded-lg border border-l-4 transition-all",
                "hover:bg-muted/50 hover:shadow-sm cursor-pointer",
                getStatusColor(task.priority)
            )}
            onClick={onClick}
        >
            {/* Checkbox */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onComplete(task.id);
                }}
                className="flex-shrink-0"
            >
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary transition-colors" />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{task.title}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {/* Time estimate */}
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>15min</span>
                    </div>

                    {/* Subject */}
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
            </div>

            {/* Priority flag */}
            {task.priority > 0 && (
                <Flag
                    className={cn("w-4 h-4", getPriorityColor(task.priority))}
                    fill="currentColor"
                />
            )}

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
