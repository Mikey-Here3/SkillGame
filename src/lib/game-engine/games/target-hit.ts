// ===== GAME 7: Target Hit / Aim Game =====
import { GameController, GameRoom } from "../core";

export const targetHitController: GameController = {
  gameId: "target-hit",
  gameName: "Target Hit",

  initializeGame(room: GameRoom) {
    const totalTargets = 30;
    const targets = Array.from({ length: totalTargets }, (_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 80 + 10,
      size: Math.max(20, 60 - i * 1.5), // Targets get smaller
      spawnTime: i * 1500,
      lifespan: Math.max(1000, 3000 - i * 50),
    }));
    room.players.forEach((p) => {
      p.gameData = { hits: 0, misses: 0, totalShots: 0, avgAccuracy: 0 };
    });
    return { targets, totalTargets, currentTarget: 0 };
  },

  handlePlayerAction(room, playerId, action) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room };

    const data = player.gameData as { hits: number; misses: number; totalShots: number };
    const { type, targetId, clickX, clickY } = action as { type: string; targetId: number; clickX: number; clickY: number };

    data.totalShots++;

    if (type === "hit") {
      const targets = (room.gameData as { targets: Array<{ id: number; size: number }> }).targets;
      const target = targets.find((t) => t.id === targetId);
      if (target) {
        data.hits++;
        const sizeBonus = Math.max(1, (60 - target.size) / 10);
        player.score += Math.round(100 * sizeBonus);
      }
    } else {
      data.misses++;
      player.score = Math.max(0, player.score - 20);
    }

    return {
      room,
      broadcast: { event: "shot_fired", playerId, type, targetId, clickX, clickY },
    };
  },

  calculateScores(room) {
    return room.players
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty, botConfig) {
    const gd = room.gameData as { targets: Array<{ id: number }>; currentTarget: number };
    const target = gd.targets[gd.currentTarget];
    if (!target) return null;

    let accuracy = 0.5;
    if (botConfig) {
      if (difficulty === "easy") accuracy = botConfig.easyWinRate / 100;
      else if (difficulty === "medium") accuracy = botConfig.mediumWinRate / 100;
      else if (difficulty === "hard") accuracy = botConfig.hardWinRate / 100;
    } else {
      accuracy = { easy: 0.4, medium: 0.65, hard: 0.9 }[difficulty];
    }

    if (Math.random() < accuracy) {
      return { type: "hit", targetId: target.id, clickX: 0, clickY: 0 };
    }
    return { type: "miss", targetId: -1, clickX: 0, clickY: 0 };
  },

  validateAction(_room, _playerId, action) {
    const { type } = action as { type?: string };
    if (!type || !["hit", "miss"].includes(type)) {
      return { valid: false, reason: "Invalid action type" };
    }
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    const data = player?.gameData as { hits: number; totalShots: number } | undefined;
    return {
      targets: (room.gameData as { targets: unknown[] }).targets,
      myHits: data?.hits || 0,
      myAccuracy: data && data.totalShots > 0 ? Math.round((data.hits / data.totalShots) * 100) : 0,
      scores: room.players.map((p) => ({ id: p.id, username: p.username, score: p.score, isBot: p.isBot })),
    };
  },
};
