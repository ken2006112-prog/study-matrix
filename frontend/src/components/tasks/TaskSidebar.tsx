"use client";

import { Inbox, Star, Calendar, BookOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type SmartList = "inbox" | "today" | "next7days";

interface Subject {
    id: number;
    name: string;
    color: string;
}

interface TaskSidebarProps {
    selectedList: SmartList | number; // Can be smart list or subject ID
    onSelectList: (list: SmartList | number) => void;
    taskCounts?: {
        inbox: number;
        today: number;
        next7days: number;
        bySubject?: Record<number, number>;
    };
    subjects?: Subject[];
}

export function TaskSidebar({ selectedList, onSelectList, taskCounts, subjects = [] }: TaskSidebarProps) {
    const smartLists = [
        {
            id: "inbox" as SmartList,
            label: "Inbox",
            icon: Inbox,
            count: taskCounts?.inbox || 0
        },
        {
            id: "today" as SmartList,
            label: "Today",
            icon: Star,
            count: taskCounts?.today || 0
        },
        {
            id: "next7days" as SmartList,
            label: "Next 7 Days",
            icon: Calendar,
            count: taskCounts?.next7days || 0
        }
    ];

    const [showSubjects, setShowSubjects] = useState(true);

    return (
        <div className="w-64 bg-muted/30 border-r flex flex-col h-full">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Lists</h2>
            </div>

            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Smart Lists */}
                {smartLists.map((list) => {
                    const Icon = list.icon;
                    const isSelected = selectedList === list.id;

                    return (
                        <button
                            key={list.id}
                            onClick={() => onSelectList(list.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all",
                                "hover:bg-muted/80",
                                isSelected && "bg-primary/10 text-primary font-medium"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={cn("w-5 h-5", isSelected && "text-primary")} />
                                <span className="text-sm">{list.label}</span>
                            </div>
                            {list.count > 0 && (
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    {list.count}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Subjects Section */}
                {subjects.length > 0 && (
                    <>
                        <div className="pt-4 pb-2 px-3 flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Subjects
                            </h3>
                            <button
                                onClick={() => setShowSubjects(!showSubjects)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <svg
                                    className={cn("w-4 h-4 transition-transform", showSubjects && "rotate-90")}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {showSubjects && subjects.map((subject) => {
                            const isSelected = selectedList === subject.id;
                            const count = taskCounts?.bySubject?.[subject.id] || 0;

                            return (
                                <button
                                    key={subject.id}
                                    onClick={() => onSelectList(subject.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all",
                                        "hover:bg-muted/80",
                                        isSelected && "bg-primary/10 text-primary font-medium"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: subject.color }}
                                        />
                                        <span className="text-sm truncate">{subject.name}</span>
                                    </div>
                                    {count > 0 && (
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full shrink-0",
                                            isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </>
                )}
            </nav>
        </div>
    );
}
