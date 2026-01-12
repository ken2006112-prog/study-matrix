"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NoteCardProps {
    title?: string;
    content: React.ReactNode;
    className?: string;
    color?: "blue" | "purple" | "green" | "yellow" | "default";
}

export default function NoteCard({ title, content, className, color = "default" }: NoteCardProps) {
    const colorStyles = {
        default: "bg-white dark:bg-card border-gray-100 dark:border-border",
        blue: "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100",
        purple: "bg-purple-50/50 dark:bg-purple-900/10 border-purple-100",
        green: "bg-green-50/50 dark:bg-green-900/10 border-green-100",
        yellow: "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ y: -2 }}
        >
            <Card className={cn(
                "rounded-[1.5rem] shadow-sm hover:shadow-lg transition-all duration-300 border",
                colorStyles[color],
                className
            )}>
                {title && (
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-foreground/90">{title}</CardTitle>
                    </CardHeader>
                )}
                <CardContent className={cn("p-6 pt-0 text-sm leading-relaxed text-muted-foreground", title ? "" : "pt-6")}>
                    {content}
                </CardContent>
            </Card>
        </motion.div>
    );
}
