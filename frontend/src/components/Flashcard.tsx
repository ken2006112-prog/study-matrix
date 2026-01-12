import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface FlashcardProps {
    front: string;
    back: string;
    isFlipped: boolean;
    onFlip: () => void;
}

export default function Flashcard({ front, back, isFlipped, onFlip }: FlashcardProps) {
    return (
        <div className="relative w-full max-w-md h-64 perspective-1000 cursor-pointer" onClick={onFlip}>
            <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Front */}
                <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-2xl font-semibold text-center">
                    <CardContent>{front}</CardContent>
                </Card>

                {/* Back */}
                <Card
                    className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-xl text-center bg-slate-100 dark:bg-slate-800"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <CardContent>{back}</CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
