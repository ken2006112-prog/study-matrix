"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, StopCircle, CheckCircle, AlertCircle } from "lucide-react";
import { fetchSubjects, createSession, Subject } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function StudyTimer() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

    // Timer State
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"focus" | "break">("focus");

    // Session Tracking
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [plannedDuration, setPlannedDuration] = useState<number>(25); // Minutes
    const [sessionSaved, setSessionSaved] = useState(false);
    const [interruptions, setInterruptions] = useState(0);
    const [actualSeconds, setActualSeconds] = useState(0); // Track actual elapsed time

    useEffect(() => {
        fetchSubjects().then(setSubjects).catch(console.error);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
                setActualSeconds((prev) => prev + 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            if (mode === "focus") {
                handleStop(); // Auto-save on completion
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    const toggleTimer = () => {
        if (!isActive) {
            // Starting/Resuming
            if (!startTime) {
                setStartTime(new Date());
                setInterruptions(0);
                setActualSeconds(0);
            } else {
                // Resuming after pause - count as interruption
                setInterruptions(prev => prev + 1);
            }
            setIsActive(true);
            setSessionSaved(false);
        } else {
            // Pausing
            setIsActive(false);
        }
    };

    const handleStop = async () => {
        setIsActive(false);
        if (!startTime || !selectedSubjectId || mode === "break") return;

        const endTime = new Date();
        const durationSeconds = actualSeconds;
        const durationMinutes = Math.round(durationSeconds / 60);

        if (durationMinutes < 1) {
            // Ignore very short sessions
            setStartTime(null);
            setTimeLeft(plannedDuration * 60);
            setActualSeconds(0);
            setInterruptions(0);
            return;
        }

        try {
            await createSession({
                subjectId: parseInt(selectedSubjectId),
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: durationMinutes,
                plannedDuration: plannedDuration,
                isFocusMode: true,
                interruptions: interruptions,
                notes: `Completed via Study Timer (${interruptions} interruptions)`
            });
            setSessionSaved(true);
            setStartTime(null);
            setActualSeconds(0);
            setInterruptions(0);
            setTimeout(() => setSessionSaved(false), 3000);
        } catch (e) {
            console.error("Failed to save session", e);
        }
    };

    const resetTimer = () => {
        setIsActive(false);
        setStartTime(null);
        setTimeLeft(plannedDuration * 60);
        setActualSeconds(0);
        setInterruptions(0);
    };

    const handleDurationChange = (val: string) => {
        const min = parseInt(val);
        setPlannedDuration(min);
        setTimeLeft(min * 60);
        setStartTime(null);
        setIsActive(false);
        setActualSeconds(0);
        setInterruptions(0);
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Calculate comparison metrics
    const actualMinutes = Math.floor(actualSeconds / 60);
    const plannedSeconds = plannedDuration * 60;
    const timeAccuracy = startTime && actualSeconds > 0
        ? ((Math.min(actualSeconds, plannedSeconds) / plannedSeconds) * 100).toFixed(0)
        : null;

    return (
        <Card className="w-full h-full shadow-none border-0 bg-transparent">
            <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-medium flex items-center justify-between">
                    <span>Tracker</span>
                    {sessionSaved && <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Saved</span>}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4 p-0">
                {/* Subject Selector */}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Subject</Label>
                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select subject..." />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                        {s.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Duration & Mode */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Goal</Label>
                        <Select value={plannedDuration.toString()} onValueChange={handleDurationChange}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="15">15 min</SelectItem>
                                <SelectItem value="25">25 min</SelectItem>
                                <SelectItem value="45">45 min</SelectItem>
                                <SelectItem value="60">60 min</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mode</Label>
                        <div className="flex bg-muted rounded-md p-1 h-9">
                            <button
                                onClick={() => setMode("focus")}
                                className={cn("flex-1 text-xs rounded-sm transition-all", mode === "focus" ? "bg-background shadow-sm" : "hover:bg-background/50")}
                            >Focus</button>
                            <button
                                onClick={() => setMode("break")}
                                className={cn("flex-1 text-xs rounded-sm transition-all", mode === "break" ? "bg-background shadow-sm" : "hover:bg-background/50")}
                            >Break</button>
                        </div>
                    </div>
                </div>

                {/* Timer Display */}
                <div className="bg-secondary/30 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 border border-border/50">
                    <div className={cn("text-5xl font-mono font-bold tracking-widest tabular-nums transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                        {formatTime(timeLeft)}
                    </div>

                    {/* Stats Row */}
                    {startTime && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <span className="font-medium">{actualMinutes}m</span>
                                <span>elapsed</span>
                            </div>
                            {interruptions > 0 && (
                                <div className="flex items-center gap-1 text-orange-500">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{interruptions} pause{interruptions > 1 ? 's' : ''}</span>
                                </div>
                            )}
                            {timeAccuracy && (
                                <div className="flex items-center gap-1">
                                    <span className={cn(
                                        "font-medium",
                                        parseInt(timeAccuracy) >= 90 ? "text-green-500" :
                                            parseInt(timeAccuracy) >= 70 ? "text-yellow-500" : "text-red-500"
                                    )}>{timeAccuracy}%</span>
                                    <span>on track</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 w-full justify-center">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="rounded-full h-12 w-12"
                            onClick={toggleTimer}
                            disabled={!selectedSubjectId && mode === "focus"}
                        >
                            {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                        </Button>

                        {isActive && (
                            <Button size="icon" variant="destructive" className="rounded-full h-10 w-10" onClick={handleStop}>
                                <StopCircle className="h-5 w-5" />
                            </Button>
                        )}

                        {!isActive && startTime && (
                            <Button size="icon" variant="outline" className="rounded-full h-10 w-10" onClick={handleStop}>
                                <CheckCircle className="h-5 w-5" />
                            </Button>
                        )}

                        {!isActive && !startTime && (
                            <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 opacity-50 hover:opacity-100" onClick={resetTimer}>
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    {!selectedSubjectId && mode === "focus" && (
                        <p className="text-xs text-muted-foreground animate-pulse">Select a subject to start</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
