"use client";

import { Task, TaskUpdate } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, X, Calendar as CalendarIcon, Flag, Clock, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Subject {
    id: number;
    name: string;
    color: string;
}

interface TaskDetailProps {
    task: Task;
    onUpdate: (taskId: number, updates: TaskUpdate) => void;
    onDelete: (taskId: number) => void;
    onClose: () => void;
    subjects?: Subject[];
}

export function TaskDetail({ task, onUpdate, onDelete, onClose, subjects = [] }: TaskDetailProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || "");
    const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    const [priority, setPriority] = useState(task.priority.toString());
    const [subjectId, setSubjectId] = useState(task.subjectId?.toString() || "");

    // Sync state when task changes
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || "");
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
        setPriority(task.priority.toString());
        setSubjectId(task.subjectId?.toString() || "");
    }, [task]);

    const getPriorityLabel = (p: number) => {
        switch (p) {
            case 3: return "🔴 High";
            case 2: return "🟠 Medium";
            case 1: return "🔵 Low";
            default: return "⚪ None";
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <Button
                        variant={task.isCompleted ? "default" : "outline"}
                        size="sm"
                        onClick={() => onUpdate(task.id, { isCompleted: !task.isCompleted })}
                    >
                        {task.isCompleted ? "✓ Completed" : "Mark Complete"}
                    </Button>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(task.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <Input
                            className="text-xl font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => title !== task.title && onUpdate(task.id, { title })}
                            placeholder="Task name"
                        />
                    </div>

                    <Separator />

                    {/* Properties */}
                    <div className="space-y-4">
                        {/* Subject */}
                        {subjects.length > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 w-28 text-sm text-muted-foreground">
                                    <BookOpen className="w-4 h-4" />
                                    <span>Subject</span>
                                </div>
                                <Select
                                    value={subjectId}
                                    onValueChange={(val) => {
                                        setSubjectId(val);
                                        onUpdate(task.id, {
                                            subjectId: val === "none" ? undefined : parseInt(val)
                                        });
                                    }}
                                >
                                    <SelectTrigger className="flex-1 h-9">
                                        <SelectValue placeholder="No subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No subject</SelectItem>
                                        {subjects.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                                    {s.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Due Date */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-28 text-sm text-muted-foreground">
                                <CalendarIcon className="w-4 h-4" />
                                <span>Due Date</span>
                            </div>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => {
                                    setDueDate(e.target.value);
                                    onUpdate(task.id, {
                                        dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                                    });
                                }}
                                className="flex-1 h-9"
                            />
                        </div>

                        {/* Priority */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-28 text-sm text-muted-foreground">
                                <Flag className="w-4 h-4" />
                                <span>Priority</span>
                            </div>
                            <Select
                                value={priority}
                                onValueChange={(val) => {
                                    setPriority(val);
                                    onUpdate(task.id, { priority: parseInt(val) });
                                }}
                            >
                                <SelectTrigger className="flex-1 h-9">
                                    <SelectValue>
                                        {getPriorityLabel(parseInt(priority))}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">⚪ None</SelectItem>
                                    <SelectItem value="1">🔵 Low</SelectItem>
                                    <SelectItem value="2">🟠 Medium</SelectItem>
                                    <SelectItem value="3">🔴 High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>Description</span>
                        </Label>
                        <textarea
                            className="w-full min-h-[200px] p-3 bg-muted/30 rounded-md resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 focus:bg-muted/50 transition-colors"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={() => description !== task.description && onUpdate(task.id, { description })}
                            placeholder="Add description..."
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-muted/20">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Created {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
            </div>
        </div>
    );
}
