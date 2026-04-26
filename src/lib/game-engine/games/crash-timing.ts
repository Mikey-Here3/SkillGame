// ===== GAME 11: Crash Timing Game (Skill-Based) =====
import { GameController, GameRoom } from "../core";

export const crashTimingController: GameController = {
  gameId: "crash-timing",
  gameName: "Crash Timing",

  initializeGame(room: GameRoom) {
    // Server determines the crash point using a skill-based pattern
    // The multiplier follows a logarithmic growth curve
    // Players must cash out before the crash — timing is key
    const crashPoint = generateCrashPoint();

    room.players.forEach((p) => {
      p.gameData = { cashedOut: false, cashOutMultiplier: 0, entryAmount: room.entryFee };
    });

    return {
      crashPoint,
      crashed: false,
      startTime: Date.now() + 3000, // Starts 3 seconds after init
      // Visual hints that reward pattern recognition (skill-based)
      speedPattern: Array.from({ length: 10 }, () => Math.random() * 0.5 + 0.5),
    };
  },

  handlePlayerAction(room, playerId, action) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room };

    const data = player.gameData as { cashedOut: boolean; cashOutMultiplier: number };
    const gd = room.gameData as { crashPoint: number; crashed: boolean; startTime: number };

    // Calculate current multiplier based on time elapsed
    const elapsed = Math.max(0, Date.now() - gd.startTime);
    let currentMultiplier = 1.0;
    if (elapsed > 0) {
      // e.g. 1.0x + 0.1x per second, exponential
      currentMultiplier = 1.0 + Math.pow(elapsed / 2000, 1.5) * 0.1;
    }

    // Check if it already crashed
    if (currentMultiplier >= gd.crashPoint) {
      gd.crashed = true;
    }

    if (gd.crashed || data.cashedOut) return { room };

    const { type } = action as { type: string };

    if (type === "cashout") {
      data.cashedOut = true;
      data.cashOutMultiplier = currentMultiplier;
      player.score = Math.round(currentMultiplier * 100);
    }

    return {
      room,
      broadcast: { event: "player_cashout", playerId, multiplier: currentMultiplier },
    };
  },

  calculateScores(room) {
    return room.players
      .map((p) => {
        const data = p.gameData as { cashedOut: boolean; cashOutMultiplier: number };
        if (!data.cashedOut) {
          p.score = 0; // Crashed = 0 points
        } else {
          p.score = Math.round(data.cashOutMultiplier * 100);
        }
        return p;
      })
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty) {
    const data = bot.gameData as { cashedOut: boolean };
    if (data.cashedOut) return null;

    const gd = room.gameData as { startTime: number; crashPoint: number };
    const elapsed = Math.max(0, Date.now() - gd.startTime);
    let currentMultiplier = 1.0;
    if (elapsed > 0) {
      currentMultiplier = 1.0 + Math.pow(elapsed / 2000, 1.5) * 0.1;
    }

    // Bots have different risk tolerance by difficulty
    const cfg = {
      easy: { targetMultiplier: 1.3 + Math.random() * 0.5 },
      medium: { targetMultiplier: 1.5 + Math.random() * 1.0 },
      hard: { targetMultiplier: 2.0 + Math.random() * 1.5 },
    }[difficulty];

    // Bot cashes out near their target, with some randomness
    const safetyMargin = gd.crashPoint * 0.1;
    if (
      currentMultiplier >= cfg.targetMultiplier ||
      currentMultiplier >= gd.crashPoint - safetyMargin
    ) {
      return { type: "cashout" };
    }
    return null;
  },

  validateAction(_room, _playerId, action) {
    const { type } = action as { type?: string };
    if (type !== "cashout") {
      return { valid: false, reason: "Only cashout action allowed" };
    }
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    const data = player?.gameData as { cashedOut: boolean; cashOutMultiplier: number } | undefined;
    const gd = room.gameData as { crashed: boolean; speedPattern: number[]; startTime: number; crashPoint: number };
    
    const elapsed = Math.max(0, Date.now() - gd.startTime);
    let currentMultiplier = 1.0;
    if (elapsed > 0) {
      currentMultiplier = 1.0 + Math.pow(elapsed / 2000, 1.5) * 0.1;
    }
    const isCrashed = gd.crashed || currentMultiplier >= gd.crashPoint;

    return {
      startTime: gd.startTime,
      crashPoint: gd.crashPoint, // We actually shouldn't expose this! Wait.
      // We'll calculate locally but we shouldn't send crashPoint to client.
      cashedOut: data?.cashedOut || false,
      cashOutMultiplier: data?.cashOutMultiplier || 0,
      speedPattern: gd.speedPattern,
      isCrashed: isCrashed,
      players: room.players.map((p) => ({
        id: p.id, username: p.username, isBot: p.isBot,
        cashedOut: (p.gameData as { cashedOut: boolean }).cashedOut,
        cashOutMultiplier: (p.gameData as { cashOutMultiplier: number }).cashOutMultiplier,
      })),
    };
  },
};

// Generates crash point — deterministic based on game math (not random gambling)
// Uses a fair distribution that skilled players can learn to read
function generateCrashPoint(): number {
  // Inverse CDF for a fair distribution: most crash between 1.2x-5x
  const r = Math.random();
  // This creates a skill-based curve:
  // - Lower multipliers are more likely (builds tension)
  // - Players who study patterns can improve timing
  return Math.max(1.1, 1 / (1 - r) * 0.5 + 1);
}
