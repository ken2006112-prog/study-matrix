"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, BookOpen, Clock, Target, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subject {
    name: string;
    color: string;
    familiarity: number; // 0-100
    hasMidterm: boolean;
    hasFinal: boolean;
    midtermDate?: string;
    finalDate?: string;
}

type Step = "welcome" | "semester" | "subjects" | "time" | "preferences" | "complete";

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState<Step>("welcome");
    const [semesterName, setSemesterName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [weeklyHours, setWeeklyHours] = useState(20);
    const [learningStyle, setLearningStyle] = useState("");

    // Current subject being added
    const [currentSubject, setCurrentSubject] = useState<Partial<Subject>>({
        familiarity: 50,
        hasMidterm: false,
        hasFinal: false
    });

    const addSubject = () => {
        if (currentSubject.name) {
            setSubjects([...subjects, currentSubject as Subject]);
            setCurrentSubject({
                familiarity: 50,
                hasMidterm: false,
                hasFinal: false
            });
        }
    };

    const removeSubject = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        // TODO: Send to backend API
        const config = {
            semesterName,
            startDate,
            endDate,
            weeklyStudyHours: weeklyHours,
            learningStyle,
            subjects
        };
        console.log("Onboarding config:", config);
        onComplete();
    };

    const renderStep = () => {
        switch (step) {
            case "welcome":
                return (
                    <div className="space-y-6 text-center">
                        <div className="space-y-2">
                            <Sparkles className="w-16 h-16 mx-auto text-primary" />
                            <h2 className="text-3xl font-bold">歡迎使用 AI 學習助理！</h2>
                            <p className="text-muted-foreground text-lg">
                                讓我們花幾分鐘了解你的學習需求，<br />我會為你量身打造最佳學習計畫。
                            </p>
                        </div>
                        <Button size="lg" onClick={() => setStep("semester")} className="mt-8">
                            開始設定 <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                );

            case "semester":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">告訴我這個學期的基本資訊</h2>
                            <p className="text-muted-foreground">這讓我能幫你規劃時間安排</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>學期名稱</Label>
                                <Input
                                    placeholder="例如：2024秋季學期"
                                    value={semesterName}
                                    onChange={(e) => setSemesterName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>開始日期</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>結束日期</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep("welcome")}>
                                <ChevronLeft className="mr-2 w-4 h-4" /> 上一步
                            </Button>
                            <Button onClick={() => setStep("subjects")} disabled={!semesterName || !startDate}>
                                下一步 <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                );

            case "subjects":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">你這學期有哪些科目？</h2>
                            <p className="text-muted-foreground">告訴我每科的考試安排和你的熟悉度</p>
                        </div>

                        {/* Added subjects */}
                        {subjects.length > 0 && (
                            <div className="space-y-2">
                                {subjects.map((subject, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }} />
                                            <div>
                                                <p className="font-medium">{subject.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    熟悉度 {subject.familiarity}%
                                                    {subject.hasMidterm && " • 期中"}
                                                    {subject.hasFinal && " • 期末"}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => removeSubject(i)}>
                                            移除
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add new subject */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">新增科目</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>科目名稱</Label>
                                        <Input
                                            placeholder="例如：微積分"
                                            value={currentSubject.name || ""}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>顏色</Label>
                                        <Select
                                            value={currentSubject.color}
                                            onValueChange={(val) => setCurrentSubject({ ...currentSubject, color: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="選擇顏色" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="#3b82f6">藍色</SelectItem>
                                                <SelectItem value="#10b981">綠色</SelectItem>
                                                <SelectItem value="#f59e0b">橙色</SelectItem>
                                                <SelectItem value="#ef4444">紅色</SelectItem>
                                                <SelectItem value="#8b5cf6">紫色</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>目前熟悉度：{currentSubject.familiarity}%</Label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={currentSubject.familiarity}
                                        onChange={(e) => setCurrentSubject({ ...currentSubject, familiarity: parseInt(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={currentSubject.hasMidterm}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, hasMidterm: e.target.checked })}
                                        />
                                        <span className="text-sm">有期中考</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={currentSubject.hasFinal}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, hasFinal: e.target.checked })}
                                        />
                                        <span className="text-sm">有期末考</span>
                                    </label>
                                </div>

                                {currentSubject.hasMidterm && (
                                    <div className="space-y-2">
                                        <Label>期中考日期</Label>
                                        <Input
                                            type="date"
                                            value={currentSubject.midtermDate || ""}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, midtermDate: e.target.value })}
                                        />
                                    </div>
                                )}

                                {currentSubject.hasFinal && (
                                    <div className="space-y-2">
                                        <Label>期末考日期</Label>
                                        <Input
                                            type="date"
                                            value={currentSubject.finalDate || ""}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, finalDate: e.target.value })}
                                        />
                                    </div>
                                )}

                                <Button onClick={addSubject} disabled={!currentSubject.name || !currentSubject.color}>
                                    <BookOpen className="mr-2 w-4 h-4" /> 新增科目
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep("semester")}>
                                <ChevronLeft className="mr-2 w-4 h-4" /> 上一步
                            </Button>
                            <Button onClick={() => setStep("time")} disabled={subjects.length === 0}>
                                下一步 <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                );

            case "time":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">你每週有多少時間可以讀書？</h2>
                            <p className="text-muted-foreground">實話實說，這會讓我的規劃更準確</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center space-y-2">
                                    <Clock className="w-12 h-12 mx-auto text-primary" />
                                    <p className="text-5xl font-bold text-primary">{weeklyHours}</p>
                                    <p className="text-muted-foreground">小時/週</p>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="60"
                                step="5"
                                value={weeklyHours}
                                onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>5小時</span>
                                <span>30小時</span>
                                <span>60小時</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep("subjects")}>
                                <ChevronLeft className="mr-2 w-4 h-4" /> 上一步
                            </Button>
                            <Button onClick={() => setStep("preferences")}>
                                下一步 <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                );

            case "preferences":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">你偏好怎樣的學習方式？</h2>
                            <p className="text-muted-foreground">讓我知道什麼方法對你最有效</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { value: "visual", label: "視覺化學習", icon: "📊" },
                                { value: "reading", label: "閱讀筆記", icon: "📚" },
                                { value: "practice", label: "大量練習", icon: "✍️" },
                                { value: "discussion", label: "討論教學", icon: "💬" }
                            ].map((style) => (
                                <Card
                                    key={style.value}
                                    className={cn(
                                        "cursor-pointer transition-all hover:border-primary",
                                        learningStyle === style.value && "border-primary bg-primary/5"
                                    )}
                                    onClick={() => setLearningStyle(style.value)}
                                >
                                    <CardContent className="pt-6 text-center">
                                        <div className="text-4xl mb-2">{style.icon}</div>
                                        <p className="font-medium">{style.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep("time")}>
                                <ChevronLeft className="mr-2 w-4 h-4" /> 上一步
                            </Button>
                            <Button onClick={handleSubmit} disabled={!learningStyle}>
                                完成設定 <Sparkles className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
            <Card className="w-full max-w-2xl">
                <CardContent className="pt-6">
                    {renderStep()}
                </CardContent>
            </Card>
        </div>
    );
}
