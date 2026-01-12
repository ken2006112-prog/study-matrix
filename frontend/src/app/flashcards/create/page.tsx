"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Save,
    Trash2,
    Sparkles,
    Loader2,
    Layers,
    ChevronDown
} from "lucide-react";
import Link from "next/link";

interface Subject {
    id: number;
    name: string;
    color: string;
}

interface FlashcardDraft {
    id: string;
    front: string;
    back: string;
}

export default function CreateFlashcardsPage() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [cards, setCards] = useState<FlashcardDraft[]>([
        { id: crypto.randomUUID(), front: "", back: "" }
    ]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/planner/subjects");
            const data = await res.json();
            setSubjects(data);
            if (data.length > 0) setSelectedSubject(data[0]);
        } catch {
            // Demo data
            const demo = [
                { id: 1, name: "微積分", color: "#3B82F6" },
                { id: 2, name: "線性代數", color: "#8B5CF6" }
            ];
            setSubjects(demo);
            setSelectedSubject(demo[0]);
        } finally {
            setIsLoading(false);
        }
    };

    const addCard = () => {
        setCards([...cards, { id: crypto.randomUUID(), front: "", back: "" }]);
    };

    const updateCard = (id: string, field: "front" | "back", value: string) => {
        setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const removeCard = (id: string) => {
        if (cards.length > 1) {
            setCards(cards.filter(c => c.id !== id));
        }
    };

    const handleSave = async () => {
        if (!selectedSubject) return;

        const validCards = cards.filter(c => c.front.trim() && c.back.trim());
        if (validCards.length === 0) {
            alert("請至少填寫一張完整的閃卡");
            return;
        }

        setIsSaving(true);

        try {
            for (const card of validCards) {
                await fetch("http://localhost:8000/api/v1/cards", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        front: card.front,
                        back: card.back,
                        subjectId: selectedSubject.id,
                        userId: 1
                    })
                });
            }
            router.push("/flashcards");
        } catch (error) {
            console.log("Demo mode - cards would be saved");
            router.push("/flashcards");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAIGenerate = async () => {
        if (!selectedSubject) return;
        setAiGenerating(true);

        try {
            const res = await fetch("http://localhost:8000/api/v1/ai-tutor/generate-cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subjectId: selectedSubject.id,
                    count: 5
                })
            });

            if (res.ok) {
                const generated = await res.json();
                setCards([...cards.filter(c => c.front || c.back), ...generated.cards]);
            }
        } catch {
            // Demo AI generated cards
            const demoCards: FlashcardDraft[] = [
                { id: crypto.randomUUID(), front: "什麼是導數？", back: "導數是函數在某一點的瞬時變化率，表示為 f'(x) = lim(h→0) [f(x+h) - f(x)] / h" },
                { id: crypto.randomUUID(), front: "積分的基本定理是什麼？", back: "微積分基本定理指出，微分和積分是互逆運算" },
                { id: crypto.randomUUID(), front: "什麼是連續函數？", back: "在某點連續的函數必須滿足：1) f(a)有定義 2) lim x→a f(x)存在 3) 兩者相等" },
            ];
            setCards([...cards.filter(c => c.front || c.back), ...demoCards]);
        } finally {
            setAiGenerating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const validCount = cards.filter(c => c.front.trim() && c.back.trim()).length;

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/flashcards" className="p-2 hover:bg-secondary rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">建立閃卡</h1>
                        <p className="text-xs text-muted-foreground">{validCount} 張有效卡片</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || validCount === 0}
                        className="gradient-button disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        儲存
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Subject Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                        className="w-full apple-card p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
                    >
                        {selectedSubject && (
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: selectedSubject.color }}
                            >
                                {selectedSubject.name.charAt(0)}
                            </div>
                        )}
                        <span className="flex-1 text-left font-medium">
                            {selectedSubject?.name || "選擇科目"}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showSubjectDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showSubjectDropdown && (
                        <div className="absolute z-20 mt-2 w-full apple-card shadow-lg divide-y divide-border/30">
                            {subjects.map((subject) => (
                                <button
                                    key={subject.id}
                                    onClick={() => {
                                        setSelectedSubject(subject);
                                        setShowSubjectDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors"
                                >
                                    <div
                                        className="w-6 h-6 rounded-lg"
                                        style={{ backgroundColor: subject.color }}
                                    />
                                    <span>{subject.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI Generate Button */}
                <button
                    onClick={handleAIGenerate}
                    disabled={aiGenerating}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                >
                    {aiGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            AI 生成中...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            AI 自動生成閃卡
                        </>
                    )}
                </button>

                {/* Card Editor */}
                <div className="space-y-4">
                    {cards.map((card, index) => (
                        <div key={card.id} className="apple-card p-5 animate-fade-in-up">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        卡片 {index + 1}
                                    </span>
                                </div>
                                {cards.length > 1 && (
                                    <button
                                        onClick={() => removeCard(card.id)}
                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">問題 (正面)</label>
                                    <textarea
                                        value={card.front}
                                        onChange={(e) => updateCard(card.id, "front", e.target.value)}
                                        placeholder="輸入問題..."
                                        rows={2}
                                        className="apple-input resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">答案 (背面)</label>
                                    <textarea
                                        value={card.back}
                                        onChange={(e) => updateCard(card.id, "back", e.target.value)}
                                        placeholder="輸入答案..."
                                        rows={3}
                                        className="apple-input resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add More Button */}
                <button
                    onClick={addCard}
                    className="w-full p-4 rounded-xl border border-border/50 hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                    <Plus className="w-5 h-5" />
                    新增卡片
                </button>
            </div>
        </div>
    );
}
