"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Trash2, CheckCircle, Loader2 } from "lucide-react";
import BlockEditor from "@/components/BlockEditor";

interface Material {
    id: number;
    filename: string;
    type: string;
    uploadedAt: string;
    isIndexed: boolean;
    chunkCount: number;
}

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [uploading, setUploading] = useState(false);

    const fetchMaterials = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/materials/");
            const data = await res.json();
            setMaterials(data);
        } catch (error) {
            console.error("Failed to fetch materials", error);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", e.target.files[0]);
        formData.append("material_type", "notes");

        try {
            await fetch("http://localhost:8000/api/v1/materials/upload", {
                method: "POST",
                body: formData,
            });
            await fetchMaterials();
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this material?")) return;
        try {
            await fetch(`http://localhost:8000/api/v1/materials/${id}`, {
                method: "DELETE",
            });
            setMaterials(materials.filter(m => m.id !== id));
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                        Study Library
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Upload your notes and textbooks for the AI Tutor to study.
                    </p>
                </div>

                <label className="gradient-button cursor-pointer flex items-center gap-2">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    Upload Material
                    <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.md,.txt"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>

            <div className="grid gap-4">
                {materials.map((file) => (
                    <div
                        key={file.id}
                        className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-900 border border-border/50 hover:border-primary/50 transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-medium">{file.filename}</h3>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="w-3 h-3" />
                                        Indexed ({file.chunkCount || 0} chunks)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => {
                                    const btn = document.getElementById(`analyze-${file.id}`);
                                    if (btn) btn.innerHTML = "Analyzing...";
                                    // Trigger Analysis
                                    try {
                                        const res = await fetch(`http://localhost:8000/api/v1/materials/analyze/${file.id}`, { method: 'POST' });
                                        if (res.ok) {
                                            alert("Analysis Complete! Context graph updated.");
                                        } else {
                                            alert("Analysis failed.");
                                        }
                                    } catch (e) { console.error(e); alert("Network error"); }
                                    finally { if (btn) btn.innerHTML = "Analyze"; }
                                }}
                                id={`analyze-${file.id}`}
                                className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                            >
                                Analyze
                            </button>

                            <button
                                onClick={() => handleDelete(file.id)}
                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={() => handleDelete(file.id)}
                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}

                {materials.length === 0 && !uploading && (
                    <div className="text-center py-12 text-muted-foreground">
                        No materials uploaded yet. Upload a PDF to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
