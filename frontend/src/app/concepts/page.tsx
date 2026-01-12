"use client";

import { useState, useEffect } from "react";
import TagCloud from "react-tag-cloud";
import { Loader2, Brain, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizModal } from "@/components/QuizModal";

interface CloudItem {
    id: number;
    text: string;
    value: number;
    color: string;
    statusColor: string;
    subject: string;
}

export default function ConceptsPage() {
    const [tags, setTags] = useState<CloudItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [quizOpen, setQuizOpen] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);

    const handleTestConcept = async (tag: CloudItem) => {
        if (!confirm(`Start a quick quiz on "${tag.text}"?`)) return;
        try {
            const res = await fetch("http://localhost:8000/api/v1/tutor/quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conceptIds: [tag.id] })
            });
            if (res.ok) {
                const qs = await res.json();
                setQuizQuestions(qs);
                setQuizOpen(true);
            }
        } catch (e) {
            alert("Failed to generate quiz");
        }
    };

    const fetchTags = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/v1/concepts/cloud");
            if (res.ok) {
                const data = await res.json();
                setTags(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    if (loading && tags.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-screen w-full p-8 flex flex-col bg-background">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Brain className="w-8 h-8 text-primary" />
                        Knowledge Cloud
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Visualizing your core concepts.
                        <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            Big = Important
                        </span>
                        <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Green = Mastered
                        </span>
                    </p>
                </div>
                <Button variant="outline" onClick={fetchTags}>
                    <RefreshCw className="mr-2 w-4 h-4" /> Refresh
                </Button>
            </div>

            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-card/30 rounded-3xl border border-dashed">
                {tags.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No concepts found.</p>
                        <p className="text-sm">Try uploading a textbook in Library and clicking &quot;Analyze&quot;.</p>
                    </div>
                ) : (
                    <TagCloud
                        style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 30,
                            padding: 5
                        }}
                    >
                        {tags.map((tag, i) => (
                            <div
                                key={i}
                                style={{
                                    fontSize: Math.max(16, tag.value / 2),
                                    fontWeight: tag.value > 80 ? 800 : 500,
                                    color: tag.statusColor,
                                    cursor: 'pointer',
                                    padding: '4px',
                                    transition: 'all 0.3s ease'
                                }}
                                className="hover:scale-110 hover:z-10 bg-background/50 backdrop-blur-sm rounded-md shadow-sm border border-transparent hover:border-border"
                                onClick={() => handleTestConcept(tag)}
                            >
                                {tag.text}
                            </div>
                        ))}
                    </TagCloud>
                )}

                {quizOpen && <QuizModal questions={quizQuestions} onClose={() => setQuizOpen(false)} />}
            </div>
        </div>
    );
}
