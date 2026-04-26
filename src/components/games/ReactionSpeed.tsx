"use client";

import { useEffect, useState, useRef } from "react";
import { AlertTriangle, Clock } from "lucide-react";

interface ReactionSpeedProps {
  gameState: any;
  sendAction: (action: any) => void;
  isPractice: boolean;
}

export function ReactionSpeed({ gameState, sendAction, isPractice }: ReactionSpeedProps) {
  const [status, setStatus] = useState<"waiting" | "ready" | "go" | "early" | "done">("waiting");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [localRound, setLocalRound] = useState(0);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // When game state updates (like round advances)
  useEffect(() => {
    if (!gameState) return;

    if (gameState.currentRound >= gameState.rounds) {
      setStatus("done");
      return;
    }

    if (gameState.currentRound > localRound || status === "waiting") {
      setLocalRound(gameState.currentRound);
      startRoundSequence(gameState.delays[gameState.currentRound]);
    }
  }, [gameState, localRound]);

  // Clean up
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startRoundSequence = (delayMs: number) => {
    setStatus("ready");
    setReactionTime(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setStatus("go");
      startTimeRef.current = Date.now();
    }, delayMs);
  };

  const handleClick = () => {
    if (status === "waiting" || status === "done") return;

    if (status === "ready") {
      // Clicked too early
      setStatus("early");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      sendAction({ type: "miss" });
    } else if (status === "go") {
      // Valid click
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setStatus("waiting"); // Wait for next round from server
      sendAction({ type: "react", reactionTime: time });
    }
  };

  if (status === "done") {
    return (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold font-heading text-blue-400 mb-4">Match Finished!</h2>
        <p className="text-muted-foreground">Waiting for final results...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 select-none">
      <div className="mb-8 text-center">
        <h3 className="text-xl font-bold font-heading text-white">
          Round {gameState?.currentRound !== undefined ? Math.min(gameState.currentRound + 1, gameState?.rounds || 5) : 1} / {gameState?.rounds || 5}
        </h3>
        {reactionTime && (
          <div className="mt-2 text-2xl text-green-400 font-mono font-bold animate-pulse">
            {reactionTime} ms
          </div>
        )}
      </div>

      <button
        onPointerDown={handleClick}
        className={`w-64 h-64 md:w-80 md:h-80 rounded-full flex flex-col items-center justify-center transition-all duration-100 shadow-[0_0_50px_rgba(0,0,0,0.3)]
          ${status === "ready" ? "bg-red-500 hover:bg-red-400 border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.5)]" : ""}
          ${status === "go" ? "bg-green-500 hover:bg-green-400 border-green-400 shadow-[0_0_100px_rgba(34,197,94,0.8)] scale-105" : ""}
          ${status === "early" ? "bg-orange-500 border-orange-400" : ""}
          ${status === "waiting" ? "bg-slate-800 border-slate-600 opacity-50 cursor-not-allowed" : ""}
          border-8 active:scale-95`}
      >
        <span className="text-3xl font-bold font-heading uppercase tracking-widest text-white drop-shadow-md">
          {status === "ready" && "Wait..."}
          {status === "go" && "CLICK!"}
          {status === "early" && "Too Early!"}
          {status === "waiting" && "Waiting..."}
        </span>
        {status === "go" && (
          <span className="mt-2 text-white/80 animate-bounce">
            <Clock size={24} />
          </span>
        )}
        {status === "early" && (
          <span className="mt-2 text-white/80">
            <AlertTriangle size={24} />
          </span>
        )}
      </button>

      <p className="mt-12 text-muted-foreground text-sm max-w-sm text-center">
        Wait for the circle to turn green, then click as fast as possible. Clicking early counts as a miss!
      </p>
    </div>
  );
}
