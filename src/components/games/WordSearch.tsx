"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface WordSearchProps {
  gameState: any;
  sendAction: (action: any) => void;
  isPractice: boolean;
}

export function WordSearch({ gameState, sendAction }: WordSearchProps) {
  const [selection, setSelection] = useState<{ row: number; col: number }[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  if (!gameState || !gameState.grid) {
    return <div className="p-8 text-center text-muted-foreground">Loading puzzle...</div>;
  }

  const { grid, words, myFound } = gameState;

  const handlePointerDown = (row: number, col: number) => {
    setIsSelecting(true);
    setSelection([{ row, col }]);
  };

  const handlePointerEnter = (row: number, col: number) => {
    if (!isSelecting) return;
    
    // Only allow straight lines (horizontal, vertical, diagonal)
    const start = selection[0];
    const dr = row - start.row;
    const dc = col - start.col;
    
    // Check if it's a valid straight line
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
      const newSelection = [];
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
      const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
      
      for (let i = 0; i <= steps; i++) {
        newSelection.push({ row: start.row + stepR * i, col: start.col + stepC * i });
      }
      setSelection(newSelection);
    }
  };

  const handlePointerUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    
    if (selection.length > 1) {
      const selectedWord = selection.map(pos => grid[pos.row][pos.col]).join("");
      const reversedWord = selectedWord.split("").reverse().join("");
      
      if (words.includes(selectedWord)) {
        sendAction({ word: selectedWord });
      } else if (words.includes(reversedWord)) {
        sendAction({ word: reversedWord });
      }
    }
    
    setSelection([]);
  };

  const isCellSelected = (r: number, c: number) => {
    return selection.some(pos => pos.row === r && pos.col === c);
  };

  const isAllFound = myFound?.length === words?.length;

  if (isAllFound) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <CheckCircle2 size={64} className="text-green-500 animate-bounce" />
        <h2 className="text-3xl font-bold font-heading text-white">All Words Found!</h2>
        <p className="text-muted-foreground">Waiting for match to end...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-center h-full w-full gap-8 p-4 select-none" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      {/* Grid */}
      <div 
        ref={gridRef}
        className="grid gap-1 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 shadow-xl backdrop-blur-sm touch-none"
        style={{ gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))` }}
      >
        {grid.map((row: string[], rIndex: number) => (
          row.map((letter: string, cIndex: number) => {
            const selected = isCellSelected(rIndex, cIndex);
            return (
              <div
                key={`${rIndex}-${cIndex}`}
                onPointerDown={() => handlePointerDown(rIndex, cIndex)}
                onPointerEnter={() => handlePointerEnter(rIndex, cIndex)}
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center
                  text-lg sm:text-xl md:text-2xl font-bold font-heading rounded-md cursor-pointer
                  transition-colors duration-100
                  ${selected ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.8)] scale-110" : "bg-slate-900 text-slate-300 hover:bg-slate-700"}
                `}
              >
                {letter}
              </div>
            );
          })
        ))}
      </div>

      {/* Word List */}
      <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 shadow-xl backdrop-blur-sm w-full md:w-64">
        <h3 className="text-xl font-bold font-heading text-white text-center border-b border-slate-700 pb-2">Words to Find</h3>
        <div className="flex flex-col gap-2">
          {words.map((word: string) => {
            const found = myFound?.includes(word);
            return (
              <div 
                key={word} 
                className={`flex items-center justify-between p-2 rounded-lg transition-all ${found ? "bg-green-500/20 text-green-400" : "bg-slate-900/50 text-slate-300"}`}
              >
                <span className={`font-mono font-bold tracking-widest ${found ? "line-through opacity-70" : ""}`}>{word}</span>
                {found && <CheckCircle2 size={16} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
