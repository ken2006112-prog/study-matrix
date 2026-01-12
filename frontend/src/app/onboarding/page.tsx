"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    GraduationCap,
    Calendar,
    Clock,
    Brain,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Plus,
    X,
    Check
} from "lucide-react";

interface Subject {
    name: string;
    color: string;
    familiarity: number;
}

interface Exam {
    subjectName: string;
    type: string;
    date: string;
}

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Welcome
    const [userName, setUserName] = useState("");

    // Step 2: Subjects
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [newSubject, setNewSubject] = useState("");

    // Step 3: Exams
    const [exams, setExams] = useState<Exam[]>([]);

    // Step 4: Time
    const [weeklyHours, setWeeklyHours] = useState(15);
    const [preferredTime, setPreferredTime] = useState("evening");

    // Step 5: Learning style
    const [learningStyle, setLearningStyle] = useState("balanced");

    const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"];

    const addSubject = () => {
        if (newSubject.trim()) {
            setSubjects([...subjects, {
                name: newSubject.trim(),
                color: COLORS[subjects.length % COLORS.length],
                familiarity: 50
            }]);
            setNewSubject("");
        }
    };

    const removeSubject = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    const updateFamiliarity = (index: number, value: number) => {
        const updated = [...subjects];
        updated[index].familiarity = value;
        setSubjects(updated);
    };

    const addExam = (subjectName: string) => {
        setExams([...exams, {
            subjectName,
            type: "midterm",
            date: ""
        }]);
    };

    const updateExam = (index: number, field: string, value: string) => {
        const updated = [...exams];
        (updated[index] as any)[field] = value;
        setExams(updated);
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Create user
            const userRes = await fetch("http://localhost:8000/api/v1/planner/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: `${userName.toLowerCase().replace(/\s/g, '')}@example.com`, name: userName })
            });
            const user = await userRes.json();

            // Create subjects
            for (const subject of subjects) {
                await fetch("http://localhost:8000/api/v1/planner/subjects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: subject.name, color: subject.color, userId: user.id })
                });
            }

            // Create semester config
            await fetch("http://localhost:8000/api/v1/semester/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    subjects: subjects.map((s, i) => ({
                        name: s.name,
                        familiarity: s.familiarity,
                        examDate: exams.find(e => e.subjectName === s.name)?.date || null,
                        weeklyTopics: 3
                    })),
                    weeklyAvailableHours: weeklyHours,
                    semesterEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                })
            });

            router.push("/today");
        } catch (error) {
            console.error("Setup failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { icon: <Sparkles className="w-6 h-6" />, title: "歡迎" },
        { icon: <GraduationCap className="w-6 h-6" />, title: "科目" },
        { icon: <Calendar className="w-6 h-6" />, title: "考試" },
        { icon: <Clock className="w-6 h-6" />, title: "時間" },
        { icon: <Brain className="w-6 h-6" />, title: "學習風格" },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Progress */}
            <div className="p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        {steps.map((s, i) => (
                            <div key={i} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${i + 1 === step ? "bg-primary text-white" :
                                        i + 1 < step ? "bg-green-500 text-white" :
                                            "bg-secondary text-muted-foreground"
                                    }`}>
                                    {i + 1 < step ? <Check className="w-5 h-5" /> : s.icon}
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`w-12 h-1 mx-1 rounded ${i + 1 < step ? "bg-green-500" : "bg-secondary"
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-lg animate-fade-in-up">

                    {/* Step 1: Welcome */}
                    {step === 1 && (
                        <div className="text-center space-y-6">
                            <div className="text-6xl">👋</div>
                            <h1 className="text-3xl font-bold">歡迎使用 AI 學習助理</h1>
                            <p className="text-muted-foreground">
                                讓我們花 2 分鐘設定你的個人化學習計畫
                            </p>
                            <div className="pt-4">
                                <label className="block text-sm font-medium mb-2 text-left">你的名字是？</label>
                                <Input
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="輸入你的名字"
                                    className="apple-input text-center text-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Subjects */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold">這學期你在學什麼？</h1>
                                <p className="text-muted-foreground mt-2">添加你的科目，我會幫你安排學習計畫</p>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    placeholder="輸入科目名稱（如：微積分）"
                                    className="apple-input"
                                    onKeyDown={(e) => e.key === "Enter" && addSubject()}
                                />
                                <button onClick={addSubject} className="apple-button px-4">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {subjects.map((subject, i) => (
                                    <div key={i} className="apple-card p-4 flex items-center gap-4">
                                        <div
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: subject.color }}
                                        />
                                        <span className="font-medium flex-1">{subject.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">熟悉度</span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={subject.familiarity}
                                                onChange={(e) => updateFamiliarity(i, parseInt(e.target.value))}
                                                className="w-20"
                                            />
                                            <span className="text-xs w-8">{subject.familiarity}%</span>
                                        </div>
                                        <button onClick={() => removeSubject(i)} className="text-muted-foreground hover:text-destructive">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {subjects.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    還沒有科目，添加一個開始吧！
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Exams */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold">有什麼重要考試？</h1>
                                <p className="text-muted-foreground mt-2">我會根據考試日期優化你的學習計畫</p>
                            </div>

                            <div className="space-y-4">
                                {subjects.map((subject, i) => {
                                    const exam = exams.find(e => e.subjectName === subject.name);
                                    return (
                                        <div key={i} className="apple-card p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                                                <span className="font-medium">{subject.name}</span>
                                            </div>
                                            {exam ? (
                                                <div className="flex gap-3">
                                                    <select
                                                        value={exam.type}
                                                        onChange={(e) => updateExam(exams.indexOf(exam), "type", e.target.value)}
                                                        className="apple-input flex-1"
                                                    >
                                                        <option value="midterm">期中考</option>
                                                        <option value="final">期末考</option>
                                                        <option value="quiz">小考</option>
                                                    </select>
                                                    <input
                                                        type="date"
                                                        value={exam.date}
                                                        onChange={(e) => updateExam(exams.indexOf(exam), "date", e.target.value)}
                                                        className="apple-input flex-1"
                                                    />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addExam(subject.name)}
                                                    className="apple-button-secondary w-full"
                                                >
                                                    <Plus className="w-4 h-4" /> 添加考試
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Time */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold">每週能學習多少時間？</h1>
                                <p className="text-muted-foreground mt-2">誠實回答，我會幫你制定可持續的計畫</p>
                            </div>

                            <div className="apple-card p-6 text-center">
                                <div className="text-5xl font-bold text-primary mb-2">{weeklyHours}</div>
                                <div className="text-muted-foreground mb-4">小時 / 週</div>
                                <input
                                    type="range"
                                    min="5"
                                    max="40"
                                    value={weeklyHours}
                                    onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>5 小時</span>
                                    <span>40 小時</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium">你偏好什麼時間學習？</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: "morning", label: "早上 🌅", desc: "6-12點" },
                                        { value: "afternoon", label: "下午 ☀️", desc: "12-18點" },
                                        { value: "evening", label: "晚上 🌙", desc: "18-24點" },
                                    ].map((time) => (
                                        <button
                                            key={time.value}
                                            onClick={() => setPreferredTime(time.value)}
                                            className={`apple-card p-4 text-center transition-all ${preferredTime === time.value ? "ring-2 ring-primary" : ""
                                                }`}
                                        >
                                            <div className="text-lg">{time.label}</div>
                                            <div className="text-xs text-muted-foreground">{time.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Learning Style */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold">最後一個問題 ✨</h1>
                                <p className="text-muted-foreground mt-2">你偏好什麼學習方式？</p>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { value: "reading", label: "📖 閱讀導向", desc: "喜歡通過閱讀理解概念" },
                                    { value: "practice", label: "✏️ 練習導向", desc: "喜歡通過做題鞏固知識" },
                                    { value: "visual", label: "🎨 視覺導向", desc: "喜歡圖表和視覺化學習" },
                                    { value: "balanced", label: "⚖️ 均衡混合", desc: "結合各種方式" },
                                ].map((style) => (
                                    <button
                                        key={style.value}
                                        onClick={() => setLearningStyle(style.value)}
                                        className={`w-full apple-card p-4 flex items-center gap-4 text-left transition-all ${learningStyle === style.value ? "ring-2 ring-primary" : ""
                                            }`}
                                    >
                                        <div className="text-2xl">{style.label.split(" ")[0]}</div>
                                        <div>
                                            <div className="font-medium">{style.label.split(" ").slice(1).join(" ")}</div>
                                            <div className="text-sm text-muted-foreground">{style.desc}</div>
                                        </div>
                                        {learningStyle === style.value && (
                                            <Check className="w-5 h-5 text-primary ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="p-6 border-t border-border/50">
                <div className="max-w-lg mx-auto flex gap-4">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="apple-button-secondary flex-1"
                        >
                            <ChevronLeft className="w-5 h-5" /> 上一步
                        </button>
                    )}

                    {step < 5 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={(step === 1 && !userName) || (step === 2 && subjects.length === 0)}
                            className="apple-button flex-1 disabled:opacity-50"
                        >
                            下一步 <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={loading}
                            className="apple-button flex-1"
                        >
                            {loading ? "設定中..." : "🚀 開始學習！"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
