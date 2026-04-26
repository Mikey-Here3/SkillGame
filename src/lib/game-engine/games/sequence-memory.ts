// ===== GAME 8: Sequence Memory =====
import { GameController, GameRoom } from "../core";

export const sequenceMemoryController: GameController = {
  gameId: "sequence-memory",
  gameName: "Sequence Memory",

  initializeGame(room: GameRoom) {
    // Generate a long sequence, players must repeat progressively longer portions
    const fullSequence = Array.from({ length: 30 }, () => Math.floor(Math.random() * 9));
    room.players.forEach((p) => {
      p.gameData = { currentLevel: 1, lives: 3, maxLevel: 0 };
    });
    return { fullSequence, maxLevel: 30 };
  },

  handlePlayerAction(room, playerId, action) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room };

    const data = player.gameData as { currentLevel: number; lives: number; maxLevel: number };
    const { sequence } = action as { sequence: number[] };
    const fullSequence = (room.gameData as { fullSequence: number[] }).fullSequence;

    const expected = fullSequence.slice(0, data.currentLevel);
    const correct = JSON.stringify(sequence) === JSON.stringify(expected);

    if (correct) {
      data.maxLevel = data.currentLevel;
      data.currentLevel++;
      player.score += data.currentLevel * 50;
    } else {
      data.lives--;
      if (data.lives <= 0) {
        // Player eliminated
        player.score += data.maxLevel * 30;
      }
    }

    return {
      room,
      broadcast: { event: "sequence_attempt", playerId, correct, level: data.currentLevel },
    };
  },

  calculateScores(room) {
    return room.players
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty, botConfig) {
    const data = bot.gameData as { currentLevel: number; lives: number };
    if (data.lives <= 0) return null;

    const fullSequence = (room.gameData as { fullSequence: number[] }).fullSequence;
    const expected = fullSequence.slice(0, data.currentLevel);

    let accuracy = 0.5;
    if (botConfig) {
      if (difficulty === "easy") accuracy = botConfig.easyWinRate / 100;
      else if (difficulty === "medium") accuracy = botConfig.mediumWinRate / 100;
      else if (difficulty === "hard") accuracy = botConfig.hardWinRate / 100;
    } else {
      accuracy = { easy: 0.2, medium: 0.5, hard: 0.85 }[difficulty];
    }

    // Dynamic memory limit and error chance based on accuracy
    const memoryLimit = 3 + accuracy * 20;
    const errorChance = Math.max(0.01, 1 - accuracy);

    if (data.currentLevel > memoryLimit || Math.random() < errorChance) {
      const wrong = [...expected];
      wrong[Math.floor(Math.random() * wrong.length)] = Math.floor(Math.random() * 9);
      return { sequence: wrong };
    }
    return { sequence: expected };
  },

  validateAction(_room, _playerId, action) {
    const { sequence } = action as { sequence?: number[] };
    if (!Array.isArray(sequence)) return { valid: false, reason: "Sequence must be an array" };
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    const data = player?.gameData as { currentLevel: number; lives: number } | undefined;
    const fullSequence = (room.gameData as { fullSequence: number[] }).fullSequence;
    return {
      sequenceToShow: fullSequence.slice(0, data?.currentLevel || 1),
      level: data?.currentLevel || 1,
      lives: data?.lives || 3,
      scores: room.players.map((p) => ({ id: p.id, username: p.username, score: p.score, isBot: p.isBot })),
    };
  },
};
