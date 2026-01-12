"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    BookOpen,
    Loader2,
    Check,
    X,
    Palette
} from "lucide-react";

interface Subject {
    id: number;
    name: string;
    color: string;
    _count?: {
        tasks: number;
        flashcards: number;
    };
}

const COLORS = [
    "#3B82F6", // Blue
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#EF4444", // Red
    "#F97316", // Orange
    "#EAB308", // Yellow
    "#22C55E", // Green
    "#14B8A6", // Teal
    "#06B6D4", // Cyan
    "#6366F1", // Indigo
];

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState(COLORS[0]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/planner/subjects");
            const data = await res.json();
            setSubjects(data);
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
            // Demo data
            setSubjects([
                { id: 1, name: "微積分", color: "#3B82F6", _count: { tasks: 5, flashcards: 20 } },
                { id: 2, name: "線性代數", color: "#8B5CF6", _count: { tasks: 3, flashcards: 15 } },
                { id: 3, name: "物理", color: "#22C55E", _count: { tasks: 4, flashcards: 12 } },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsSaving(true);

        try {
            const res = await fetch("http://localhost:8000/api/v1/planner/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, color: newColor, userId: 1 })
            });

            if (res.ok) {
                const created = await res.json();
                setSubjects([...subjects, created]);
            }
        } catch (error) {
            // Demo mode - add locally
            setSubjects([...subjects, {
                id: Date.now(),
                name: newName,
                color: newColor,
                _count: { tasks: 0, flashcards: 0 }
            }]);
        }

        setNewName("");
        setNewColor(COLORS[0]);
        setIsCreating(false);
        setIsSaving(false);
    };

    const handleUpdate = async (id: number, name: string, color: string) => {
        setIsSaving(true);

        try {
            await fetch(`http://localhost:8000/api/v1/planner/subjects/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, color })
            });
        } catch (error) {
            console.log("Demo mode - updating locally");
        }

        setSubjects(subjects.map(s => s.id === id ? { ...s, name, color } : s));
        setEditingId(null);
        setIsSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("確定要刪除這個科目嗎？相關的任務和閃卡不會被刪除。")) return;

        try {
            await fetch(`http://localhost:8000/api/v1/planner/subjects/${id}`, {
                method: "DELETE"
            });
        } catch (error) {
            console.log("Demo mode - deleting locally");
        }

        setSubjects(subjects.filter(s => s.id !== id));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-muted-foreground">載入科目...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">科目管理</h1>
                            <p className="text-xs text-muted-foreground">{subjects.length} 個科目</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="gradient-button"
                    >
                        <Plus className="w-4 h-4" />
                        新增科目
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {/* Create Form */}
                {isCreating && (
                    <div className="premium-card p-6 animate-fade-in-up">
                        <h3 className="font-semibold mb-4">新增科目</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">科目名稱</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="例如：微積分"
                                    className="apple-input"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">顏色</label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setNewColor(color)}
                                            className={`w-8 h-8 rounded-full transition-all ${newColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="apple-button-secondary"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newName.trim() || isSaving}
                                    className="gradient-button disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    建立
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subject List */}
                {subjects.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-subtle flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">還沒有科目</h3>
                        <p className="text-muted-foreground mb-6">建立你的第一個科目開始學習</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="gradient-button"
                        >
                            <Plus className="w-4 h-4" />
                            新增科目
                        </button>
                    </div>
                ) : (
                    <div className="apple-card divide-y divide-border/30">
                        {subjects.map((subject) => (
                            <SubjectItem
                                key={subject.id}
                                subject={subject}
                                isEditing={editingId === subject.id}
                                onEdit={() => setEditingId(subject.id)}
                                onSave={(name, color) => handleUpdate(subject.id, name, color)}
                                onCancel={() => setEditingId(null)}
                                onDelete={() => handleDelete(subject.id)}
                                colors={COLORS}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function SubjectItem({
    subject,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    colors
}: {
    subject: Subject;
    isEditing: boolean;
    onEdit: () => void;
    onSave: (name: string, color: string) => void;
    onCancel: () => void;
    onDelete: () => void;
    colors: string[];
}) {
    const [name, setName] = useState(subject.name);
    const [color, setColor] = useState(subject.color);

    if (isEditing) {
        return (
            <div className="p-4 bg-secondary/30">
                <div className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="apple-input"
                        autoFocus
                    />
                    <div className="flex gap-2 flex-wrap">
                        {colors.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-6 h-6 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-primary" : ""
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={onCancel} className="apple-button-secondary text-sm px-3 py-2">
                            <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => onSave(name, color)} className="gradient-button text-sm px-3 py-2">
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors group">
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: subject.color }}
            >
                {subject.name.charAt(0)}
            </div>
            <div className="flex-1">
                <p className="font-medium">{subject.name}</p>
                <p className="text-xs text-muted-foreground">
                    {subject._count?.tasks || 0} 任務 · {subject._count?.flashcards || 0} 閃卡
                </p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
