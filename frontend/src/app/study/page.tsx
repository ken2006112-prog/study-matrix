"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Play,
    Layers,
    Brain,
    Clock,
    Target,
    Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function StudyHubPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/v1/analytics/recommendations");
                if (res.ok) {
                    const data = await res.json();
                    setRecommendations(data || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRecs();
    }, []);

    const startFreeSession = () => {
        // Redirect to a specific "free" task ID or handle it.
        // For now, let's just pick a generic task ID 0 or implement free mode.
        // Since [taskId] expects ID, maybe we need to create an "Ad-hoc" task?
        // Or just link to planner to create one.
        router.push("/planner");
    };

    return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
            </div>

            <div className="max-w-4xl w-full relative z-10 space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">準備好進入心流了嗎？</h1>
                    <p className="text-xl text-muted-foreground">選擇一種模式開始您的學習旅程</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Mode 1: Focus Task */}
                    <button
                        onClick={() => recommendations[0]?.taskId ? router.push(`/study/${recommendations[0].taskId}`) : router.push('/planner')}
                        className="group relative p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all hover:scale-105 text-left space-y-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                            <Target className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">深度專注</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                {recommendations[0]
                                    ? `建議：${recommendations[0].title}`
                                    : "從清單中選擇最重要的一件事"}
                            </p>
                        </div>
                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-6 h-6 text-primary" />
                        </div>
                    </button>

                    {/* Mode 2: Flashcard Review */}
                    <button
                        onClick={() => router.push('/flashcards')}
                        className="group relative p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all hover:scale-105 text-left space-y-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                            <Layers className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">間隔複習</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                快速複習今日到期的閃卡，鞏固記憶。
                            </p>
                        </div>
                    </button>

                    {/* Mode 3: Concept Exploration */}
                    <button
                        onClick={() => router.push('/concepts')}
                        className="group relative p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all hover:scale-105 text-left space-y-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">概念探索</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                瀏覽知識圖譜，透過蘇格拉底對話深化理解。
                            </p>
                        </div>
                    </button>
                </div>

                {/* Quick Action: Just Timer */}
                <div className="text-center">
                    <button
                        onClick={() => router.push('/planner')}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 mx-auto"
                    >
                        <Clock className="w-4 h-4" />
                        <span>或是，管理您的讀書計畫</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
