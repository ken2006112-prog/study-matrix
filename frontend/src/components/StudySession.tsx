import { useState, useEffect, useRef } from "react";
import { fetchDueCards, reviewCard, Flashcard as FlashcardType } from "@/lib/api";
import Flashcard from "./Flashcard";
import { Button } from "@/components/ui/button";
import { ForestPlant } from "./ForestPlant";
import { Play, Pause, XCircle } from "lucide-react";

export default function StudySession() {
    const [queue, setQueue] = useState<FlashcardType[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [finished, setFinished] = useState(false);

    // Forest / Focus State
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isActive, setIsActive] = useState(true); // Auto-start
    const [isWithered, setIsWithered] = useState(false);
    const PLANNED_DURATION = 25 * 60; // 25 Minutes (Pomodoro)
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadCards();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (isActive && !finished && !isWithered) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, finished, isWithered]);

    async function loadCards() {
        try {
            setLoading(true);
            const cards = await fetchDueCards();
            setQueue(cards);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleRating(rating: number) {
        const card = queue[currentCardIndex];
        if (!card) return;

        try {
            await reviewCard(card.id, rating);

            // Move to next card
            if (currentCardIndex < queue.length - 1) {
                setIsFlipped(false);
                setCurrentCardIndex(prev => prev + 1);
            } else {
                setFinished(true);
                setIsActive(false);
            }
        } catch (e) {
            console.error("Failed to submit review", e);
        }
    }

    const handleGiveUp = () => {
        if (confirm("Are you sure? Your tree will wither! 🥀")) {
            setIsWithered(true);
            setIsActive(false);
        }
    };

    if (loading) return <div>Loading detailed study plan...</div>;

    if (finished) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <h2 className="text-3xl font-bold">Session Complete! 🎉</h2>
                <div className="flex items-center gap-4">
                    <ForestPlant progress={100} />
                </div>
                <p>You reviewed {queue.length} cards in {Math.floor(elapsedTime / 60)} minutes.</p>
                <Button onClick={() => window.location.reload()}>Review Again?</Button>
            </div>
        );
    }

    if (queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <h2 className="text-xl">No cards due for today.</h2>
                <Button onClick={loadCards}>Refresh</Button>
                <p className="text-sm text-muted-foreground">Add cards to the database to start studying.</p>
            </div>
        )
    }

    const currentCard = queue[currentCardIndex];
    const progress = Math.min(100, (elapsedTime / PLANNED_DURATION) * 100);

    return (
        <div className="flex flex-col items-center space-y-6 max-w-2xl mx-auto py-6">
            {/* Top Bar: Forest Visual & Controls */}
            <div className="w-full flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <ForestPlant progress={progress} isWithered={isWithered} />
                    <div>
                        <div className="text-2xl font-mono font-bold">
                            {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:
                            {(elapsedTime % 60).toString().padStart(2, '0')}
                        </div>
                        <p className="text-xs text-muted-foreground">Focus Time</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setIsActive(!isActive)} disabled={isWithered}>
                        {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={handleGiveUp} disabled={isWithered}>
                        <XCircle className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="w-full h-px bg-border/50" />

            <div className="flex justify-between w-full text-sm text-muted-foreground px-4">
                <span>Card {currentCardIndex + 1} of {queue.length}</span>
                <span>Due: {new Date(currentCard.due).toLocaleDateString()}</span>
            </div>

            <div className="w-full px-4">
                <Flashcard
                    front={currentCard.front}
                    back={currentCard.back}
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(!isFlipped)}
                />
            </div>

            <div className="h-24 flex items-center justify-center w-full px-4">
                {isWithered ? (
                    <div className="text-red-500 font-bold">Session Failed (Withered)</div>
                ) : !isFlipped ? (
                    <Button size="lg" className="w-full max-w-md" onClick={() => setIsFlipped(true)}>Show Answer</Button>
                ) : (
                    <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                        <Button variant="destructive" onClick={() => handleRating(1)}>Again (1m)</Button>
                        <Button variant="secondary" onClick={() => handleRating(2)}>Hard (6m)</Button>
                        <Button variant="default" className="bg-blue-500 hover:bg-blue-600" onClick={() => handleRating(3)}>Good (10m)</Button>
                        <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => handleRating(4)}>Easy (4d)</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
