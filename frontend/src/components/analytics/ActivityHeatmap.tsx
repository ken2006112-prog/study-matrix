"use client";

import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, startOfWeek, addDays, getDay } from "date-fns";
import { Loader2 } from "lucide-react";

interface ActivityDay {
    date: string;
    count: number;
    level: number; // 0-4
}

export function ActivityHeatmap() {
    const [data, setData] = useState<Record<string, ActivityDay>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/v1/study/activity");
                const json = await res.json();
                const map: Record<string, ActivityDay> = {};
                json.forEach((item: ActivityDay) => {
                    map[item.date] = item;
                });
                setData(map);
            } catch (error) {
                console.error("Failed to fetch activity:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Generate last 365 days
    const today = new Date();
    const days: Date[] = [];
    // Start from 52 weeks ago
    const startDate = startOfWeek(subDays(today, 365));

    let currentDate = startDate;
    while (currentDate <= today) {
        days.push(currentDate);
        currentDate = addDays(currentDate, 1);
    }

    // Color scales
    const getLevelColor = (level: number) => {
        switch (level) {
            case 1: return "bg-green-200 dark:bg-green-900";
            case 2: return "bg-green-400 dark:bg-green-700";
            case 3: return "bg-green-600 dark:bg-green-500";
            case 4: return "bg-green-800 dark:bg-green-300";
            default: return "bg-muted/30 dark:bg-muted/10";
        }
    };

    if (loading) {
        return <div className="h-32 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[700px]">
                <div className="flex gap-1">
                    {/* We need to group by weeks (columns) */}
                    {Array.from({ length: 53 }).map((_, weekIndex) => {
                        const weekDays = days.slice(weekIndex * 7, (weekIndex + 1) * 7);
                        return (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {weekDays.map((day) => {
                                    const dateStr = format(day, "yyyy-MM-dd");
                                    const activity = data[dateStr];
                                    const level = activity?.level || 0;
                                    const count = activity?.count || 0;

                                    return (
                                        <TooltipProvider key={dateStr}>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <div
                                                        className={`w-3 h-3 rounded-sm ${getLevelColor(level)} hover:ring-2 hover:ring-ring transition-all`}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs">
                                                        {count} studies on {format(day, "MMM d, yyyy")}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-muted/30 dark:bg-muted/10" />
                        <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
                        <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
                        <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
                        <div className="w-3 h-3 rounded-sm bg-green-800 dark:bg-green-300" />
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
