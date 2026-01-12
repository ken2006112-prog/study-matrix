"use client";

import { useEffect, useState } from "react";
import { Task } from "@/types/task";
import { fetchTasks, updateTask, createTask } from "@/lib/api/tasks";
import {
    Flame,
    Clock,
    Star,
    Trash2,
    Plus,
    X,
    Check,
    GripVertical,
    LayoutGrid,
    List
} from "lucide-react";

// Eisenhower Matrix Quadrants
type Quadrant = "do" | "schedule" | "delegate" | "eliminate";

interface ExtendedTask extends Task {
    urgency: number; // 0-1
    importance: number; // 0-1
}

const QUADRANT_CONFIG = {
    do: {
        title: "立即執行",
        subtitle: "緊急且重要",
        icon: Flame,
        color: "from-red-500 to-orange-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        textColor: "text-red-500"
    },
    schedule: {
        title: "計劃安排",
        subtitle: "重要不緊急",
        icon: Star,
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        textColor: "text-blue-500"
    },
    delegate: {
        title: "委派他人",
        subtitle: "緊急不重要",
        icon: Clock,
        color: "from-yellow-500 to-orange-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        textColor: "text-yellow-500"
    },
    eliminate: {
        title: "考慮刪除",
        subtitle: "不緊急不重要",
        icon: Trash2,
        color: "from-gray-400 to-gray-500",
        bgColor: "bg-secondary/30",
        borderColor: "border-border/50",
        textColor: "text-muted-foreground"
    }
};

