"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Bomb, Star } from "lucide-react";

interface FruitSliceProps {
  gameState: any;
  sendAction: (action: any) => void;
  isPractice: boolean;
}

export function FruitSlice({ gameState, sendAction }: FruitSliceProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track slashed IDs so we don't slash them again
  const [slashedIds, setSlashedIds] = useState<Set<number>>(new Set());

  // Game loop for moving objects
  useEffect(() => {
    if (!gameState || !gameState.fruits) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }

    let animationFrameId: number;

    const loop = () => {
      setCurrentTime(Date.now() - startTimeRef.current);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);

  if (!gameState || !gameState.fruits) {
    return <div className="p-8 text-center text-muted-foreground">Loading fruits...</div>;
  }

  const { fruits, combo, myScore } = gameState;
  
  // Find active fruits based on current time
  const activeObjects = fruits.filter((f: any) => {
    const elapsed = currentTime - f.spawnTime;
    // Object lives for 2 seconds (2000ms) traversing the screen
    return elapsed >= 0 && elapsed <= 2000;
  });
  
  const isAllDone = fruits.length > 0 && currentTime > fruits[fruits.length - 1].spawnTime + 2000;

  const handlePointerEnter = (id: number, type: string) => {
    if (slashedIds.has(id)) return;
    
    setSlashedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    sendAction({ type: "slice", fruitId: id, objectType: type });
  };

  if (isAllDone) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <CheckCircle2 size={64} className="text-green-500 animate-bounce" />
        <h2 className="text-3xl font-bold font-heading text-white">Wave Complete!</h2>
        <div className="text-xl text-slate-300">
          Final Score: <span className="text-green-400 font-bold">{myScore}</span>
        </div>
        <p className="text-muted-foreground">Waiting for match to end...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 select-none touch-none overflow-hidden relative">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
        <div className="bg-slate-800/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-700/50">
          <span className="text-muted-foreground font-bold">Score:</span> 
          <span className="text-blue-400 font-bold ml-2 text-xl">{myScore || 0}</span>
        </div>
        
        {combo > 2 && (
          <div className="bg-orange-500/20 text-orange-400 border border-orange-500/50 px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse">
            <Star size={18} fill="currentColor" /> 
            <span className="font-bold text-xl">x{combo}</span>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="relative w-full max-w-4xl h-[60vh] bg-slate-900/60 border-2 border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden cursor-crosshair"
      >
        {activeObjects.map((obj: any) => {
          const isSlashed = slashedIds.has(obj.id);
          const elapsed = currentTime - obj.spawnTime;
          const progress = elapsed / 2000; // 0 to 1
          
          // Basic parabola trajectory calculation
          const startX = obj.x; // % percentage
          // Move slightly horizontally
          const currentX = startX + (progress * 20 - 10); 
          // Parabola: y = 100 - (1 - (progress - 0.5)^2 * 4) * 100
          // Actually, let's just make it go up and then down.
          // Progress 0 -> y=100%, Progress 0.5 -> y=20%, Progress 1.0 -> y=100%
          const currentY = 100 - (Math.sin(progress * Math.PI) * 80);

          if (isSlashed && obj.type === "fruit") {
            return (
              <div 
                key={`slashed-${obj.id}`}
                className="absolute w-16 h-16 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-4xl"
                style={{ left: `${currentX}%`, top: `${currentY}%` }}
              >
                <div className="absolute text-orange-500 animate-ping">💥</div>
              </div>
            );
          }
          
          if (isSlashed && obj.type === "bomb") {
            return (
              <div 
                key={`slashed-${obj.id}`}
                className="absolute w-24 h-24 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-5xl"
                style={{ left: `${currentX}%`, top: `${currentY}%` }}
              >
                <div className="absolute text-red-600 animate-ping">💣</div>
                <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full"></div>
              </div>
            );
          }

          return (
            <div
              key={obj.id}
              onPointerEnter={() => handlePointerEnter(obj.id, obj.type)}
              onPointerDown={() => handlePointerEnter(obj.id, obj.type)}
              className="absolute w-16 h-16 sm:w-20 sm:h-20 cursor-crosshair transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ 
                left: `${currentX}%`, 
                top: `${currentY}%`,
                // Spin animation
                transform: `translate(-50%, -50%) rotate(${progress * 360 * obj.speed}deg)` 
              }}
            >
              {obj.type === "fruit" ? (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-[0_0_15px_rgba(52,211,153,0.5)] border-2 border-green-300 flex items-center justify-center text-2xl">
                  🍉
                </div>
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 shadow-[0_0_20px_rgba(239,68,68,0.8)] border-2 border-red-500 flex items-center justify-center">
                  <Bomb size={32} className="text-red-500 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
        
        {activeObjects.length === 0 && !isAllDone && currentTime > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 font-heading">
            Wait for targets...
          </div>
        )}
      </div>
      
      <p className="mt-6 text-sm text-slate-400 text-center max-w-sm pointer-events-none">
        Drag your cursor/finger across the fruits 🍉 to slice them! Avoid the bombs 💣!
      </p>
    </div>
  );
}
