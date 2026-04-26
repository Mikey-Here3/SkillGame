"use client";

import { useEffect, useState, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

interface ChessBlitzProps {
  gameState: any;
  sendAction: (action: any) => void;
  isPractice: boolean;
}

export function ChessBlitz({ gameState, sendAction }: ChessBlitzProps) {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [localTimeLeft, setLocalTimeLeft] = useState<Record<string, number>>({});

  // Sync local chess instance with server when it's not our turn
  useEffect(() => {
    if (!gameState || !gameState.fen) return;
    
    // Always sync FEN on update to ensure both boards are identical
    try {
      const newGame = new Chess(gameState.fen);
      setGame(newGame);
      setFen(newGame.fen());
    } catch (e) {
      console.error("Invalid FEN received:", gameState.fen);
    }

    // Sync times from server
    if (gameState.players) {
      const times: Record<string, number> = {};
      gameState.players.forEach((p: any) => {
        times[p.id] = p.timeLeft;
      });
      setLocalTimeLeft(times);
    }
  }, [gameState?.fen, gameState?.players]);

  // Local timer countdown
  useEffect(() => {
    if (!gameState || gameState.gameOver) return;

    const interval = setInterval(() => {
      const turnColor = gameState.currentTurn || (game.turn() === "w" ? "white" : "black");
      const activePlayer = gameState.players?.find((p: any) => p.color === turnColor);
      
      if (activePlayer) {
        setLocalTimeLeft(prev => ({
          ...prev,
          [activePlayer.id]: Math.max(0, (prev[activePlayer.id] || 180000) - 1000)
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.currentTurn, gameState?.gameOver, gameState?.players, game]);

  if (!gameState) {
    return <div className="p-8 text-center text-muted-foreground">Loading chess board...</div>;
  }

  const { myColor, gameOver, result, players } = gameState;
  const currentTurn = gameState.currentTurn || (game.turn() === "w" ? "white" : "black");
  const isMyTurn = myColor === currentTurn;
  
  const opponent = players?.find((p: any) => p.color !== myColor);
  const me = players?.find((p: any) => p.color === myColor);

  function formatTime(ms: number) {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function makeAMove(move: { from: string; to: string; promotion?: string }) {
    if (!isMyTurn || gameOver) return false;

    const gameCopy = new Chess(game.fen());
    
    try {
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        setFen(gameCopy.fen());
        
        // Check game over state
        let endState = null;
        if (gameCopy.isCheckmate()) endState = "checkmate";
        else if (gameCopy.isDraw()) endState = "draw";
        else if (gameCopy.isStalemate()) endState = "stalemate";

        sendAction({
          move: result.san,
          fen: gameCopy.fen(),
          gameOver: gameCopy.isGameOver(),
          result: endState
        });
        
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  function onDrop(sourceSquare: string, targetSquare: string, piece: string) {
    const isPromotion = 
      (piece[1] === "P" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
      (piece[1] === "P" && sourceSquare[1] === "2" && targetSquare[1] === "1");

    return makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: isPromotion ? piece[1].toLowerCase() ?? "q" : undefined,
    });
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 select-none">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-center w-full max-w-2xl px-4 text-slate-300 bg-slate-800/80 rounded-xl p-4 border border-slate-700 shadow-lg">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${myColor === "white" ? "bg-white text-black" : "bg-black text-white border border-white/20"}`}>
            {myColor === "white" ? "W" : "B"}
          </div>
          <div>
            <div className="font-bold flex items-center gap-2">
              {me?.username} 
              {isMyTurn && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
            <div className={`font-mono text-xl ${isMyTurn ? "text-green-400" : "text-slate-400"}`}>
              {formatTime(localTimeLeft[me?.id] || 180000)}
            </div>
          </div>
        </div>
        
        <div className="font-mono text-xl font-black text-slate-500 my-2 md:my-0">
          VS
        </div>

        <div className="flex items-center gap-4 flex-row-reverse">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${opponent?.color === "white" ? "bg-white text-black" : "bg-black text-white border border-white/20"}`}>
            {opponent?.color === "white" ? "W" : "B"}
          </div>
          <div className="text-right">
            <div className="font-bold flex items-center justify-end gap-2">
              {!isMyTurn && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              {opponent?.username} {opponent?.isBot ? "(Bot)" : ""}
            </div>
            <div className={`font-mono text-xl ${!isMyTurn ? "text-green-400" : "text-slate-400"}`}>
              {formatTime(localTimeLeft[opponent?.id] || 180000)}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md aspect-square rounded-lg overflow-hidden shadow-2xl border-4 border-slate-700">
        <Chessboard 
          position={fen} 
          onPieceDrop={onDrop}
          boardOrientation={myColor === "black" ? "black" : "white"}
          customDarkSquareStyle={{ backgroundColor: "#475569" }}
          customLightSquareStyle={{ backgroundColor: "#cbd5e1" }}
        />
      </div>

      {gameOver && (
        <div className="mt-8 text-center bg-slate-800/90 p-6 rounded-2xl border border-slate-600 shadow-xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <h2 className="text-3xl font-bold font-heading text-white capitalize">
            {result?.replace(/_/g, " ") || "Game Over"}!
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">Redirecting to results...</p>
        </div>
      )}
    </div>
  );
}
