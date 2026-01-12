import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AgentProvider } from "@/contexts/AgentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AgentChatPanel } from "@/components/AgentChatPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Study Matrix - AI 學習助理",
  description: "你的個人 AI 學習伴侶，基於認知科學打造",
  manifest: "/manifest.json",
  themeColor: "#7A9E8A",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AgentProvider>
            <SidebarProvider>
              {/* 三欄式佈局: 左側選單 | 中間內容 | 右側對話 */}
              <div className="flex w-full h-screen overflow-hidden">
                {/* 左側: 導航選單 */}
                <AppSidebar />

                {/* 中間: 主要內容 */}
                <main className="flex-1 overflow-auto relative">
                  <SidebarTrigger className="absolute top-4 left-4 z-50 md:hidden" />
                  {children}
                </main>

                {/* 右側: Agent 對話面板 */}
                <AgentChatPanel />
              </div>
            </SidebarProvider>
          </AgentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
