"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload, FolderPlus, BookOpen, FileText, Plus, Sparkles,
  ArrowRight, Clock, Brain, Zap, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notebook {
  id: number;
  name: string;
  color: string;
  documentsCount: number;
  lastUpdated?: string;
}

export default function Home() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    try {
      // Fetch subjects as "notebooks"
      const res = await fetch("http://localhost:8000/api/v1/planner/subjects/");
      if (res.ok) {
        const data = await res.json();
        setNotebooks(data.map((s: any) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          documentsCount: 0 // TODO: Count actual materials
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      alert('請上傳 PDF 檔案');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', '1');

    try {
      const res = await fetch("http://localhost:8000/api/v1/materials/upload", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        // Navigate to materials page after upload
        router.push('/materials');
      } else {
        alert('上傳失敗，請稍後再試');
      }
    } catch (e) {
      alert('上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Study Matrix</h1>
              <p className="text-xs text-muted-foreground">AI 學習助理</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/setup">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                新增課程
              </Button>
            </Link>
            <Link href="/planner">
              <Button size="sm">
                <Zap className="w-4 h-4 mr-1" />
                學習計畫
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Notebooks Sidebar */}
          <div className="col-span-3">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  我的筆記本
                </h2>
                <Link href="/setup">
                  <button className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-secondary/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : notebooks.length === 0 ? (
                  <Link href="/setup" className="block">
                    <div className="p-4 border-2 border-dashed rounded-xl text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                      <Plus className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">新增第一個課程</p>
                    </div>
                  </Link>
                ) : (
                  notebooks.map((notebook) => (
                    <Link key={notebook.id} href={`/materials?subject=${notebook.id}`}>
                      <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/80 transition-all cursor-pointer">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${notebook.color}20` }}
                        >
                          <BookOpen className="w-5 h-5" style={{ color: notebook.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{notebook.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {notebook.documentsCount} 份文件
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Quick Links */}
              <div className="mt-8 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  快速前往
                </p>
                <Link href="/flashcards" className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors text-sm text-muted-foreground hover:text-foreground">
                  <Zap className="w-4 h-4" />
                  閃卡複習
                </Link>
                <Link href="/concepts" className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors text-sm text-muted-foreground hover:text-foreground">
                  <Brain className="w-4 h-4" />
                  概念圖譜
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Main Upload Area */}
          <div className="col-span-9">
            {/* Hero Upload Section */}
            <div
              className={`relative rounded-3xl border-2 border-dashed p-12 transition-all ${dragActive
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-muted-foreground/20 hover:border-primary/50 hover:bg-secondary/30"
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  {uploading ? (
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 text-primary" />
                  )}
                </div>

                <h2 className="text-2xl font-bold mb-2">
                  {uploading ? "上傳中..." : "上傳學習材料"}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  拖放 PDF 檔案到這裡，AI 會自動分析內容、提取重點、並生成學習計畫
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  className="hidden"
                />

                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-8"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  選擇 PDF 檔案
                </Button>

                <p className="text-xs text-muted-foreground mt-4">
                  支援格式：PDF • 最大 50MB
                </p>
              </div>
            </div>

            {/* AI Features Grid */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-2">AI 重點提取</h3>
                <p className="text-sm text-muted-foreground">
                  自動識別 80/20 核心概念，讓你專注最重要的內容
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold mb-2">對話式問答</h3>
                <p className="text-sm text-muted-foreground">
                  用自然對話詢問文件內容，AI 給你精準解答
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-semibold mb-2">智能複習</h3>
                <p className="text-sm text-muted-foreground">
                  自動生成閃卡和測驗，用科學方法鞏固記憶
                </p>
              </div>
            </div>

            {/* Recent Activity or Get Started */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">開始使用</h3>
                  <p className="text-sm text-muted-foreground">
                    上傳你的第一份學習材料，或設定新的學期課程
                  </p>
                </div>
                <Link href="/setup">
                  <Button variant="outline">
                    設定課程 <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
