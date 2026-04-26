// ===== GAME 6: Typing Speed Battle =====
import { GameController, GameRoom } from "../core";

const sentences = [
  "The quick brown fox jumps over the lazy dog near the river bank",
  "Programming is the art of telling a computer what to do step by step",
  "Victory belongs to those who believe in their skills and never give up",
  "Speed and accuracy are the keys to becoming a typing champion today",
  "Practice makes perfect and every keystroke brings you closer to mastery",
  "The gaming arena awaits players who are ready to prove their worth",
  "Challenge yourself daily and watch your skills grow beyond expectations",
  "In the world of competitive gaming precision matters more than speed",
];

export const typingSpeedController: GameController = {
  gameId: "typing-speed",
  gameName: "Typing Speed Battle",

  initializeGame(room: GameRoom) {
    const text = sentences[Math.floor(Math.random() * sentences.length)];
    room.players.forEach((p) => {
      p.gameData = { typed: "", progress: 0, errors: 0, wpm: 0, startTime: 0 };
    });
    return { text, totalChars: text.length };
  },

  handlePlayerAction(room, playerId, action) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room };

    const data = player.gameData as { typed: string; progress: number; errors: number; wpm: number; startTime: number };
    const { typed, timestamp } = action as { typed: string; timestamp: number };
    const text = (room.gameData as { text: string }).text;

    if (!data.startTime) data.startTime = timestamp;

    data.typed = typed;
    data.progress = Math.round((typed.length / text.length) * 100);

    // Calculate errors
    let errors = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] !== text[i]) errors++;
    }
    data.errors = errors;

    // Calculate WPM
    const elapsedMin = (timestamp - data.startTime) / 60000;
    if (elapsedMin > 0) {
      const words = typed.length / 5;
      data.wpm = Math.round(words / elapsedMin);
    }

    // Score: WPM * accuracy
    const accuracy = Math.max(0, 1 - errors / Math.max(typed.length, 1));
    player.score = Math.round(data.wpm * accuracy * 10);

    const completed = typed.length >= text.length;
    return {
      room,
      broadcast: {
        event: "typing_progress",
        playerId,
        progress: data.progress,
        wpm: data.wpm,
        completed,
      },
    };
  },

  calculateScores(room) {
    return room.players
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty, botConfig) {
    const data = bot.gameData as { typed: string };
    const text = (room.gameData as { text: string }).text;
    if (data.typed.length >= text.length) return null;

    let accuracy = 0.8;
    if (botConfig) {
      if (difficulty === "easy") accuracy = botConfig.easyWinRate / 100;
      else if (difficulty === "medium") accuracy = botConfig.mediumWinRate / 100;
      else if (difficulty === "hard") accuracy = botConfig.hardWinRate / 100;
    } else {
      accuracy = { easy: 0.5, medium: 0.8, hard: 0.98 }[difficulty];
    }

    // Invert accuracy for error rate (1.0 accuracy = 0% error)
    const errorRate = Math.max(0, 0.2 * (1 - accuracy));

    const cfg = {
      easy: { charsPerTick: 1 },
      medium: { charsPerTick: 2 },
      hard: { charsPerTick: 3 },
    }[difficulty];

    let newTyped = data.typed;
    for (let i = 0; i < cfg.charsPerTick; i++) {
      const idx = newTyped.length;
      if (idx >= text.length) break;
      newTyped += Math.random() < errorRate ? "z" : text[idx];
    }

    return { typed: newTyped, timestamp: Date.now() };
  },

  validateAction(_room, _playerId, action) {
    const { typed } = action as { typed?: string };
    if (typeof typed !== "string") {
      return { valid: false, reason: "Typed text must be a string" };
    }
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    const data = player?.gameData as { progress: number; wpm: number; errors: number } | undefined;
    return {
      text: (room.gameData as { text: string }).text,
      myProgress: data?.progress || 0,
      myWpm: data?.wpm || 0,
      myErrors: data?.errors || 0,
      scores: room.players.map((p) => ({
        id: p.id, username: p.username, score: p.score, isBot: p.isBot,
        progress: (p.gameData as { progress: number }).progress,
        wpm: (p.gameData as { wpm: number }).wpm,
      })),
    };
  },
};
