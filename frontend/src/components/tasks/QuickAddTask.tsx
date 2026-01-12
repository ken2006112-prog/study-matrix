"use client";

import { useState } from "react";
import { Plus, Calendar, Flag, Hash, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { TaskCreate } from "@/types/task";

interface Subject {
    id: number;
    name: string;
    color: string;
}

interface QuickAddTaskProps {
    onAddTask: (task: TaskCreate) => Promise<void>;
    subjects: Subject[];
}

export function QuickAddTask({ onAddTask, subjects }: QuickAddTaskProps) {
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [priority, setPriority] = useState<number>(0);
    const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            await onAddTask({
                title,
                dueDate: dueDate ? dueDate.toISOString() : undefined,
                priority,
                subjectId
            });
            // Reset form
            setTitle("");
            setDueDate(undefined);
            setPriority(0);
            setSubjectId(undefined);
            setIsOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const selectedSubject = subjects.find(s => s.id === subjectId);

    // If minimized (closed) state
    if (!isOpen) {
        return (
            <div
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 p-3 text-muted-foreground hover:text-primary cursor-text hover:bg-muted/50 rounded-lg transition-colors group"
            >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm">Add task</span>
            </div>
        );
    }

    return (
        <div className="border border-primary/20 bg-background rounded-xl p-3 shadow-lg ring-1 ring-primary/10 animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                    autoFocus
                    placeholder="e.g., Read Chapter 3 p1 #Calculus"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="border-none shadow-none focus-visible:ring-0 text-base p-0 h-auto placeholder:text-muted-foreground/50"
                />

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                        {/* Due Date Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 text-xs gap-1.5 rounded-md",
                                        dueDate ? "text-green-600 border-green-200 bg-green-50" : "text-muted-foreground border-dashed"
                                    )}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    {dueDate ? format(dueDate, "MMM d") : "Date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={setDueDate}
                                    initialFocus
                                />
                                <div className="p-2 border-t flex justify-between gap-1">
                                    <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => setDueDate(new Date())}>Today</Button>
                                    <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => setDueDate(addDays(new Date(), 1))}>Tomorrow</Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Priority Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 text-xs gap-1.5 rounded-md",
                                        priority === 3 ? "text-red-500 border-red-200 bg-red-50" :
                                            priority === 2 ? "text-orange-500 border-orange-200 bg-orange-50" :
                                                priority === 1 ? "text-blue-500 border-blue-200 bg-blue-50" : "text-muted-foreground border-dashed"
                                    )}
                                >
                                    <Flag className="w-3.5 h-3.5" fill={priority > 0 ? "currentColor" : "none"} />
                                    {priority > 0 ? `P${4 - priority}` : "Priority"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-32 p-1" align="start">
                                <div className="space-y-1">
                                    {[3, 2, 1, 0].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-muted rounded-sm text-sm"
                                        >
                                            <Flag className={cn("w-4 h-4",
                                                p === 3 ? "text-red-500" :
                                                    p === 2 ? "text-orange-500" :
                                                        p === 1 ? "text-blue-500" : "text-muted-foreground"
                                            )} fill={p > 0 ? "currentColor" : "none"} />
                                            <span>{p === 0 ? "None" : `Priority ${4 - p}`}</span>
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Subject Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 text-xs gap-1.5 rounded-md",
                                        selectedSubject ? "text-foreground border-solid bg-background" : "text-muted-foreground border-dashed"
                                    )}
                                    style={selectedSubject ? { borderColor: selectedSubject.color, color: selectedSubject.color } : {}}
                                >
                                    <Hash className="w-3.5 h-3.5" />
                                    {selectedSubject ? selectedSubject.name : "Project"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1" align="start">
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                    <button
                                        type="button"
                                        onClick={() => setSubjectId(undefined)}
                                        className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-muted rounded-sm text-sm"
                                    >
                                        <span className="w-2 h-2 rounded-full border border-muted-foreground" />
                                        <span>No Project</span>
                                    </button>
                                    {subjects.map(s => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setSubjectId(s.id)}
                                            className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-muted rounded-sm text-sm"
                                        >
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                            <span>{s.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                            className="h-7 text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!title.trim() || isLoading}
                            className={cn(
                                "h-7 transition-all rounded-md px-3",
                                title.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}
                        >
                            Add Task <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
