"use client";

import Link from "next/link";
import { useState } from "react";
import {
    Brain, Zap, BookOpen, BarChart3, Clock, Sparkles, Check,
    ArrowRight, Play, Star, Users, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">Study Matrix</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">功能</a>
                        <a href="#pricing" className="text-sm text-slate-300 hover:text-white transition-colors">定價</a>
                        <a href="#faq" className="text-sm text-slate-300 hover:text-white transition-colors">FAQ</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" className="text-slate-300 hover:text-white">登入</Button>
                        </Link>
                        <Link href="/signup">
                            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0">
                                免費開始
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-slate-300">AI 驅動的學習革命</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                        <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            用 AI 重新定義
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            你的學習方式
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                        上傳任何學習材料，AI 自動提取重點、生成閃卡、規劃複習。
                        基於認知科學，讓你用最少時間達到最佳效果。
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8 py-6 text-lg border-0">
                                免費開始使用 <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg">
                            <Play className="w-5 h-5 mr-2" /> 觀看演示
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-8 mt-12 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            免費試用
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            無需信用卡
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            隨時取消
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6 bg-slate-900/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">一站式 AI 學習平台</h2>
                        <p className="text-slate-400 text-lg">集合最先進的學習科技，助你高效達成目標</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: BookOpen,
                                title: "智能文件分析",
                                description: "上傳 PDF，AI 自動提取 80/20 核心概念，讓你專注最重要內容",
                                color: "from-blue-500 to-cyan-500"
                            },
                            {
                                icon: Zap,
                                title: "自動生成閃卡",
                                description: "基於 FSRS 算法的間隔重複，在最佳時機提醒你複習",
                                color: "from-amber-500 to-orange-500"
                            },
                            {
                                icon: Brain,
                                title: "對話式問答",
                                description: "像 ChatGPT 一樣對話，但 AI 完全基於你的學習材料回答",
                                color: "from-purple-500 to-pink-500"
                            },
                            {
                                icon: BarChart3,
                                title: "學習數據分析",
                                description: "追蹤學習時長、複習效率、遺忘曲線，用數據優化策略",
                                color: "from-emerald-500 to-teal-500"
                            },
                            {
                                icon: Clock,
                                title: "智能時間規劃",
                                description: "根據考試日期倒推學習計劃，自動分配每日任務",
                                color: "from-red-500 to-rose-500"
                            },
                            {
                                icon: Sparkles,
                                title: "AI Quiz 生成",
                                description: "一鍵生成測驗題，幫助你主動回憶、強化記憶",
                                color: "from-indigo-500 to-violet-500"
                            }
                        ].map((feature, i) => (
                            <div key={i} className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-slate-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">簡單透明的定價</h2>
                        <p className="text-slate-400 text-lg">選擇最適合你的方案</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Free */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-xl font-semibold mb-2">免費版</h3>
                            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-slate-400 font-normal">/月</span></div>
                            <ul className="space-y-3 mb-8">
                                {["3 個筆記本", "基礎閃卡功能", "每日 10 次 AI 問答", "學習數據統計"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-300">
                                        <Check className="w-5 h-5 text-emerald-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signup">
                                <Button className="w-full" variant="outline">開始使用</Button>
                            </Link>
                        </div>

                        {/* Pro - Popular */}
                        <div className="p-8 rounded-2xl bg-gradient-to-b from-emerald-500/20 to-transparent border-2 border-emerald-500/50 relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 rounded-full text-sm font-medium">
                                最受歡迎
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Pro</h3>
                            <div className="text-4xl font-bold mb-6">$9.99<span className="text-lg text-slate-400 font-normal">/月</span></div>
                            <ul className="space-y-3 mb-8">
                                {["無限筆記本", "進階 FSRS 閃卡", "無限 AI 問答", "PDF 智能分析", "優先客服支援"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-300">
                                        <Check className="w-5 h-5 text-emerald-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signup?plan=pro">
                                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">升級 Pro</Button>
                            </Link>
                        </div>

                        {/* Team */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-xl font-semibold mb-2">團隊版</h3>
                            <div className="text-4xl font-bold mb-6">$29.99<span className="text-lg text-slate-400 font-normal">/月</span></div>
                            <ul className="space-y-3 mb-8">
                                {["所有 Pro 功能", "最多 10 位成員", "團隊協作筆記", "管理員控制台", "API 存取"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-300">
                                        <Check className="w-5 h-5 text-emerald-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signup?plan=team">
                                <Button className="w-full" variant="outline">聯繫我們</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-16 px-6 bg-slate-900/50">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
                        ))}
                    </div>
                    <p className="text-2xl text-slate-200 mb-6">
                        "這是我用過最有效的學習工具。AI 生成的閃卡讓我考試成績提升了 30%！"
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                            陳
                        </div>
                        <div className="text-left">
                            <p className="font-medium">陳同學</p>
                            <p className="text-sm text-slate-400">台大資工系</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">常見問題</h2>
                    <div className="space-y-6">
                        {[
                            {
                                q: "免費版和 Pro 版有什麼區別？",
                                a: "免費版適合輕度使用，限制 3 個筆記本和每日 10 次 AI 問答。Pro 版解鎖所有功能，包括無限筆記本、無限 AI 問答、PDF 智能分析等。"
                            },
                            {
                                q: "我的資料安全嗎？",
                                a: "我們使用銀行級加密保護你的資料，所有傳輸都經過 SSL 加密。我們絕不會將你的資料用於訓練 AI 模型。"
                            },
                            {
                                q: "可以隨時取消訂閱嗎？",
                                a: "是的，你可以隨時在設定中取消訂閱，不會有任何隱藏費用。取消後仍可使用到當期結束。"
                            },
                            {
                                q: "支援哪些檔案格式？",
                                a: "目前支援 PDF 格式。我們正在開發對 Word、PowerPoint、網頁連結和 YouTube 影片的支援。"
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10">
                                <h3 className="text-lg font-semibold mb-2">{item.q}</h3>
                                <p className="text-slate-400">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">準備好開始了嗎？</h2>
                    <p className="text-xl text-slate-400 mb-10">加入數千名正在使用 Study Matrix 提升學習效率的學生</p>
                    <Link href="/signup">
                        <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-12 py-6 text-lg border-0">
                            免費開始使用 <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-emerald-400" />
                        <span className="font-semibold">Study Matrix</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-400">
                        <a href="#" className="hover:text-white transition-colors">隱私政策</a>
                        <a href="#" className="hover:text-white transition-colors">服務條款</a>
                        <a href="#" className="hover:text-white transition-colors">聯繫我們</a>
                    </div>
                    <p className="text-sm text-slate-500">© 2026 Study Matrix. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
