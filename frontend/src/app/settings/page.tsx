"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    User,
    Mail,
    Lock,
    Bell,
    Moon,
    Sun,
    LogOut,
    ChevronRight,
    Shield,
    Palette,
    Globe,
    Loader2,
    Check
} from "lucide-react";

export default function SettingsPage() {
    const { user, logout, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await updateProfile({ name });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Failed to save profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    interface SettingsItem {
        icon: React.ReactNode;
        label: string;
        value?: string | boolean;
        action?: string;
        disabled?: boolean;
        toggle?: boolean;
        onToggle?: () => void;
    }

    const settingsSections: { title: string; items: SettingsItem[] }[] = [
        {
            title: "帳號",
            items: [
                {
                    icon: <User className="w-5 h-5" />,
                    label: "個人資料",
                    value: user?.name || "未設定",
                    action: "edit_profile"
                },
                {
                    icon: <Mail className="w-5 h-5" />,
                    label: "Email",
                    value: user?.email || "",
                    disabled: true
                },
                {
                    icon: <Lock className="w-5 h-5" />,
                    label: "修改密碼",
                    action: "change_password"
                }
            ]
        },
        {
            title: "偏好設定",
            items: [
                {
                    icon: darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
                    label: "深色模式",
                    toggle: true,
                    value: darkMode,
                    onToggle: () => setDarkMode(!darkMode)
                },
                {
                    icon: <Bell className="w-5 h-5" />,
                    label: "通知提醒",
                    toggle: true,
                    value: notifications,
                    onToggle: () => setNotifications(!notifications)
                },
                {
                    icon: <Globe className="w-5 h-5" />,
                    label: "語言",
                    value: "繁體中文"
                },
                {
                    icon: <Palette className="w-5 h-5" />,
                    label: "主題色彩",
                    value: "藍色"
                }
            ]
        },
        {
            title: "安全",
            items: [
                {
                    icon: <Shield className="w-5 h-5" />,
                    label: "隱私設定",
                    action: "privacy"
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold">設定</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
                {/* Profile Card */}
                <div className="premium-card p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient flex items-center justify-center text-white text-2xl font-bold">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{user?.name || "用戶"}</h2>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">名稱</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="apple-input"
                            />
                        </div>
                        <button
                            onClick={handleSaveProfile}
                            disabled={isSaving || name === user?.name}
                            className="gradient-button w-full disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    儲存中...
                                </>
                            ) : saved ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    已儲存
                                </>
                            ) : (
                                "儲存變更"
                            )}
                        </button>
                    </div>
                </div>

                {/* Settings Sections */}
                {settingsSections.map((section, i) => (
                    <div key={i}>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
                            {section.title}
                        </h3>
                        <div className="apple-card divide-y divide-border/30">
                            {section.items.map((item, j) => (
                                <div
                                    key={j}
                                    className={`flex items-center gap-4 p-4 ${item.disabled ? "opacity-50" : "hover:bg-secondary/50 cursor-pointer"
                                        } transition-colors`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{item.label}</p>
                                        {item.value && !item.toggle && (
                                            <p className="text-sm text-muted-foreground">{item.value}</p>
                                        )}
                                    </div>
                                    {item.toggle ? (
                                        <button
                                            onClick={item.onToggle}
                                            className={`w-12 h-7 rounded-full transition-colors ${item.value ? "bg-primary" : "bg-secondary"
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-6" : "translate-x-1"
                                                }`} />
                                        </button>
                                    ) : !item.disabled && (
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Logout */}
                <button
                    onClick={logout}
                    className="w-full p-4 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    登出
                </button>

                {/* App Info */}
                <div className="text-center text-sm text-muted-foreground py-6">
                    <p>Study Matrix v1.0.0</p>
                    <p className="mt-1">Made with ❤️ for learners</p>
                </div>
            </div>
        </div>
    );
}
