"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Zap } from "lucide-react";

interface MathSpeedProps {
  gameState: any;
  sendAction: (action: any) => void;
  isPractice: boolean;
}

export function MathSpeed({ gameState, sendAction }: MathSpeedProps) {
  const [answer, setAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Keep input focused
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState?.problemIndex]);

  if (!gameState || gameState.problemIndex === undefined) {
    return <div className="p-8 text-center text-muted-foreground">Loading problems...</div>;
  }

  const { currentProblem, problemIndex, totalProblems, correct, streak } = gameState;
  const isDone = problemIndex >= totalProblems;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isDone) return;
    
    sendAction({ answer: parseInt(answer, 10) });
    setAnswer("");
  };

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <CheckCircle2 size={64} className="text-green-500 animate-bounce" />
        <h2 className="text-3xl font-bold font-heading text-white">Challenge Complete!</h2>
        <div className="text-xl text-slate-300">
          Correct: <span className="text-green-400 font-bold">{correct}</span> / {totalProblems}
        </div>
        <p className="text-muted-foreground">Waiting for match to end...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4">
      <div className="mb-8 flex flex-col items-center w-full max-w-md">
        <div className="flex justify-between w-full mb-4 px-4 text-slate-300 font-bold">
          <span className="flex items-center gap-2">
            Problem <span className="text-blue-400">{problemIndex + 1}/{totalProblems}</span>
          </span>
          {streak > 2 && (
            <span className="flex items-center gap-1 text-orange-400 animate-pulse">
              <Zap size={16} fill="currentColor" /> Streak x{streak}
            </span>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300" 
            style={{ width: `${(problemIndex / totalProblems) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-sm flex flex-col items-center max-w-md w-full">
        <div className="text-5xl md:text-7xl font-bold font-mono tracking-wider text-white mb-8 text-center drop-shadow-lg">
          {currentProblem} = ?
        </div>
        
        <form onSubmit={handleSubmit} className="w-full relative">
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full bg-slate-900 border-2 border-slate-600 text-white text-3xl font-bold font-mono text-center rounded-xl p-4 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Answer"
            autoFocus
          />
          <button 
            type="submit" 
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg font-bold transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
