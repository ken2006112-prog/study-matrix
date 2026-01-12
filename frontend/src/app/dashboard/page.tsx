"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Clock,
    Zap,
    PieChart,
    Sparkles,
    RefreshCw,
    Plus,
    Brain
} from "lucide-react";
import { ConceptGraph } from "@/components/ConceptGraph";
import AnalyticsChart from "@/components/AnalyticsChart";
import { cn } from "@/lib/utils";
import { TaskSidebar, SmartList } from "@/components/tasks/TaskSidebar";
import CheckInModal from "@/components/CheckInModal";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter(); // Initialize router
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // TaskSidebar state
    const [selectedListId, setSelectedListId] = useState<SmartList | number>("inbox");

    useEffect(() => {
        fetchAnalytics();
    }, []);

    async function fetchAnalytics() {
        try {
            const res = await fetch("http://localhost:8000/api/v1/analytics/summary");
            if (res.ok) {
                const summary = await res.json();
                setAnalyticsData(summary);

                // Fetch recommendations
                fetch("http://localhost:8000/api/v1/analytics/recommendations")
                    .then(r => r.json())
                    .then(recs => setAnalyticsData((prev: any) => ({ ...prev, recommendations: recs })))
                    .catch(e => console.error("Failed recs", e));
            }
        } catch (e) {
            console.error("Failed to fetch analytics", e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Cognitive Check-in Modal */}
            <CheckInModal />

            {/* Main Content Area (Center) - Zen Mode */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                <div className="max-w-2xl w-full space-y-12 text-center animate-fade-in-up">

                    {/* 1. Minimal Greeting */}
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">早安，Ken</h1>
                        <p className="text-xl text-muted-foreground">今天想專注於什麼？</p>
                    </div>

                    {/* 2. Primary Action */}
                    <button
                        className="group relative inline-flex items-center justify-center gap-3 px-12 py-6 text-xl font-medium text-white bg-primary rounded-full shadow-lg hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-300"
                        onClick={() => router.push('/study')}
                    >
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        <span>開始今天的學習</span>
                        <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
                    </button>

                    {/* 3. Core Stats (Minimal) */}
                    <div className="flex justify-center gap-12 text-center">
                        <div>
                            <div className="text-3xl font-bold">{analyticsData?.total_study_hours || 0}</div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wider">小時專注</div>
                        </div>
                        <div className="w-px bg-border/50" />
                        <div>
                            <div className="text-3xl font-bold">{analyticsData?.total_sessions || 0}</div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wider">任務完成</div>
                        </div>
                    </div>

                    {/* 3.5 Anki-style Activity Heatmap */}
                    <div className="pt-4 overflow-hidden">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">學習足跡</h3>
                        <ActivityHeatmap />
                    </div>

                    {/* 4. Next Task (One Thing) */}
                    {analyticsData?.recommendations?.[0] && (
                        <div className="apple-card p-6 text-left hover:shadow-md transition-all border-l-4 border-l-primary cursor-pointer" onClick={() => router.push('/planner')}>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">建議下一步</h3>
                                    <p className="text-muted-foreground">{analyticsData.recommendations[0].title}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{analyticsData.recommendations[0].message}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar (Tasks) - Kept but visualized simpler if possible, or same */}
            <div className="w-80 border-l border-border/30 bg-secondary/5 hidden xl:block overflow-y-auto">
                <div className="p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        待辦清單
                    </h2>
                    <TaskSidebar
                        selectedList={selectedListId}
                        onSelectList={setSelectedListId}
                    />
                </div>
            </div>
        </div>
    );
}
