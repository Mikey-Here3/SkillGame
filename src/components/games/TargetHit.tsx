"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Crosshair } from "lucide-react";

interface TargetHitProps {
  gameState: any;
  sendAction: (action: any) => void;
  isPractice: boolean;
}

export function TargetHit({ gameState, sendAction }: TargetHitProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  
  // Track clicked targets locally so they disappear immediately
  const [clickedIds, setClickedIds] = useState<Set<number>>(new Set());

  // Game loop for timers
  useEffect(() => {
    if (!gameState || !gameState.targets) return;

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

  if (!gameState || !gameState.targets) {
    return <div className="p-8 text-center text-muted-foreground">Loading targets...</div>;
  }

  const { targets, myHits, myAccuracy } = gameState;
  
  const activeTargets = targets.filter((t: any) => {
    if (clickedIds.has(t.id)) return false;
    const elapsed = currentTime - t.spawnTime;
    return elapsed >= 0 && elapsed <= t.lifespan;
  });
  
  const isAllDone = targets.length > 0 && currentTime > targets[targets.length - 1].spawnTime + targets[targets.length - 1].lifespan + 1000;

  const handleTargetClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent background click (miss)
    
    setClickedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Provide generic coords, backend currently ignores them mostly, just needs id
    sendAction({ type: "hit", targetId: id, clickX: e.clientX, clickY: e.clientY });
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (isAllDone) return;
    // It's a miss
    sendAction({ type: "miss", targetId: -1, clickX: e.clientX, clickY: e.clientY });
  };

  if (isAllDone) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <CheckCircle2 size={64} className="text-green-500 animate-bounce" />
        <h2 className="text-3xl font-bold font-heading text-white">Course Complete!</h2>
        <div className="flex gap-6 text-xl text-slate-300">
          <div>Hits: <span className="text-green-400 font-bold">{myHits}</span></div>
          <div>Accuracy: <span className="text-blue-400 font-bold">{myAccuracy}%</span></div>
        </div>
        <p className="text-muted-foreground mt-4">Waiting for match to end...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 select-none touch-none">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4 px-4 pointer-events-none">
        <div className="flex items-center gap-2 text-slate-300">
          <Crosshair className="text-red-400" />
          <span className="font-bold">Hits:</span>
          <span className="text-green-400 font-bold text-xl">{myHits}</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-bold">Accuracy:</span>
          <span className={`font-bold text-xl ${myAccuracy > 80 ? "text-blue-400" : myAccuracy > 50 ? "text-amber-400" : "text-red-400"}`}>
            {myAccuracy}%
          </span>
        </div>
      </div>

      <div 
        onMouseDown={handleBackgroundClick}
        className="relative w-full max-w-4xl h-[60vh] bg-slate-900 border-2 border-slate-700/50 rounded-2xl shadow-inner overflow-hidden cursor-crosshair active:bg-slate-800/80 transition-colors duration-75"
      >
        {activeTargets.map((target: any) => {
          const elapsed = currentTime - target.spawnTime;
          const progress = elapsed / target.lifespan; // 0 to 1
          
          // Size shrinks as time goes on, down to 30% of original
          const currentSize = target.size * (1 - progress * 0.7);
          
          return (
            <div
              key={target.id}
              onMouseDown={(e) => handleTargetClick(e, target.id)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full cursor-crosshair flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${currentSize}px`,
                height: `${currentSize}px`,
                backgroundColor: "rgba(239, 68, 68, 0.2)",
              }}
            >
              {/* Inner bullseye rings */}
              <div className="w-[70%] h-[70%] rounded-full border border-red-400 bg-red-500/30 flex items-center justify-center">
                <div className="w-[40%] h-[40%] rounded-full bg-red-500"></div>
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="mt-6 text-sm text-slate-400 pointer-events-none">
        Click the targets before they disappear. Missed clicks deduct points!
      </p>
    </div>
  );
}
