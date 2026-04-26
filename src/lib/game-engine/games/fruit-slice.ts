// ===== GAME 2: Fruit Slice =====
import { GameController, GameRoom, GamePlayer } from "../core";

export const fruitSliceController: GameController = {
  gameId: "fruit-slice",
  gameName: "Fruit Slice",

  initializeGame(room: GameRoom) {
    room.players.forEach((p) => {
      p.gameData = { sliced: 0, missed: 0, bombs: 0, combo: 0, maxCombo: 0 };
    });
    // Generate fruit spawn sequence (server-authoritative)
    const fruits = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      type: Math.random() > 0.15 ? "fruit" : "bomb",
      spawnTime: i * 600 + Math.random() * 300,
      x: Math.random() * 80 + 10,
      speed: Math.random() * 2 + 1,
    }));
    return { fruits, totalFruits: fruits.filter((f) => f.type === "fruit").length };
  },

  handlePlayerAction(room, playerId, action) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room };

    const data = player.gameData as { sliced: number; missed: number; bombs: number; combo: number; maxCombo: number };
    const { type, fruitId } = action as { type: string; fruitId: number };

    if (type === "slice") {
      const fruits = (room.gameData as { fruits: Array<{ id: number; type: string }> }).fruits;
      const fruit = fruits.find((f) => f.id === fruitId);
      if (!fruit) return { room };

      if (fruit.type === "bomb") {
        data.bombs++;
        data.combo = 0;
        player.score -= 200;
      } else {
        data.sliced++;
        data.combo++;
        data.maxCombo = Math.max(data.maxCombo, data.combo);
        player.score += 100 + data.combo * 10; // Combo bonus
      }
    } else if (type === "miss") {
      data.missed++;
      data.combo = 0;
    }

    return {
      room,
      playerUpdate: { playerId, data: { score: player.score, combo: data.combo } },
    };
  },

  calculateScores(room) {
    return room.players
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty) {
    const data = bot.gameData as { sliced: number };
    const fruits = (room.gameData as { fruits: Array<{ id: number; type: string }> }).fruits;
    const nextFruit = fruits[data.sliced] || null;
    if (!nextFruit) return null;

    const cfg = {
      easy: { hitChance: 0.6, bombAvoid: 0.5 },
      medium: { hitChance: 0.8, bombAvoid: 0.75 },
      hard: { hitChance: 0.95, bombAvoid: 0.9 },
    }[difficulty];

    if (nextFruit.type === "bomb" && Math.random() < cfg.bombAvoid) {
      return null; // Bot avoids bomb
    }
    if (Math.random() < cfg.hitChance) {
      return { type: "slice", fruitId: nextFruit.id };
    }
    return { type: "miss" };
  },

  validateAction(room, _playerId, action) {
    const { fruitId } = action as { fruitId?: number };
    const fruits = (room.gameData as { fruits: Array<{ id: number }> }).fruits;
    if (fruitId !== undefined && !fruits.find((f) => f.id === fruitId)) {
      return { valid: false, reason: "Invalid fruit ID" };
    }
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    const data = player?.gameData as { combo: number; maxCombo: number } | undefined;
    return {
      fruits: (room.gameData as { fruits: unknown[] }).fruits,
      myScore: player?.score || 0,
      combo: data?.combo || 0,
      scores: room.players.map((p) => ({ id: p.id, username: p.username, score: p.score, isBot: p.isBot })),
    };
  },
};
