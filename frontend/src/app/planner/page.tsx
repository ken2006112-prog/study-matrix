"use client";

import { useState, useEffect } from "react";
import { TaskLayout } from "@/components/tasks/TaskLayout";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Calendar as CalendarIcon, BookOpen, AlertTriangle, RefreshCw } from "lucide-react";
import { format, isSameWeek } from "date-fns";

interface DeviationInfo {
    deviation: number;
    plannedHours: number;
    actualHours: number;
    status: string;
    message: string;
}

export default function PlannerPage() {
    const [generating, setGenerating] = useState(false);
    const [roadmap, setRoadmap] = useState<any[]>([]);
    const [deviation, setDeviation] = useState<DeviationInfo | null>(null);
    const [replanning, setReplanning] = useState(false);

    useEffect(() => {
        fetchRoadmap();
        fetchDeviation();
    }, []);

    const fetchDeviation = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/planner/check-deviation");
            if (res.ok) setDeviation(await res.json());
        } catch (e) {
            console.error("Failed to fetch deviation", e);
        }
    };

    const handleReplan = async () => {
        if (!confirm("This will redistribute your tasks based on exam urgency. Continue?")) return;
        setReplanning(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/planner/replan", { method: "POST" });
            if (res.ok) {
                alert("Tasks have been replanned!");
                window.location.reload();
            }
        } catch (e) {
            alert("Failed to replan");
        } finally {
            setReplanning(false);
        }
    };

    const fetchRoadmap = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/planner/roadmap");
            if (res.ok) setRoadmap(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/planner/generate", { method: 'POST' });
            const data = await res.json();

            if (data.status === "no_subjects" || data.status === "no_exams") {
                // Redirect to setup page with message
                alert(data.message);
                window.location.href = data.redirect || "/setup";
                return;
            }

            window.location.reload();
        } catch (e) {
            alert("Failed to generate. Please check backend server.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-background">
            {/* Main Task List (Daily View) */}
            <div className="flex-1 border-r relative">
                {/* Deviation Alert Banner */}
                {deviation && deviation.status === "behind" && (
                    <div className="absolute top-0 left-0 right-0 z-20 bg-amber-500/90 text-white px-4 py-3 flex items-center justify-between gap-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">You're {Math.round(deviation.deviation * 100)}% behind schedule</p>
                                <p className="text-xs opacity-90">Planned: {deviation.plannedHours}h | Actual: {deviation.actualHours}h</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleReplan}
                            disabled={replanning}
                        >
                            {replanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                            Auto-Replan
                        </Button>
                    </div>
                )}

                <div className={`flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm absolute w-full z-10 left-0 ${deviation?.status === "behind" ? "top-14" : "top-0"}`}>
                    <h1 className="font-bold text-lg flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Smart Planner
                    </h1>
                    <Button size="sm" onClick={handleGenerate} disabled={generating || roadmap.length > 0}>
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {roadmap.length > 0 ? "Regenerate Plan" : "Auto-Generate Schedule"}
                    </Button>
                </div>
                <div className={`h-full ${deviation?.status === "behind" ? "pt-28" : "pt-16"}`}>
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
