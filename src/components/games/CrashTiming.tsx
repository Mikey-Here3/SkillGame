"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

interface CrashTimingProps {
  gameState: any;
  sendAction: (action: any) => void;
  isPractice: boolean;
}

export function CrashTiming({ gameState, sendAction }: CrashTimingProps) {
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [localCrashed, setLocalCrashed] = useState(false);
  const [localTime, setLocalTime] = useState(Date.now());
  const animationRef = useRef<number>(0);

  // Sync with server state
  useEffect(() => {
    if (!gameState) return;
    
    if (gameState.isCrashed) {
      setLocalCrashed(true);
      setCurrentMultiplier(gameState.crashPoint);
      return;
    }

    const loop = () => {
      const now = Date.now();
      setLocalTime(now);
      
      const elapsed = Math.max(0, now - gameState.startTime);
      if (elapsed > 0) {
        // Must match server formula exactly
        const calculated = 1.0 + Math.pow(elapsed / 2000, 1.5) * 0.1;
        setCurrentMultiplier(calculated);
      }
      
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationRef.current);
  }, [gameState?.startTime, gameState?.isCrashed, gameState?.crashPoint]);

  if (!gameState) {
    return <div className="p-8 text-center text-muted-foreground">Loading graph...</div>;
  }

  const { cashedOut, cashOutMultiplier, players } = gameState;

  const handleCashout = () => {
    if (cashedOut || localCrashed || Date.now() < gameState.startTime) return;
    sendAction({ type: "cashout" });
  };

  const isStartingSoon = Date.now() < gameState.startTime;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 select-none">
      
      {/* Graph Area */}
      <div className="relative w-full max-w-3xl h-[50vh] bg-slate-900 border-2 border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>

        <div className="z-10 text-center">
          {isStartingSoon ? (
            <div className="text-4xl font-bold font-heading text-slate-300 animate-pulse">
              Starting in {Math.max(0, Math.ceil((gameState.startTime - localTime) / 1000))}s...
            </div>
          ) : (
            <div className={`text-7xl md:text-9xl font-bold font-mono tracking-tighter transition-colors duration-100 ${localCrashed ? 'text-red-500' : cashedOut ? 'text-green-500' : 'text-white'}`}>
              {currentMultiplier.toFixed(2)}x
            </div>
          )}

          {localCrashed && (
            <div className="mt-4 text-3xl font-bold font-heading text-red-500 animate-bounce flex items-center justify-center gap-2">
              <AlertTriangle /> CRASHED!
            </div>
          )}

          {cashedOut && !localCrashed && (
            <div className="mt-4 text-2xl font-bold text-green-400 flex items-center justify-center gap-2">
              <CheckCircle2 /> Cashed out at {cashOutMultiplier.toFixed(2)}x
            </div>
          )}
        </div>

        {/* The visual curve line (pure CSS visual trick using border radius) */}
        {!isStartingSoon && !localCrashed && (
          <div 
            className="absolute bottom-0 left-0 border-t-4 border-r-4 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
            style={{
              width: `${Math.min(100, (currentMultiplier - 1) * 20)}%`,
              height: `${Math.min(100, (currentMultiplier - 1) * 30)}%`,
              borderTopRightRadius: '100%',
              transition: 'all 0.1s linear'
            }}
          ></div>
        )}
      </div>

      {/* Cashout Button */}
      <button
        onClick={handleCashout}
        disabled={cashedOut || localCrashed || isStartingSoon}
        className={`
          mt-8 w-full max-w-sm h-24 rounded-2xl text-3xl font-bold font-heading transition-all duration-100 flex items-center justify-center gap-4
          ${cashedOut 
            ? 'bg-slate-800 text-slate-500 border-2 border-slate-700 cursor-not-allowed' 
            : localCrashed 
              ? 'bg-red-500/20 text-red-500 border-2 border-red-500 cursor-not-allowed'
              : isStartingSoon
                ? 'bg-blue-600/50 text-white/50 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-400 hover:scale-105 active:scale-95 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)] border-4 border-green-400'
          }
        `}
      >
        <TrendingUp size={32} />
        {cashedOut ? "Cashed Out!" : "CASH OUT"}
      </button>

      {/* Players status */}
      <div className="mt-8 flex gap-4 flex-wrap justify-center max-w-4xl w-full">
        {players?.map((p: any) => (
          <div key={p.id} className={`px-4 py-2 rounded-lg border ${p.cashedOut ? 'bg-green-500/20 border-green-500 text-green-400' : localCrashed ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            <span className="font-bold">{p.username}</span>
            {p.cashedOut ? (
              <span className="ml-2 font-mono">{p.cashOutMultiplier.toFixed(2)}x</span>
            ) : (
              <span className="ml-2 italic opacity-50">Playing...</span>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
