// ===== GAME 1: Reaction Speed Battle =====
import { GameController, GameRoom, GamePlayer } from "../core";

export const reactionSpeedController: GameController = {
  gameId: "reaction-speed",
  gameName: "Reaction Speed Battle",

  initializeGame(room: GameRoom) {
    // Generate random delay times for each round (3-7 seconds)
    const rounds = 5;
    const delays = Array.from({ length: rounds }, () =>
      Math.floor(Math.random() * 4000) + 3000
    );
    room.players.forEach((p) => {
      p.gameData = { reactions: [], currentRound: 0, missed: 0 };
    });
    return { rounds, delays, currentRound: 0, roundActive: false, signalTime: 0 };
  },

  handlePlayerAction(room, playerId, action) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room };

    const { type, reactionTime } = action as { type: string; reactionTime: number };
    const data = player.gameData as { reactions: number[]; missed: number };
    const gd = room.gameData as { currentRound: number; rounds: number };

    // Prevent reacting multiple times in the same round
    if (data.reactions.length > gd.currentRound) {
        return { room, error: "Already reacted this round" };
    }

    if (type === "react") {
      // Anti-cheat: reaction time must be > 100ms
      const rt = Math.max(reactionTime as number, 100);
      data.reactions.push(rt);
      player.score += Math.max(0, 1000 - rt); // Higher score for faster reaction
    } else if (type === "miss") {
      data.missed++;
      data.reactions.push(9999); // max penalty time
    }

    // Check if all players have reacted for the current round
    const allReacted = room.players.every(p => {
        const pData = p.gameData as { reactions: number[] };
        return pData.reactions.length > gd.currentRound;
    });

    let broadcast: Record<string, any> = { event: "player_reacted", playerId, reactionTime: action.reactionTime };

    if (allReacted) {
        gd.currentRound++;
        broadcast.event = "round_complete";
        broadcast.nextRound = gd.currentRound;
        broadcast.gameOver = gd.currentRound >= gd.rounds;
    }

    return {
      room,
      broadcast,
    };
  },

  calculateScores(room) {
    return room.players
      .map((p) => {
        const data = p.gameData as { reactions: number[]; missed: number };
        const avgReaction = data.reactions.length > 0
          ? data.reactions.reduce((a, b) => a + b, 0) / data.reactions.length
          : 9999;
        p.score = Math.round(Math.max(0, 5000 - avgReaction * 5) - data.missed * 500);
        return p;
      })
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty) {
    const data = room.gameData as { currentRound: number; rounds: number };
    if (data.currentRound >= data.rounds) return null;

    const ranges = {
      easy: { min: 400, max: 800, missChance: 0.2 },
      medium: { min: 250, max: 500, missChance: 0.1 },
      hard: { min: 150, max: 300, missChance: 0.05 },
    };
    const cfg = ranges[difficulty];

    if (Math.random() < cfg.missChance) {
      return { type: "miss" };
    }
    return {
      type: "react",
      reactionTime: Math.floor(Math.random() * (cfg.max - cfg.min) + cfg.min),
    };
  },

  validateAction(_room, _playerId, action) {
    const { reactionTime } = action as { reactionTime?: number };
    if (reactionTime !== undefined && reactionTime < 80) {
      return { valid: false, reason: "Impossible reaction time detected" };
    }
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    return {
      ...room.gameData,
      myScore: player?.score || 0,
      scores: room.players.map((p) => ({ id: p.id, username: p.username, score: p.score, isBot: p.isBot })),
    };
  },
};
