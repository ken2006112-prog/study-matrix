"use client";

import { Task } from "@/types/task";
import { CheckCircle2, Circle, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast, isThisWeek } from "date-fns";

interface TaskListProps {
    tasks: Task[];
    selectedTaskId: number | null;
    onSelectTask: (taskId: number) => void;
    onToggleComplete: (taskId: number, currentStatus: boolean) => void;
}

interface GroupedTasks {
    overdue: Task[];
    today: Task[];
    tomorrow: Task[];
    thisWeek: Task[];
    later: Task[];
    noDueDate: Task[];
}

export function TaskList({ tasks, selectedTaskId, onSelectTask, onToggleComplete }: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                <p className="text-sm">No tasks</p>
            </div>
        );
    }

    // Group tasks by due date
    const groupedTasks: GroupedTasks = tasks.reduce((groups, task) => {
        if (!task.dueDate) {
            groups.noDueDate.push(task);
            return groups;
        }

        const dueDate = new Date(task.dueDate);

        if (isPast(dueDate) && !isToday(dueDate)) {
            groups.overdue.push(task);
        } else if (isToday(dueDate)) {
            groups.today.push(task);
        } else if (isTomorrow(dueDate)) {
            groups.tomorrow.push(task);
        } else if (isThisWeek(dueDate)) {
            groups.thisWeek.push(task);
        } else {
            groups.later.push(task);
        }

        return groups;
    }, {
        overdue: [],
        today: [],
        tomorrow: [],
        thisWeek: [],
        later: [],
        noDueDate: []
    } as GroupedTasks);

    const renderTaskGroup = (title: string, tasks: Task[], titleColor?: string) => {
        if (tasks.length === 0) return null;

        return (
            <div className="mb-4">
                <div className={cn("px-4 py-2 text-xs font-semibold uppercase tracking-wider", titleColor || "text-muted-foreground")}>
                    {title} <span className="text-muted-foreground/60">({tasks.length})</span>
                </div>
                <div>
                    {tasks.map(task => renderTask(task))}
                </div>
            </div>
        );
    };

    const renderTask = (task: Task) => {
        const priorityColor =
            task.priority === 3 ? "text-red-500" :
                task.priority === 2 ? "text-orange-500" :
                    task.priority === 1 ? "text-blue-500" : "text-transparent";

        return (
            <div
                key={task.id}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-l-2",
                    selectedTaskId === task.id ? "bg-muted border-l-primary" : "border-l-transparent"
                )}
                onClick={() => onSelectTask(task.id)}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(task.id, task.isCompleted);
                    }}
                    className={cn(
                        "shrink-0 text-muted-foreground hover:text-primary transition-colors",
                        task.isCompleted && "text-primary"
                    )}
                >
                    {task.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <Circle className="w-5 h-5" />
                    )}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className={cn(
                            "text-sm font-medium truncate",
                            task.isCompleted && "line-through text-muted-foreground"
                        )}>
                            {task.title}
                        </p>
                        {/* Subject badge */}
                        {task.subject && (
                            <span
                                className="text-xs px-2 py-0.5 rounded-full shrink-0"
                                style={{
                                    backgroundColor: `${task.subject.color}20`,
                                    color: task.subject.color,
                                    borderColor: task.subject.color
                                }}
                            >
                                {task.subject.name}
                            </span>
                        )}
                    </div>
                    {task.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {task.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {task.dueDate && (
                        <div className="text-xs text-muted-foreground">
                            {format(new Date(task.dueDate), "MMM d")}
                        </div>
                    )}

                    {task.priority > 0 && (
                        <Flag className={cn("w-3.5 h-3.5", priorityColor)} fill="currentColor" />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="pb-4">
            {renderTaskGroup("⚠️ Overdue", groupedTasks.overdue, "text-red-600")}
            {renderTaskGroup("⭐ Today", groupedTasks.today, "text-blue-600")}
            {renderTaskGroup("📅 Tomorrow", groupedTasks.tomorrow)}
            {renderTaskGroup("📆 This Week", groupedTasks.thisWeek)}
            {renderTaskGroup("Later", groupedTasks.later)}
            {renderTaskGroup("No Due Date", groupedTasks.noDueDate)}
        </div>
    );
}
