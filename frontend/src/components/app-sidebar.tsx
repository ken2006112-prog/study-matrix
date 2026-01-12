"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Calendar,
    Settings,
    BookOpen,
    LayoutDashboard,
    Layers,
    Sparkles,
    Brain,
    Lightbulb,
    FileText,
    BarChart3,
    Star,
    LogOut,
    User
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
} from "@/components/ui/sidebar"

const mainItems = [
    { title: "Home", url: "/today", icon: Sparkles },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Flashcards", url: "/flashcards", icon: Layers },
    { title: "Concept Cloud", url: "/concepts", icon: Brain },
]

const toolItems = [
    { title: "Insights", url: "/analysis", icon: Lightbulb },
    // { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Study Planner", url: "/planner", icon: BookOpen }, // Optional
    { title: "Library", url: "/materials", icon: FileText },
]

export function AppSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <Sidebar className="border-r-0 bg-sidebar/50 backdrop-blur-xl">
            <SidebarHeader className="p-4">
                <Link href="/today" className="flex items-center gap-2 font-bold text-lg">
                    <div className="w-8 h-8 rounded-lg bg-gradient flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gradient">Study Matrix</span>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-4 py-2">
                        學習
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="px-2">
                            {mainItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        className={`rounded-xl px-4 py-3 transition-all ${pathname === item.url
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-sidebar-accent"
                                            }`}
                                    >
                                        <Link href={item.url} className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium text-sm">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-4 py-2">
                        工具
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="px-2">
                            {toolItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        className={`rounded-xl px-4 py-3 transition-all ${pathname === item.url
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-sidebar-accent"
                                            }`}
                                    >
                                        <Link href={item.url} className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium text-sm">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 space-y-2">
                {user && (
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient flex items-center justify-center text-white text-sm font-bold">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name || "用戶"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Settings className="w-4 h-4 text-muted-foreground" />
                    </Link>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}
