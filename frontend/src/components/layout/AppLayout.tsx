"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Star,
    Calendar,
    BookOpen,
    BarChart3,
    Menu,
    X,
    Settings,
    Brain,
    FileText,
    Cloud
} from "lucide-react";
import { useState } from "react";
import { DailyEncouragement, useDailyEncouragement } from "@/components/DailyEncouragement";
import { AIIntervention } from "@/components/AIIntervention";

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { href: "/today", label: "Today", icon: <Star className="w-5 h-5" /> },
    { href: "/flashcards", label: "Flashcards", icon: <Brain className="w-5 h-5" /> },
    { href: "/concepts", label: "概念雲", icon: <Cloud className="w-5 h-5" /> },
    { href: "/insights", label: "洞察", icon: <BarChart3 className="w-5 h-5" /> },
    { href: "/materials", label: "教材", icon: <FileText className="w-5 h-5" /> },
    { href: "/reports", label: "週報", icon: <BookOpen className="w-5 h-5" /> },
];

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { show: showEncouragement, dismiss: dismissEncouragement } = useDailyEncouragement();

    return (
        <div className="flex h-screen bg-background">
            {/* Desktop Sidebar - Apple style */}
            <aside className="hidden md:flex flex-col w-64 border-r border-border/50 apple-glass">
                {/* Logo */}
                <div className="h-16 flex items-center px-6">
                    <h1 className="text-lg font-semibold tracking-tight">
                        AI 學習助理
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/" && pathname?.startsWith(item.href));

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-border/50">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-sm font-medium">
                            K
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">Ken</p>
                            <p className="text-xs text-muted-foreground">2024 秋季學期</p>
                        </div>
                        <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                            <Settings className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border/50 transform transition-transform duration-300 ease-out md:hidden",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-border/50">
                    <h1 className="text-lg font-semibold">AI 學習助理</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg hover:bg-secondary"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="p-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary"
                                )}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 apple-glass md:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-secondary"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <h1 className="text-base font-semibold">
                        {navItems.find(n => n.href === pathname)?.label || 'AI 學習助理'}
                    </h1>
                    <div className="w-9" /> {/* Spacer for centering */}
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>

                {/* Mobile Bottom Navigation - Apple Tab Bar style */}
                <nav className="h-20 flex items-start pt-2 justify-around border-t border-border/50 apple-glass md:hidden safe-area-bottom">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-1 p-2 min-w-[64px] transition-all duration-200",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <div className={cn(
                                    "p-1 rounded-lg transition-colors",
                                    isActive && "bg-primary/10"
                                )}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </main>

            {/* Daily Encouragement Toast */}
            <DailyEncouragement show={showEncouragement} onDismiss={dismissEncouragement} />

            {/* AI Intervention (proactive help) */}
            <AIIntervention userId={1} />
        </div>
    );
}
