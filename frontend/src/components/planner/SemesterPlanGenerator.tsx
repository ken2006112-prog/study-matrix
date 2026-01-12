"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Clock, Book, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneratedTask {
    title: string;
    subjectName: string;
    dueDate: string;
    priority: number;
    estimatedMinutes: number;
    taskType: string;
}

interface GenerationResult {
    success: boolean;
    tasksGenerated: number;
    tasks: GeneratedTask[];
    message: string;
}

export default function SemesterPlanGenerator() {
    const [loading, setLoading] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [previewTasks, setPreviewTasks] = useState<GeneratedTask[]>([]);
    const [result, setResult] = useState<GenerationResult | null>(null);

    const handlePreview = async () => {
        setPreviewing(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/semester/preview");
            if (res.ok) {
                const data = await res.json();
                setPreviewTasks(data.previewTasks || []);
            }
        } catch (error) {
            console.error("Preview failed:", error);
        } finally {
            setPreviewing(false);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/semester/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: 1, forceRegenerate: false })
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
                setPreviewTasks([]);
            }
        } catch (error) {
            console.error("Generation failed:", error);
            setResult({
                success: false,
                tasksGenerated: 0,
                tasks: [],
                message: "生成計畫時發生錯誤"
            });
        } finally {
            setLoading(false);
        }
    };

    const taskTypeIcons: Record<string, React.ReactNode> = {
        reading: <Book className="w-4 h-4 text-blue-500" />,
        recall: <Sparkles className="w-4 h-4 text-purple-500" />,
        practice: <CheckCircle className="w-4 h-4 text-green-500" />,
        review: <Clock className="w-4 h-4 text-orange-500" />
    };

    const priorityColors = ["text-muted-foreground", "text-blue-500", "text-orange-500", "text-red-500"];

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    AI 學期計畫生成器
                </h1>
                <p className="text-muted-foreground">
                    根據考試日期、科目熟悉度自動生成智慧學習計畫
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
                <Button
                    variant="outline"
                    onClick={handlePreview}
                    disabled={previewing || loading}
                >
                    {previewing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Calendar className="w-4 h-4 mr-2" />
                    )}
                    預覽計畫
                </Button>
                <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    生成學習計畫
                </Button>
            </div>

            {/* Result Message */}
            {result && (
                <div className={cn(
                    "p-4 rounded-lg flex items-center gap-3",
                    result.success
                        ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                )}>
                    {result.success ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{result.message}</span>
                </div>
            )}

            {/* Preview Tasks */}
            {previewTasks.length > 0 && (
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg">
                        預覽：將生成 {previewTasks.length} 個任務
                    </h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {previewTasks.map((task, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-lg border bg-card flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    {taskTypeIcons[task.taskType] || <Book className="w-4 h-4" />}
                                    <div>
                                        <p className="font-medium text-sm">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(task.dueDate).toLocaleDateString('zh-TW')} • {task.estimatedMinutes}分鐘
                                        </p>
                                    </div>
                                </div>
                                <span className={cn("text-xs font-medium", priorityColors[task.priority])}>
                                    P{task.priority}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <h3 className="font-medium text-foreground mb-2">AI 計畫特點：</h3>
                <ul className="space-y-1">
                    <li>📅 根據考試日期自動調整優先級</li>
                    <li>🧠 考慮遺忘曲線安排複習時間</li>
                    <li>📊 按熟悉度分配學習類型（閱讀/回憶/練習）</li>
                    <li>⚡ 每個任務都有預估時間和類型標籤</li>
                </ul>
            </div>
        </div>
    );
}
