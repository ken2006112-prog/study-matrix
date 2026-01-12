"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Calendar, ChevronRight, BookOpen, GraduationCap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// --- Types ---
interface SetupState {
    step: number;
    semester: {
        name: string;
        start: Date | undefined;
        end: Date | undefined;
        hours: number;
    };
    subjects: Array<{
        id: string; // temp id
        name: string;
        priority: number; // 1-3
        difficulty: number; // 1-10
    }>;
    exams: Array<{
        subjectName: string;
        type: string;
        date: Date | undefined;
        weight: number;
    }>;
}

export default function SetupPage() {
    const router = useRouter();
    const [state, setState] = useState<SetupState>({
        step: 1,
        semester: { name: "", start: undefined, end: undefined, hours: 20 },
        subjects: [],
        exams: []
    });
    const [loading, setLoading] = useState(false);

    // --- Actions ---
    const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
    const prevStep = () => setState(prev => ({ ...prev, step: prev.step - 1 }));

    const handleFinish = async () => {
        setLoading(true);
        try {
            const payload = {
                userId: 1, // Mock
                semester: {
                    semesterName: state.semester.name,
                    startDate: state.semester.start?.toISOString(),
                    endDate: state.semester.end?.toISOString(),
                    weeklyStudyHours: state.semester.hours,
                    learningStyle: "balanced"
                },
                subjects: state.subjects.map(s => ({
                    name: s.name,
                    color: "#000000", // Default
                    priority: s.priority,
                    difficulty: s.difficulty,
                    targetGrade: "A"
                })),
                exams: state.exams.map(e => ({
                    subjectName: e.subjectName,
                    examType: e.type,
                    examDate: e.date?.toISOString(),
                    weight: e.weight
                }))
            };

            const res = await fetch('http://localhost:8000/api/v1/setup/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/dashboard');
            } else {
                alert("Setup failed. Please try again.");
            }
        } catch (e) {
            console.error(e);
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    // --- Render Steps ---

    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">First, let's define the Term</h2>
                <p className="text-muted-foreground">When does your semester start and end?</p>
            </div>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label>Semester Name (e.g. Spring 2026)</Label>
                    <Input
                        value={state.semester.name}
                        onChange={e => setState(p => ({ ...p, semester: { ...p.semester, name: e.target.value } }))}
                        placeholder="Spring 2026"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 flex flex-col">
                        <Label>Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn(!state.semester.start && "text-muted-foreground")}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {state.semester.start ? format(state.semester.start, "PPP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                    mode="single"
                                    selected={state.semester.start}
                                    onSelect={d => setState(p => ({ ...p, semester: { ...p.semester, start: d } }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2 flex flex-col">
                        <Label>End Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn(!state.semester.end && "text-muted-foreground")}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {state.semester.end ? format(state.semester.end, "PPP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                    mode="single"
                                    selected={state.semester.end}
                                    onSelect={d => setState(p => ({ ...p, semester: { ...p.semester, end: d } }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Target Study Hours (Weekly)</Label>
                    <Input
                        type="number"
                        value={state.semester.hours}
                        onChange={e => setState(p => ({ ...p, semester: { ...p.semester, hours: parseInt(e.target.value) } }))}
                    />
                    <p className="text-xs text-muted-foreground">Be honest! This helps the AI avoid burnout.</p>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={nextStep} disabled={!state.semester.name || !state.semester.start || !state.semester.end}>
                    Next: Subjects <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Add your Subjects</h2>
                <p className="text-muted-foreground">Which courses are you taking this term?</p>
            </div>

            <div className="space-y-4">
                {state.subjects.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                        <div className="w-2 h-12 rounded-l-md bg-primary/20" />
                        <div className="flex-1">
                            <h4 className="font-semibold">{sub.name}</h4>
                            <p className="text-xs text-muted-foreground">Priority: {sub.priority === 3 ? "Core (High)" : sub.priority === 2 ? "Medium" : "Low"} · Difficulty: {sub.difficulty}/10</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setState(p => ({ ...p, subjects: p.subjects.filter((_, i) => i !== idx) }))}>
                            Remove
                        </Button>
                    </div>
                ))}

                <div className="p-4 border border-dashed rounded-lg space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Subject Name</Label>
                            <Input id="new-sub-name" placeholder="e.g. Calculus 101" />
                        </div>
                        <div className="space-y-2">
                            <Label>Importance</Label>
                            <select id="new-sub-prio" className="w-full h-10 px-3 rounded-md border text-sm">
                                <option value="3">Core (20% - Must Ace)</option>
                                <option value="2">Standard</option>
                                <option value="1">Elective / Easy</option>
                            </select>
                        </div>
                    </div>
                    <Button variant="secondary" className="w-full" onClick={() => {
                        const nameEl = document.getElementById("new-sub-name") as HTMLInputElement;
                        const prioEl = document.getElementById("new-sub-prio") as HTMLSelectElement;
                        if (!nameEl.value) return;

                        setState(p => ({
                            ...p,
                            subjects: [...p.subjects, {
                                id: Math.random().toString(),
                                name: nameEl.value,
                                priority: parseInt(prioEl.value),
                                difficulty: 5 // Default
                            }]
                        }));
                        nameEl.value = "";
                    }}>
                        <Check className="mr-2 w-4 h-4" /> Add Subject
                    </Button>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep}>Back</Button>
                <Button onClick={nextStep} disabled={state.subjects.length === 0}>
                    Next: Exams <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            </div>
        </div>
    );

    // Simplified Step 3 & 4 for brevity in this turn
    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Key Exam Dates</h2>
                <p className="text-muted-foreground">Add major milestones. Don't worry, you can add more later.</p>
            </div>

            <div className="space-y-4">
                {state.exams.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                            <h4 className="font-semibold">{ex.subjectName} - {ex.type}</h4>
                            <p className="text-xs text-muted-foreground">{ex.date ? format(ex.date, 'PPP') : 'No date'}</p>
                        </div>
                    </div>
                ))}

                <div className="p-4 border border-dashed rounded-lg space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <select id="new-exam-sub" className="w-full h-10 px-3 rounded-md border text-sm">
                                {state.subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <select id="new-exam-type" className="w-full h-10 px-3 rounded-md border text-sm">
                                <option value="Midterm">Midterm</option>
                                <option value="Final">Final</option>
                                <option value="Quiz">Quiz</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2 flex flex-col">
                        <Label>Date</Label>
                        <Input type="date" id="new-exam-date" />
                    </div>

                    <Button variant="secondary" className="w-full" onClick={() => {
                        const subEl = document.getElementById("new-exam-sub") as HTMLSelectElement;
                        const typeEl = document.getElementById("new-exam-type") as HTMLSelectElement;
                        const dateEl = document.getElementById("new-exam-date") as HTMLInputElement;

                        if (!subEl.value || !dateEl.value) return;

                        setState(p => ({
                            ...p,
                            exams: [...p.exams, {
                                subjectName: subEl.value,
                                type: typeEl.value,
                                date: new Date(dateEl.value),
                                weight: 30
                            }]
                        }));
                    }}>
                        <Check className="mr-2 w-4 h-4" /> Add Exam
                    </Button>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep}>Back</Button>
                <Button onClick={handleFinish} disabled={state.exams.length === 0 && false}> {/* Allow skip */}
                    {loading ? "Generating Plan..." : "Finish Setup"}
                </Button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-xl w-full space-y-8">
                {/* Progress */}
                <div className="flex justify-between items-center text-sm text-muted-foreground px-2">
                    <span className={state.step >= 1 ? "text-primary font-bold" : ""}>Term</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={state.step >= 2 ? "text-primary font-bold" : ""}>Subjects</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={state.step >= 3 ? "text-primary font-bold" : ""}>Exams</span>
                </div>

                <div className="bg-card border rounded-2xl p-8 shadow-xl">
                    {state.step === 1 && renderStep1()}
                    {state.step === 2 && renderStep2()}
                    {state.step === 3 && renderStep3()}
                </div>
            </div>
        </div>
    );
}
