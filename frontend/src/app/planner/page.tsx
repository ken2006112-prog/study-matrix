"use client";

import { useState, useEffect } from "react";
import { TaskLayout } from "@/components/tasks/TaskLayout";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Calendar as CalendarIcon, BookOpen } from "lucide-react";
import { format, isSameWeek } from "date-fns";

export default function PlannerPage() {
    const [generating, setGenerating] = useState(false);
    const [roadmap, setRoadmap] = useState<any[]>([]);

    useEffect(() => {
        fetchRoadmap();
    }, []);

    const fetchRoadmap = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/setup/planner/roadmap"); // Wait, path might be wrong, checking router
            // Route is actually in `planner` router but under `setup` prefix? No, `planner` router is separate.
            // checking main.py... `prefix="/api/v1/planner"` likely used for planner router?
            // Wait, I need to check main.py prefixes.
            const resCorrect = await fetch("http://localhost:8000/api/v1/planner/roadmap");
            if (resCorrect.ok) setRoadmap(await resCorrect.json());
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await fetch("http://localhost:8000/api/v1/planner/generate", { method: 'POST' });
            window.location.reload();
        } catch (e) {
            alert("Failed to generate");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-background">
            {/* Main Task List (Daily View) */}
            <div className="flex-1 border-r relative">
                <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm absolute w-full z-10 top-0 left-0">
                    <h1 className="font-bold text-lg flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Smart Planner
                    </h1>
                    <Button size="sm" onClick={handleGenerate} disabled={generating || roadmap.length > 0}>
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {roadmap.length > 0 ? "Regenerate Plan" : "Auto-Generate Schedule"}
                    </Button>
                </div>
                <div className="pt-16 h-full">
                    <TaskLayout />
                </div>
            </div>

            {/* Semester Roadmap (Side Panel) */}
            <div className="w-80 bg-sidebar/30 border-l p-4 overflow-y-auto hidden md:block">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Semester Roadmap</h3>

                <div className="space-y-6">
                    {roadmap.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No study plan yet. <br />Click "Auto-Generate" to build one!
                        </div>
                    )}

                    {/* Group by Exam */}
                    {Array.from(new Set(roadmap.map(p => p.exam.subject.name))).map(subjectName => (
                        <div key={subjectName}>
                            <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                {subjectName}
                            </h4>
                            <div className="pl-3 border-l-2 border-primary/20 space-y-3">
                                {roadmap.filter(p => p.exam.subject.name === subjectName).map((plan, i) => (
                                    <div key={i} className="relative pl-4 pt-1">
                                        {/* Dot */}
                                        <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-background border border-primary/50" />

                                        <div className="text-xs text-muted-foreground mb-0.5">
                                            {format(new Date(plan.weekStart), 'MMM d')} - {format(new Date(plan.weekEnd), 'MMM d')}
                                        </div>
                                        <div className="text-sm font-medium bg-card border rounded-md p-2 shadow-sm">
                                            Phase: {JSON.parse(plan.tasks)[0].split(':')[1]}
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Target: {plan.totalHours}h
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
