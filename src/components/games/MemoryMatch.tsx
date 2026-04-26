"use client";

import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface MemoryMatchProps {
  gameState: any;
  sendAction: (action: any) => void;
  isPractice: boolean;
}

export function MemoryMatch({ gameState, sendAction }: MemoryMatchProps) {
  const [localFlipped, setLocalFlipped] = useState<number[]>([]);

  // When two cards are locally flipped, clear them after a short delay
  useEffect(() => {
    if (localFlipped.length === 2) {
      const timer = setTimeout(() => {
        setLocalFlipped([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [localFlipped]);

  if (!gameState || !gameState.cards) {
    return <div className="p-8 text-center text-muted-foreground">Loading cards...</div>;
  }

  const { cards, myMatches } = gameState;
  const isAllMatched = cards.every((c: any) => c.matched);

  const handleCardClick = (cardId: number) => {
    // Ignore if already matched, or if already flipped, or if 2 cards are currently flipped
    const card = cards.find((c: any) => c.id === cardId);
    if (!card || card.matched || localFlipped.includes(cardId) || localFlipped.length >= 2) {
      return;
    }

    setLocalFlipped(prev => [...prev, cardId]);
    sendAction({ cardId });
  };

  if (isAllMatched) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <CheckCircle2 size={64} className="text-green-500 animate-bounce" />
        <h2 className="text-3xl font-bold font-heading text-white">All Matched!</h2>
        <p className="text-muted-foreground">Waiting for match to end...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 select-none">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold font-heading text-white">
          Matches: <span className="text-purple-400">{myMatches || 0}</span>
        </h3>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg w-full perspective-1000">
        {cards.map((card: any) => {
          const isFlipped = card.matched || localFlipped.includes(card.id);
          
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
                relative w-full aspect-[3/4] cursor-pointer
                transition-all duration-500
                ${!isFlipped ? "hover:-translate-y-1" : ""}
              `}
              style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              {/* Card Front (Hidden side) */}
              <div 
                className={`
                  absolute inset-0 w-full h-full backface-hidden rounded-xl
                  bg-slate-800 border-2 border-slate-700 shadow-lg flex items-center justify-center
                `}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <span className="text-slate-500 text-sm">?</span>
                </div>
              </div>

              {/* Card Back (Emoji side) */}
              <div 
                className={`
                  absolute inset-0 w-full h-full backface-hidden rounded-xl flex items-center justify-center text-4xl sm:text-5xl
                  ${card.matched ? "bg-green-500/20 border-2 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-purple-600 border-2 border-purple-400 shadow-lg"}
                `}
                style={{ 
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
              >
                {card.emoji}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
