// ===== GAME 9: Tic Tac Toe (Multiplayer) =====
import { GameController, GameRoom } from "../core";

export const ticTacToeController: GameController = {
  gameId: "tic-tac-toe",
  gameName: "Tic Tac Toe",

  initializeGame(room: GameRoom) {
    const board = Array(9).fill(null);
    // Assign X and O
    room.players.forEach((p, i) => {
      p.gameData = { symbol: i === 0 ? "X" : "O", moves: 0 };
    });
    return { board, currentTurn: 0, winner: null, isDraw: false };
  },

  handlePlayerAction(room, playerId, action) {
    const gd = room.gameData as { board: (string | null)[]; currentTurn: number; winner: string | null; isDraw: boolean };
    if (gd.winner || gd.isDraw) return { room };

    const playerIdx = room.players.findIndex((p) => p.id === playerId);
    if (playerIdx !== gd.currentTurn) return { room }; // Not your turn

    const player = room.players[playerIdx];
    const { cell } = action as { cell: number };
    const symbol = (player.gameData as { symbol: string }).symbol;

    if (gd.board[cell] !== null) return { room };

    gd.board[cell] = symbol;
    (player.gameData as { moves: number }).moves++;

    // Check win
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, b, c] of wins) {
      if (gd.board[a] && gd.board[a] === gd.board[b] && gd.board[b] === gd.board[c]) {
        gd.winner = playerId;
        player.score = 1000;
        // Loser gets 0
        return {
          room,
          broadcast: { event: "game_won", winner: playerId, board: gd.board, gameOver: true },
        };
      }
    }

    // Check draw
    if (gd.board.every((c) => c !== null)) {
      gd.isDraw = true;
      room.players.forEach((p) => { p.score = 500; });
      return {
        room,
        broadcast: { event: "game_draw", board: gd.board, gameOver: true },
      };
    }

    // Switch turn
    gd.currentTurn = (gd.currentTurn + 1) % room.players.length;

    return {
      room,
      broadcast: { event: "move_made", playerId, cell, symbol, nextTurn: gd.currentTurn, board: gd.board },
    };
  },

  calculateScores(room) {
    return room.players
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty, botConfig) {
    const gd = room.gameData as { board: (string | null)[]; currentTurn: number; winner: string | null };
    if (gd.winner) return null;

    const botIdx = room.players.findIndex((p) => p.id === bot.id);
    if (botIdx !== gd.currentTurn) return null;

    const botSymbol = (bot.gameData as { symbol: string }).symbol;
    const oppSymbol = botSymbol === "X" ? "O" : "X";
    const empty = gd.board.map((v, i) => v === null ? i : -1).filter((i) => i >= 0);

    if (empty.length === 0) return null;

    let accuracy = 0.5;
    if (botConfig) {
      if (difficulty === "easy") accuracy = botConfig.easyWinRate / 100;
      else if (difficulty === "medium") accuracy = botConfig.mediumWinRate / 100;
      else if (difficulty === "hard") accuracy = botConfig.hardWinRate / 100;
    } else {
      accuracy = { easy: 0.3, medium: 0.6, hard: 0.9 }[difficulty];
    }

    // Roll for intelligence
    const isIntelligent = Math.random() < accuracy;

    if (isIntelligent) {
      // 1. Try to win
      for (const cell of empty) {
        const testBoard = [...gd.board];
        testBoard[cell] = botSymbol;
        if (checkWin(testBoard, botSymbol)) return { cell };
      }
      // 2. Block opponent
      for (const cell of empty) {
        const testBoard = [...gd.board];
        testBoard[cell] = oppSymbol;
        if (checkWin(testBoard, oppSymbol)) return { cell };
      }
      // 3. Take center
      if (empty.includes(4)) return { cell: 4 };
    }

    // Random move (either because roll failed or no tactical move found)
    return { cell: empty[Math.floor(Math.random() * empty.length)] };
  },

  validateAction(room, _playerId, action) {
    const { cell } = action as { cell?: number };
    if (cell === undefined || cell < 0 || cell > 8) {
      return { valid: false, reason: "Cell must be 0-8" };
    }
    const board = (room.gameData as { board: (string | null)[] }).board;
    if (board[cell] !== null) {
      return { valid: false, reason: "Cell already taken" };
    }
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    const gd = room.gameData as { board: (string | null)[]; currentTurn: number; winner: string | null; isDraw: boolean };
    return {
      board: gd.board,
      mySymbol: (player?.gameData as { symbol: string })?.symbol,
      currentTurn: gd.currentTurn,
      isMyTurn: room.players.findIndex((p) => p.id === playerId) === gd.currentTurn,
      winner: gd.winner,
      isDraw: gd.isDraw,
      players: room.players.map((p) => ({
        id: p.id, username: p.username, isBot: p.isBot,
        symbol: (p.gameData as { symbol: string }).symbol,
      })),
    };
  },
};

function checkWin(board: (string | null)[], symbol: string): boolean {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return wins.some(([a, b, c]) => board[a] === symbol && board[b] === symbol && board[c] === symbol);
}
