import { GameController, GameRoom } from "../core";
import { Chess } from "chess.js";

export const chessBlitzController: GameController = {
  gameId: "chess-blitz",
  gameName: "Chess Blitz",

  initializeGame(room: GameRoom) {
    room.players.forEach((p, i) => {
      p.gameData = {
        color: i === 0 ? "white" : "black",
        timeLeft: 180000, // 3 min in ms
        moves: 0,
        capturedPieces: [],
      };
    });
    return {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      moves: [] as string[],
      currentTurn: "white",
      gameOver: false,
      result: null as string | null,
      lastMoveTime: Date.now(), // This will be the start time
    };
  },

  handlePlayerAction(room, playerId, action) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room };

    const gd = room.gameData as { fen: string; moves: string[]; currentTurn: string; gameOver: boolean; result: string | null; lastMoveTime: number };
    const playerData = player.gameData as { color: string; moves: number; timeLeft: number };

    if (gd.gameOver) return { room };
    if (playerData.color !== gd.currentTurn) return { room };

    // Deduct time from player who just moved
    const now = Date.now();
    const elapsed = now - gd.lastMoveTime;
    playerData.timeLeft = Math.max(0, playerData.timeLeft - elapsed);
    gd.lastMoveTime = now;

    if (playerData.timeLeft <= 0) {
      gd.gameOver = true;
      gd.result = playerData.color === "white" ? "black_wins_on_time" : "white_wins_on_time";
    }

    const { move, fen, gameOver, result } = action as {
      move: string; fen: string; gameOver?: boolean; result?: string;
    };

    gd.fen = fen;
    gd.moves.push(move);
    playerData.moves++;

    if (gameOver && !gd.gameOver) {
      gd.gameOver = true;
      gd.result = result || "draw";

      if (result === "checkmate") {
        player.score = 1000;
      } else if (result === "draw" || result === "stalemate") {
        room.players.forEach((p) => { p.score = 500; });
      }
    } else {
      gd.currentTurn = gd.currentTurn === "white" ? "black" : "white";
    }

    return {
      room,
      broadcast: { 
        event: "chess_move", 
        playerId, 
        move, 
        fen, 
        currentTurn: gd.currentTurn,
        gameOver: gd.gameOver, 
        result: gd.result,
        players: room.players.map(p => ({
          id: p.id,
          timeLeft: (p.gameData as any).timeLeft
        }))
      },
    };
  },

  calculateScores(room) {
    return room.players
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty, botConfig) {
    const gd = room.gameData as { fen: string; currentTurn: string; gameOver: boolean; result: string | null };
    const botData = bot.gameData as { color: string };

    if (gd.gameOver || gd.currentTurn !== botData.color) return null;

    try {
      const chess = new Chess(gd.fen);
      const moves = chess.moves({ verbose: true });
      if (moves.length === 0) return null;

      let accuracy = 0.5;
      if (botConfig) {
        if (difficulty === "easy") accuracy = botConfig.easyWinRate / 100;
        else if (difficulty === "medium") accuracy = botConfig.mediumWinRate / 100;
        else if (difficulty === "hard") accuracy = botConfig.hardWinRate / 100;
      }

      // Simple heuristic: 
      // Higher accuracy = prioritize captures and checks
      const capturingMoves = moves.filter(m => m.captured || chess.isCheck());
      
      let chosenMove;
      if (Math.random() < accuracy && capturingMoves.length > 0) {
        chosenMove = capturingMoves[Math.floor(Math.random() * capturingMoves.length)];
      } else {
        chosenMove = moves[Math.floor(Math.random() * moves.length)];
      }

      chess.move(chosenMove.san);

      let endState = null;
      if (chess.isCheckmate()) endState = "checkmate";
      else if (chess.isDraw()) endState = "draw";
      else if (chess.isStalemate()) endState = "stalemate";

      return {
        move: chosenMove.san,
        fen: chess.fen(),
        gameOver: chess.isGameOver(),
        result: endState
      };
    } catch (e) {
      console.error("Bot chess error", e);
      return null;
    }
  },

  validateAction(room, playerId, action) {
    const gd = room.gameData as { currentTurn: string };
    const player = room.players.find((p) => p.id === playerId);
    const color = (player?.gameData as { color: string })?.color;
    if (color !== gd.currentTurn) {
      return { valid: false, reason: "Not your turn" };
    }
    const { move } = action as { move?: string };
    if (!move) return { valid: false, reason: "Move is required" };
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    const gd = room.gameData as { fen: string; currentTurn: string; gameOver: boolean; result: string | null };
    return {
      fen: gd.fen,
      myColor: (player?.gameData as { color: string })?.color,
      isMyTurn: (player?.gameData as { color: string })?.color === gd.currentTurn,
      gameOver: gd.gameOver,
      result: gd.result,
      players: room.players.map((p) => ({
        id: p.id, username: p.username, isBot: p.isBot,
        color: (p.gameData as { color: string }).color,
        timeLeft: (p.gameData as { timeLeft: number }).timeLeft,
      })),
    };
  },
};
