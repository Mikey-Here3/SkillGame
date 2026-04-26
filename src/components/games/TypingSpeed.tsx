"use client";

import { useState, useEffect, useRef } from "react";
import { Keyboard, AlertCircle } from "lucide-react";

interface TypingSpeedProps {
  gameState: any;
  sendAction: (action: any) => void;
  playerId: string;
}

export function TypingSpeed({ gameState, sendAction, playerId }: TypingSpeedProps) {
  const [typedText, setTypedText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the hidden input when the component mounts or game state changes
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  if (!gameState || !gameState.text) return null;

  const { text, myProgress, myWpm, myErrors } = gameState;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Don't allow typing more than the text length
    if (val.length > text.length) return;
    
    setTypedText(val);
    sendAction({ typed: val, timestamp: Date.now() });
  };

  // Click anywhere to refocus
  const handleContainerClick = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  const getCharClass = (char: string, index: number) => {
    if (index >= typedText.length) {
      // Not typed yet
      return "text-muted-foreground";
    }
    const typedChar = typedText[index];
    if (typedChar === char) {
      // Correct
      return "text-green-400 bg-green-400/10 rounded-sm";
    }
    // Incorrect
    return "text-red-400 bg-red-400/20 rounded-sm underline decoration-red-500";
  };

  return (
    <div 
      className="flex flex-col items-center justify-center w-full h-full p-4 sm:p-8 relative cursor-text"
      onClick={handleContainerClick}
    >
      {/* Hidden input field for mobile/desktop keyboard capture */}
      <input
        ref={inputRef}
        type="text"
        value={typedText}
        onChange={handleChange}
        className="absolute opacity-0 -z-10 h-0 w-0"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      <div className="w-full max-w-3xl flex flex-col gap-8">
        
        {/* Stats Header */}
        <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Speed</span>
              <div className="text-2xl font-bold font-heading text-blue-400">{myWpm || 0} <span className="text-sm">WPM</span></div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Errors</span>
              <div className="text-2xl font-bold font-heading text-red-400 flex items-center gap-1">
                {myErrors || 0} {myErrors > 0 && <AlertCircle size={14} />}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Progress</span>
            <div className="text-2xl font-bold font-heading text-green-400">{myProgress || 0}%</div>
          </div>
        </div>

        {/* Text Display area */}
        <div className="glass-card p-8 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-white/20 group-hover:text-white/40 transition-colors">
            <Keyboard size={24} />
          </div>
          
          <p className="text-2xl sm:text-3xl font-medium font-mono leading-relaxed tracking-wide select-none">
            {text.split("").map((char: string, idx: number) => {
              // Highlight the current cursor position
              const isCursor = idx === typedText.length;
              return (
                <span 
                  key={idx} 
                  className={`relative ${getCharClass(char, idx)} ${isCursor ? "border-l-2 border-blue-500 -ml-[2px] pl-[2px] animate-pulse" : ""}`}
                >
                  {char}
                </span>
              );
            })}
          </p>
        </div>

        {/* Competitor Progress Bars */}
        <div className="space-y-3 mt-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Race Progress</h3>
          {gameState.scores.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className={`w-24 text-sm truncate font-semibold ${p.id === playerId ? "text-blue-400" : "text-muted-foreground"}`}>
                {p.username}
              </div>
              <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden relative border border-white/5">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-300 ${p.id === playerId ? "bg-blue-500" : "bg-white/20"}`}
                  style={{ width: `${p.progress || 0}%` }}
                />
              </div>
              <div className="w-12 text-right text-xs font-mono text-muted-foreground">
                {p.wpm || 0}wpm
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
