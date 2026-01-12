import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold mb-8">
          Welcome to <span className="text-primary">EduMate 2.0</span> 🎓
        </h1>

        <p className="mt-3 text-2xl mb-8 text-muted-foreground">
          Your AI-Powered Cognitive Coach
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl sm:w-full">
          <Link href="/planner">
            <Button size="lg" className="text-lg px-8 py-6">
              Open Study Planner
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
