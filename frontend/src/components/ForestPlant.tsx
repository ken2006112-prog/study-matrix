"use client";

import { motion } from "framer-motion";
import { Sprout, Flower, TreeDeciduous, Skull } from "lucide-react";

interface ForestPlantProps {
    progress: number; // 0 to 100
    isWithered?: boolean;
}

export function ForestPlant({ progress, isWithered = false }: ForestPlantProps) {
    // Determine current stage
    let StageIcon = Sprout;
    let scale = 0.5 + (progress / 200); // 0.5 -> 1.0
    let color = "text-green-400";

    if (progress >= 33 && progress < 66) {
        StageIcon = Flower;
        color = "text-pink-400";
    } else if (progress >= 66) {
        StageIcon = TreeDeciduous;
        color = "text-green-600";
    }

    if (isWithered) {
        StageIcon = Skull; // Or a dead tree icon if available
        color = "text-stone-500";
    }

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Background Halo */}
            <motion.div
                className="absolute inset-0 bg-green-500/10 rounded-full"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Growth Progress Ring (Optional, specialized UI) */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                    cx="96"
                    cy="96"
                    r="90"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200 dark:text-gray-800"
                />
                <circle
                    cx="96"
                    cy="96"
                    r="90"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className={isWithered ? "text-stone-500" : "text-green-500"}
                    strokeDasharray={565} // 2 * PI * 90
                    strokeDashoffset={565 - (565 * progress) / 100}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                />
            </svg>

            {/* The Plant */}
            <motion.div
                key={isWithered ? "dead" : progress >= 66 ? "tree" : progress >= 33 ? "flower" : "sprout"}
                initial={{ scale: 0, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
                <StageIcon className={`w-24 h-24 ${color} drop-shadow-lg`} />
            </motion.div>

            {/* Message */}
            <div className="absolute -bottom-12 text-center w-full">
                <p className="text-sm font-semibold text-muted-foreground">
                    {isWithered
                        ? "Oops! The tree withered."
                        : progress >= 100
                            ? "Tree Fully Grown!"
                            : "Keep Focused to Grow!"}
                </p>
            </div>
        </div>
    );
}
