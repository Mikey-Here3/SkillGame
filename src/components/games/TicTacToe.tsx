"use client";

import { User } from "lucide-react";

interface TicTacToeProps {
  gameState: any;
  sendAction: (action: any) => void;
  playerId: string;
}

export function TicTacToe({ gameState, sendAction, playerId }: TicTacToeProps) {
  if (!gameState || !gameState.board) return null;

  const { board, winner, isDraw, players, currentTurn } = gameState;
  
  // Calculate locally to avoid stale state in updates
  const mySymbol = gameState.mySymbol || (players.find((p: any) => p.id === playerId)?.symbol);
  const isMyTurn = gameState.isMyTurn !== undefined ? gameState.isMyTurn : (players[currentTurn]?.id === playerId);

  const handleCellClick = (index: number) => {
    if (!isMyTurn || winner || isDraw || board[index] !== null) return;
    sendAction({ cell: index });
  };

  const getCellClasses = (value: string | null, index: number) => {
    let classes = "w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center text-4xl sm:text-6xl font-bold font-heading rounded-xl transition-all ";
    
    if (value === "X") classes += "text-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] bg-blue-500/10 ";
    else if (value === "O") classes += "text-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] bg-red-500/10 ";
    else classes += "bg-white/5 hover:bg-white/10 cursor-pointer ";

    if (winner && board[index] === winner) {
      classes += "animate-pulse shadow-[0_0_30px_rgba(255,255,255,0.3)] ";
    }

    return classes;
  };

  const currentPlayer = players[currentTurn];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      {/* Status Header */}
      <div className="mb-8 text-center space-y-2">
        {winner ? (
          <h2 className="text-3xl font-bold text-green-400 font-heading animate-bounce">
            {winner === playerId ? "You Won!" : "You Lost!"}
          </h2>
        ) : isDraw ? (
          <h2 className="text-3xl font-bold text-amber-400 font-heading">Draw!</h2>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold font-heading">
              {isMyTurn ? "Your Turn" : "Opponent's Turn"}
            </h2>
            <div className="flex items-center gap-4 text-sm font-semibold bg-black/40 px-4 py-2 rounded-full border border-white/10">
              <span className={mySymbol === "X" ? "text-blue-400" : "text-muted-foreground"}>
                You ({mySymbol})
              </span>
              <span className="text-muted-foreground">vs</span>
              <span className={mySymbol === "O" ? "text-blue-400" : "text-muted-foreground"}>
                {players.find((p: any) => p.id !== playerId)?.username} ({mySymbol === "X" ? "O" : "X"})
              </span>
            </div>
            {!isMyTurn && currentPlayer && (
              <p className="text-muted-foreground text-sm animate-pulse flex items-center gap-2 mt-2">
                <User size={14} /> Waiting for {currentPlayer.username}...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 p-4 glass-card rounded-2xl relative">
        {board.map((cell: string | null, idx: number) => (
          <button
            key={idx}
            onClick={() => handleCellClick(idx)}
            disabled={!isMyTurn || !!winner || !!isDraw || cell !== null}
            className={getCellClasses(cell, idx)}
          >
            {cell}
          </button>
        ))}

        {/* Overlay for not your turn to prevent clicking */}
        {!isMyTurn && !winner && !isDraw && (
          <div className="absolute inset-0 z-10 cursor-not-allowed"></div>
        )}
      </div>
    </div>
  );
}
