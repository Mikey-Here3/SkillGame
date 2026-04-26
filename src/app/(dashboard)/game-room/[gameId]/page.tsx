"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import io, { Socket } from "socket.io-client";
import { GAME_LIST } from "@/lib/game-engine";
import { Users, Clock, Trophy, AlertTriangle, ArrowLeft, Bot } from "lucide-react";
import { toast } from "sonner";

import { ReactionSpeed } from "@/components/games/ReactionSpeed";
import { TicTacToe } from "@/components/games/TicTacToe";
import { TypingSpeed } from "@/components/games/TypingSpeed";
import { WordSearch } from "@/components/games/WordSearch";
import { MemoryMatch } from "@/components/games/MemoryMatch";
import { MathSpeed } from "@/components/games/MathSpeed";
import { SequenceMemory } from "@/components/games/SequenceMemory";
import { FruitSlice } from "@/components/games/FruitSlice";
import { TargetHit } from "@/components/games/TargetHit";
import { ChessBlitz } from "@/components/games/ChessBlitz";
import { CrashTiming } from "@/components/games/CrashTiming";
export default function GameRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token, updateBalance } = useAuthStore();
  
  const gameId = params.gameId as string;
  const entryFee = parseFloat(searchParams.get("fee") || "0");
  const isPractice = searchParams.get("practice") === "true";
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [status, setStatus] = useState<"connecting" | "waiting" | "playing" | "ended">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<any>(null);

  const gameMeta = GAME_LIST.find((g) => g.id === gameId);

  useEffect(() => {
    if (!user) return;

    // Connect to Socket server
    const socketInstance = io({
      path: "/socket.io",
      auth: { token },
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      // Server fetches config from DB — never trust client with config
      socketInstance.emit("join_matchmaking", {
        gameId,
        entryFee,
        userId: user.id,
        username: user.username,
        isPractice,
      });
    });

    socketInstance.on("room_update", (data) => {
      setRoom(data);
      if (data.status === "waiting") setStatus("waiting");
    });

    socketInstance.on("countdown", (data) => {
      setCountdown(data.seconds);
    });

    socketInstance.on("game_start", (data) => {
      setRoom(data.room);
      setGameState(data.gameState);
      setStatus("playing");
      setCountdown(null);
      // Deduct balance locally if not practice
      if (!isPractice && entryFee > 0) {
        updateBalance(user.balance - entryFee);
      }
    });

    socketInstance.on("game_update", (data) => {
      setGameState((prev: any) => ({ ...prev, ...data }));
    });

    socketInstance.on("scores_update", (data) => {
      setScores(data.scores.sort((a: any, b: any) => b.score - a.score));
    });

    socketInstance.on("game_end", (data) => {
      setStatus("ended");
      setGameResult(data);
      // We should ideally fetch user data again to get updated balance/coins, but we'll show results here
    });

    socketInstance.on("matchmaking_error", (data) => {
      setError(data.error);
      setStatus("ended");
    });

    return () => {
      socketInstance.emit("leave_room");
      socketInstance.disconnect();
    };
  }, [user, gameId]);

  const sendAction = (action: any) => {
    if (socket && room && status === "playing") {
      socket.emit("game_action", { roomCode: room.roomCode, action });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <AlertTriangle size={48} className="text-red-400" />
        <h2 className="text-xl font-bold font-heading">Connection Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <button onClick={() => router.push("/games")} className="btn-neon px-6 py-2 rounded-xl">
          Return to Games
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col glass-card rounded-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#131315]/50">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/games")} className="text-muted-foreground hover:text-white">
              <ArrowLeft size={20} />
            </button>
            <span className="text-2xl">{gameMeta?.icon}</span>
            <h2 className="font-bold font-heading">{gameMeta?.name}</h2>
            {isPractice && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 ml-2">
                Practice
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            {room && (
              <div className="flex items-center gap-1.5 text-amber-400">
                <Trophy size={16} /> Pool: Rs. {room.prizePool}
              </div>
            )}
          </div>
        </div>

        {/* Game Canvas / Content */}
        <div className="flex-1 relative flex items-center justify-center bg-black/40">
          {status === "connecting" && (
            <div className="text-center animate-pulse">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-heading">Connecting to server...</p>
            </div>
          )}

          {status === "waiting" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4 animate-bounce">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold font-heading mb-2">Matchmaking</h3>
              <p className="text-muted-foreground mb-4">
                Waiting for players... {room?.players?.length || 1}/{room?.maxPlayers || 4}
              </p>
              {countdown !== null && (
                <div className="text-4xl font-bold text-amber-400 font-heading animate-pulse">
                  Game starting in {countdown}
                </div>
              )}
            </div>
          )}

          {status === "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {gameId === "reaction-speed" && (
                <ReactionSpeed gameState={gameState} sendAction={sendAction} isPractice={isPractice} />
              )}
              {gameId === "tic-tac-toe" && (
                <TicTacToe gameState={gameState} sendAction={sendAction} playerId={user?.id || ""} />
              )}
              {gameId === "typing-speed" && (
                <TypingSpeed gameState={gameState} sendAction={sendAction} playerId={user?.id || ""} />
              )}
              {gameId === "word-search" && (
                <WordSearch gameState={gameState} sendAction={sendAction} isPractice={isPractice} />
              )}
              {gameId === "memory-match" && (
                <MemoryMatch gameState={gameState} sendAction={sendAction} isPractice={isPractice} />
              )}
              {gameId === "math-speed" && (
                <MathSpeed gameState={gameState} sendAction={sendAction} isPractice={isPractice} />
              )}
              {gameId === "sequence-memory" && (
                <SequenceMemory gameState={gameState} sendAction={sendAction} isPractice={isPractice} />
              )}
              {gameId === "fruit-slice" && (
                <FruitSlice gameState={gameState} sendAction={sendAction} isPractice={isPractice} />
              )}
              {gameId === "target-hit" && (
                <TargetHit gameState={gameState} sendAction={sendAction} isPractice={isPractice} />
              )}
              {gameId === "chess-blitz" && (
                <ChessBlitz gameState={gameState} sendAction={sendAction} isPractice={isPractice} />
              )}
              {gameId === "crash-timing" && (
                <CrashTiming gameState={gameState} sendAction={sendAction} isPractice={isPractice} />
              )}
              
              {/* Fallback for unimplemented games */}
              {![
                "reaction-speed", "tic-tac-toe", "typing-speed", 
                "word-search", "memory-match", "math-speed", "sequence-memory",
                "fruit-slice", "target-hit", "chess-blitz", "crash-timing"
              ].includes(gameId) && (
                <div className="text-center space-y-6 p-6">
                  <h3 className="text-2xl font-bold font-heading text-blue-400">Game Active</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    The socket connection is live and tracking state. 
                    The specific UI component for {gameMeta?.name} is under development.
                  </p>
                  <button 
                    onClick={() => sendAction({ type: "play_move", score: Math.floor(Math.random() * 100) })}
                    className="btn-neon px-8 py-4 rounded-xl text-lg font-bold"
                  >
                    Simulate Score Action
                  </button>
                </div>
              )}
            </div>
          )}

          {status === "ended" && gameResult && (
            <div className="text-center p-8 glass-card rounded-3xl bg-gradient-to-b from-blue-600/20 to-purple-600/20 border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500 max-w-lg w-full mx-4">
              <div className="w-20 h-20 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-400/30">
                <Trophy size={40} className="text-amber-400" />
              </div>
              <h2 className="text-4xl font-black font-heading mb-2 text-white italic tracking-tighter">GAME OVER</h2>
              <p className="text-blue-300 font-semibold mb-8 uppercase tracking-widest text-xs">Match Statistics & Rewards</p>
              
              <div className="space-y-3 mb-8 text-left">
                {gameResult.players.sort((a: any, b: any) => a.rank - b.rank).map((p: any) => {
                  const isMe = p.id === user?.id;
                  return (
                    <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl ${isMe ? "bg-blue-500/20 border border-blue-400/30" : "bg-black/40 border border-white/5"}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          p.rank === 1 ? "bg-amber-400 text-black" : 
                          p.rank === 2 ? "bg-slate-300 text-black" : 
                          "bg-orange-800/50 text-white"
                        }`}>
                          {p.rank}
                        </div>
                        <div>
                          <div className={`font-bold ${isMe ? "text-blue-400" : "text-white"}`}>
                            {p.username} {p.isBot && "(Bot)"}
                            {isMe && <span className="ml-2 text-[10px] bg-blue-500/20 px-2 py-0.5 rounded uppercase">You</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Score: {p.score}</div>
                        </div>
                      </div>
                      <div className={`font-mono font-bold ${p.earnings > 0 ? "text-green-400" : "text-slate-500"}`}>
                        {p.earnings > 0 ? `+Rs. ${p.earnings}` : "Rs. 0"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => router.push("/games")} 
                  className="glass-card py-4 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/10"
                >
                  EXIT TO LOBBY
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn-neon py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                >
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar: Players & Scores */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="glass-card rounded-2xl p-4 flex-1">
          <h3 className="font-semibold font-heading mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-400" /> Leaderboard
          </h3>
          <div className="space-y-2">
            {scores.length > 0 ? scores.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                  <span className={`text-sm ${s.id === user?.id ? "text-blue-400 font-semibold" : ""}`}>
                    {s.username} {s.isBot && <Bot size={12} className="inline text-muted-foreground ml-1" />}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold">{s.score}</span>
              </div>
            )) : room?.players?.map((p: any, idx: number) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/5 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>{p.username} {p.isBot && <Bot size={12} className="inline text-muted-foreground ml-1" />}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Game Stats Info */}
        <div className="glass-card rounded-2xl p-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entry Fee</span>
              <span>{isPractice ? "Free" : `Rs. ${entryFee}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize text-green-400">{status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
