"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Heart, Skull } from "lucide-react";

interface SequenceMemoryProps {
  gameState: any;
  sendAction: (action: any) => void;
  isPractice: boolean;
}

export function SequenceMemory({ gameState, sendAction }: SequenceMemoryProps) {
  const [status, setStatus] = useState<"watching" | "playing" | "wrong" | "dead">("watching");
  const [activeSquare, setActiveSquare] = useState<number | null>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!gameState || !gameState.sequenceToShow) return;
    
    if (gameState.lives <= 0) {
      setStatus("dead");
      return;
    }

    // Start showing sequence
    setStatus("watching");
    setUserSequence([]);
    setActiveSquare(null);
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    const seq = gameState.sequenceToShow;
    
    // Initial delay before showing
    let delay = 1000;
    
    seq.forEach((squareIndex: number, i: number) => {
      const showTimer = setTimeout(() => {
        setActiveSquare(squareIndex);
      }, delay);
      
      const hideTimer = setTimeout(() => {
        setActiveSquare(null);
      }, delay + 400); // 400ms flash
      
      timeoutRefs.current.push(showTimer, hideTimer);
      delay += 600; // 200ms gap between flashes
    });

    // After all flashes
    const playTimer = setTimeout(() => {
      setStatus("playing");
    }, delay + 200);
    
    timeoutRefs.current.push(playTimer);

  }, [gameState?.sequenceToShow, gameState?.lives]);

  if (!gameState || !gameState.sequenceToShow) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  const { level, lives, sequenceToShow } = gameState;

  const handleSquareClick = (index: number) => {
    if (status !== "playing") return;

    // Flash the clicked square
    setActiveSquare(index);
    setTimeout(() => setActiveSquare(null), 200);

    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);

    // Check if right so far
    const isCorrectSoFar = newUserSequence.every((val, i) => val === sequenceToShow[i]);

    if (!isCorrectSoFar) {
      // Wrong!
      setStatus("wrong");
      // Send the wrong sequence so server deducts a life
      setTimeout(() => {
        sendAction({ sequence: newUserSequence });
      }, 1000);
    } else if (newUserSequence.length === sequenceToShow.length) {
      // Completed the level!
      setStatus("watching"); // Disable input
      setTimeout(() => {
        sendAction({ sequence: newUserSequence });
      }, 500);
    }
  };

  if (status === "dead") {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Skull size={64} className="text-red-500 animate-pulse" />
        <h2 className="text-3xl font-bold font-heading text-white">Game Over!</h2>
        <p className="text-muted-foreground">You reached level {level}</p>
        <p className="text-sm text-slate-500 mt-4">Waiting for match to end...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 select-none">
      <div className="mb-8 w-full max-w-sm flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 shadow-lg">
        <div className="text-xl font-bold font-heading text-white">
          Level <span className="text-blue-400">{level}</span>
        </div>
        
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart 
              key={i} 
              size={24} 
              className={i < lives ? "text-red-500 fill-red-500" : "text-slate-600"} 
            />
          ))}
        </div>
      </div>

      <div className="mb-6 text-xl font-bold tracking-widest uppercase">
        {status === "watching" && <span className="text-yellow-400 animate-pulse">Watch...</span>}
        {status === "playing" && <span className="text-green-400">Your Turn!</span>}
        {status === "wrong" && <span className="text-red-400">Wrong!</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xs w-full aspect-square">
        {Array.from({ length: 9 }).map((_, index) => {
          const isActive = activeSquare === index;
          
          return (
            <div
              key={index}
              onClick={() => handleSquareClick(index)}
              className={`
                rounded-xl sm:rounded-2xl shadow-lg transition-all duration-100 cursor-pointer border-4
                ${isActive ? "bg-white border-white scale-95 shadow-[0_0_30px_rgba(255,255,255,0.8)]" : "bg-blue-600/40 border-blue-500/50 hover:bg-blue-500/50"}
                ${status !== "playing" && !isActive ? "opacity-80 pointer-events-none" : ""}
                ${status === "wrong" && isActive ? "bg-red-500 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)]" : ""}
              `}
            />
          );
        })}
      </div>
      
      <p className="mt-8 text-sm text-slate-400 text-center max-w-xs">
        Memorize the pattern and repeat it back. The sequence gets longer each level.
      </p>
    </div>
  );
}