export default function MatrixPage() {
    const [tasks, setTasks] = useState<ExtendedTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskQuadrant, setNewTaskQuadrant] = useState<Quadrant>("do");
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [draggedTask, setDraggedTask] = useState<ExtendedTask | null>(null);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const allTasks = await fetchTasks();
            // Convert tasks to extended tasks with urgency/importance
            const extended = allTasks.filter(t => !t.isCompleted).map(task => ({
                ...task,
                urgency: getUrgency(task),
                importance: getImportance(task)
            }));
            setTasks(extended);
        } catch (error) {
            console.error("Failed to load tasks:", error);
            // Demo data
            setTasks([
                { id: 1, title: "準備明天的期中考", urgency: 0.9, importance: 0.9, priority: 3, isCompleted: false },
                { id: 2, title: "完成作業第三章", urgency: 0.8, importance: 0.7, priority: 2, isCompleted: false },
                { id: 3, title: "複習上週筆記", urgency: 0.3, importance: 0.8, priority: 2, isCompleted: false },
                { id: 4, title: "整理書桌", urgency: 0.5, importance: 0.3, priority: 1, isCompleted: false },
                { id: 5, title: "看課外讀物", urgency: 0.2, importance: 0.4, priority: 0, isCompleted: false },
            ] as ExtendedTask[]);
        } finally {
            setLoading(false);
        }
    };

    const getUrgency = (task: Task): number => {
        if (!task.dueDate) return 0.3;
        const daysUntilDue = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilDue <= 1) return 0.95;
        if (daysUntilDue <= 3) return 0.7;
        if (daysUntilDue <= 7) return 0.5;
        return 0.3;
    };

    const getImportance = (task: Task): number => {
        return Math.min(1, (task.priority || 0) / 3 + 0.1);
    };

    const getQuadrant = (task: ExtendedTask): Quadrant => {
        const isUrgent = task.urgency >= 0.5;
        const isImportant = task.importance >= 0.5;

        if (isUrgent && isImportant) return "do";
        if (!isUrgent && isImportant) return "schedule";
        if (isUrgent && !isImportant) return "delegate";
        return "eliminate";
    };

    const getTasksByQuadrant = (quadrant: Quadrant) => {
        return tasks.filter(task => getQuadrant(task) === quadrant);
    };

    const handleDragStart = (task: ExtendedTask) => {
        setDraggedTask(task);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (quadrant: Quadrant) => {
        if (!draggedTask) return;

        // Update urgency and importance based on quadrant
        let newUrgency = draggedTask.urgency;
        let newImportance = draggedTask.importance;
        let newPriority = draggedTask.priority;

        switch (quadrant) {
            case "do":
                newUrgency = 0.8;
                newImportance = 0.8;
                newPriority = 3;
                break;
            case "schedule":
                newUrgency = 0.3;
                newImportance = 0.8;
                newPriority = 2;
                break;
            case "delegate":
                newUrgency = 0.8;
                newImportance = 0.3;
                newPriority = 1;
                break;
            case "eliminate":
                newUrgency = 0.3;
                newImportance = 0.3;
                newPriority = 0;
                break;
        }

        // Update task
        try {
            await updateTask(draggedTask.id, { priority: newPriority });
        } catch (error) {
            console.log("Demo mode - task not actually updated");
        }

        setTasks(prev => prev.map(t =>
            t.id === draggedTask.id
                ? { ...t, urgency: newUrgency, importance: newImportance, priority: newPriority }
                : t
        ));
        setDraggedTask(null);
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;

        let priority = 0;
        let urgency = 0.3;
        let importance = 0.3;

        switch (newTaskQuadrant) {
            case "do":
                priority = 3;
                urgency = 0.8;
                importance = 0.8;
                break;
            case "schedule":
                priority = 2;
                urgency = 0.3;
                importance = 0.8;
                break;
            case "delegate":
                priority = 1;
                urgency = 0.8;
                importance = 0.3;
                break;
        }

        try {
            const created = await createTask({
                title: newTaskTitle,
                priority
            });
            setTasks(prev => [...prev, { ...created, urgency, importance }]);
        } catch (error) {
            // Demo mode
            setTasks(prev => [...prev, {
                id: Date.now(),
                title: newTaskTitle,
                priority,
                urgency,
                importance,
                isCompleted: false
            } as ExtendedTask]);
        }

        setNewTaskTitle("");
        setShowAddTask(false);
    };

    const handleCompleteTask = async (taskId: number) => {
        try {
            await updateTask(taskId, { isCompleted: true });
        } catch (error) {
            console.log("Demo mode");
        }
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <LayoutGrid className="w-6 h-6 text-primary" />
                            艾森豪矩陣
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            拖拽任務到對應象限 · 優先處理緊急重要事項
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex border border-border rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode("matrix")}
                                className={`px-3 py-1.5 text-sm ${viewMode === "matrix" ? "bg-primary text-white" : "hover:bg-secondary"}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-primary text-white" : "hover:bg-secondary"}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => { setNewTaskQuadrant("do"); setShowAddTask(true); }}
                            className="gradient-button"
                        >
                            <Plus className="w-4 h-4" />
                            新增任務
                        </button>
                    </div>
                </div>
            </div>

            {/* Matrix View */}
            {viewMode === "matrix" && (
                <div className="max-w-6xl mx-auto p-4">
                    {/* Axis Labels */}
                    <div className="flex items-center justify-center mb-2">
                        <span className="text-sm font-medium text-muted-foreground">緊急 →</span>
                    </div>

                    <div className="flex gap-4">
                        {/* Y-axis label */}
                        <div className="flex items-center">
                            <span className="text-sm font-medium text-muted-foreground -rotate-90 whitespace-nowrap">重要 →</span>
                        </div>

                        {/* Matrix Grid */}
                        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3" style={{ minHeight: "calc(100vh - 200px)" }}>
                            {/* Q1: Do (Urgent + Important) */}
                            <QuadrantBox
                                quadrant="do"
                                config={QUADRANT_CONFIG.do}
                                tasks={getTasksByQuadrant("do")}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop("do")}
                                onDragStart={handleDragStart}
                                onComplete={handleCompleteTask}
                                onAddClick={() => { setNewTaskQuadrant("do"); setShowAddTask(true); }}
                            />

                            {/* Q2: Schedule (Not Urgent + Important) */}
                            <QuadrantBox
                                quadrant="schedule"
                                config={QUADRANT_CONFIG.schedule}
                                tasks={getTasksByQuadrant("schedule")}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop("schedule")}
                                onDragStart={handleDragStart}
                                onComplete={handleCompleteTask}
                                onAddClick={() => { setNewTaskQuadrant("schedule"); setShowAddTask(true); }}
                            />

                            {/* Q3: Delegate (Urgent + Not Important) */}
                            <QuadrantBox
                                quadrant="delegate"
                                config={QUADRANT_CONFIG.delegate}
                                tasks={getTasksByQuadrant("delegate")}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop("delegate")}
                                onDragStart={handleDragStart}
                                onComplete={handleCompleteTask}
                                onAddClick={() => { setNewTaskQuadrant("delegate"); setShowAddTask(true); }}
                            />

                            {/* Q4: Eliminate (Not Urgent + Not Important) */}
                            <QuadrantBox
                                quadrant="eliminate"
                                config={QUADRANT_CONFIG.eliminate}
                                tasks={getTasksByQuadrant("eliminate")}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop("eliminate")}
                                onDragStart={handleDragStart}
                                onComplete={handleCompleteTask}
                                onAddClick={() => { setNewTaskQuadrant("eliminate"); setShowAddTask(true); }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
                <div className="max-w-3xl mx-auto p-4 space-y-6">
                    {(["do", "schedule", "delegate", "eliminate"] as Quadrant[]).map(quadrant => {
                        const config = QUADRANT_CONFIG[quadrant];
                        const quadrantTasks = getTasksByQuadrant(quadrant);
                        const Icon = config.icon;

                        return (
                            <div key={quadrant}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{config.title}</h3>
                                        <p className="text-xs text-muted-foreground">{config.subtitle}</p>
                                    </div>
                                    <span className="ml-auto text-sm text-muted-foreground">{quadrantTasks.length}</span>
                                </div>

                                <div className="space-y-2">
                                    {quadrantTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl ${config.bgColor} border ${config.borderColor}`}
                                        >
                                            <button
                                                onClick={() => handleCompleteTask(task.id)}
                                                className={`w-5 h-5 rounded-full border-2 ${config.borderColor} hover:bg-primary hover:border-primary flex items-center justify-center transition-colors`}
                                            >
                                                <Check className="w-3 h-3 opacity-0 hover:opacity-100 text-white" />
                                            </button>
                                            <span className="flex-1">{task.title}</span>
                                        </div>
                                    ))}
                                    {quadrantTasks.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">沒有任務</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Task Modal */}
            {showAddTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddTask(false)}>
                    <div className="bg-background rounded-2xl p-6 w-full max-w-md mx-4 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">新增任務</h3>
                            <button onClick={() => setShowAddTask(false)} className="p-2 hover:bg-secondary rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                placeholder="任務名稱..."
                                className="apple-input"
                                autoFocus
                            />

                            <div>
                                <label className="text-sm font-medium mb-2 block">放入象限</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["do", "schedule", "delegate", "eliminate"] as Quadrant[]).map(q => {
                                        const config = QUADRANT_CONFIG[q];
                                        const Icon = config.icon;
                                        return (
                                            <button
                                                key={q}
                                                onClick={() => setNewTaskQuadrant(q)}
                                                className={`p-3 rounded-xl border flex items-center gap-2 text-sm transition-colors ${newTaskQuadrant === q
                                                        ? `${config.bgColor} ${config.borderColor} ${config.textColor}`
                                                        : "border-border hover:bg-secondary"
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {config.title}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                onClick={handleAddTask}
                                disabled={!newTaskTitle.trim()}
                                className="w-full gradient-button py-3 disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                                新增
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Quadrant Box Component
function QuadrantBox({
    quadrant,
    config,
    tasks,
    onDragOver,
    onDrop,
    onDragStart,
    onComplete,
    onAddClick
}: {
    quadrant: Quadrant;
    config: typeof QUADRANT_CONFIG.do;
    tasks: ExtendedTask[];
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
    onDragStart: (task: ExtendedTask) => void;
    onComplete: (id: number) => void;
    onAddClick: () => void;
}) {
    const Icon = config.icon;

    return (
        <div
            className={`rounded-2xl ${config.bgColor} border ${config.borderColor} p-4 flex flex-col transition-colors`}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm">{config.title}</h3>
                    <p className="text-xs text-muted-foreground">{config.subtitle}</p>
                </div>
                <span className={`text-lg font-bold ${config.textColor}`}>{tasks.length}</span>
            </div>

            {/* Tasks */}
            <div className="flex-1 space-y-2 overflow-y-auto">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        draggable
                        onDragStart={() => onDragStart(task)}
                        className="group flex items-center gap-2 p-2.5 bg-background/80 rounded-xl cursor-grab active:cursor-grabbing hover:bg-background transition-colors"
                    >
                        <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                            onClick={() => onComplete(task.id)}
                            className={`w-5 h-5 rounded-full border-2 ${config.borderColor} hover:bg-primary hover:border-primary flex items-center justify-center transition-colors flex-shrink-0`}
                        >
                            <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 text-white" />
                        </button>
                        <span className="text-sm flex-1 truncate">{task.title}</span>
                    </div>
                ))}
            </div>

            {/* Add Button */}
            <button
                onClick={onAddClick}
                className="mt-3 w-full py-2 border border-dashed border-border/50 rounded-xl text-sm text-muted-foreground hover:bg-background/50 transition-colors flex items-center justify-center gap-1"
            >
                <Plus className="w-4 h-4" />
                新增任務
            </button>
        </div>
    );
}
