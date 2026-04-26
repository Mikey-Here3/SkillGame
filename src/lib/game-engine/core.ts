// ========================================
// GAME ENGINE CORE — Modular Game System
// ========================================

export interface GamePlayer {
  id: string;
  username: string;
  isBot: boolean;
  botDifficulty?: "easy" | "medium" | "hard";
  score: number;
  rank: number;
  earnings: number;
  connected: boolean;
  gameData: Record<string, unknown>;
}

export interface GameRoom {
  roomCode: string;
  gameId: string;
  sessionId?: string;
  players: GamePlayer[];
  maxPlayers: number;
  minPlayers: number;
  entryFee: number;
  prizePool: number;
  commission: number;
  commissionPercent: number;
  rewardDistribution: { top1: number; top2: number; top3: number };
  status: "waiting" | "countdown" | "active" | "completed" | "cancelled";
  isPractice: boolean;
  gameDuration: number;
  gameData: Record<string, unknown>;
  startedAt: number | null;
  createdAt: number;
  countdownTimer?: ReturnType<typeof setTimeout>;
  gameTimer?: ReturnType<typeof setTimeout>;
}

export interface GameController {
  gameId: string;
  gameName: string;
  initializeGame(room: GameRoom): Record<string, unknown>;
  handlePlayerAction(
    room: GameRoom,
    playerId: string,
    action: Record<string, unknown>
  ): { room: GameRoom; broadcast?: Record<string, unknown>; playerUpdate?: { playerId: string; data: Record<string, unknown> } };
  calculateScores(room: GameRoom): GamePlayer[];
  getBotAction(
    room: GameRoom,
    bot: GamePlayer,
    difficulty: "easy" | "medium" | "hard"
  ): Record<string, unknown> | null;
  validateAction(
    room: GameRoom,
    playerId: string,
    action: Record<string, unknown>
  ): { valid: boolean; reason?: string };
  getGameState(room: GameRoom, playerId: string): Record<string, unknown>;
}

// ===== ROOM MANAGEMENT =====
const activeRooms = new Map<string, GameRoom>();
const gameControllers = new Map<string, GameController>();

export function registerGameController(controller: GameController) {
  gameControllers.set(controller.gameId, controller);
}

export function getGameController(gameId: string): GameController | undefined {
  return gameControllers.get(gameId);
}

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createRoom(
  gameId: string,
  config: {
    maxPlayers: number;
    minPlayers: number;
    entryFee: number;
    commissionPercent: number;
    rewardDistribution: { top1: number; top2: number; top3: number };
    gameDuration: number;
    isPractice: boolean;
  }
): GameRoom {
  const roomCode = generateRoomCode();
  const room: GameRoom = {
    roomCode,
    gameId,
    players: [],
    maxPlayers: config.maxPlayers,
    minPlayers: config.minPlayers,
    entryFee: config.isPractice ? 0 : config.entryFee,
    prizePool: 0,
    commission: 0,
    commissionPercent: config.commissionPercent,
    rewardDistribution: config.rewardDistribution,
    status: "waiting",
    isPractice: config.isPractice,
    gameDuration: config.gameDuration,
    gameData: {},
    startedAt: null,
    createdAt: Date.now(),
  };

  activeRooms.set(roomCode, room);
  return room;
}

export function getRoom(roomCode: string): GameRoom | undefined {
  return activeRooms.get(roomCode);
}

export function getAllRooms(): GameRoom[] {
  return Array.from(activeRooms.values());
}

export function getWaitingRoom(gameId: string, entryFee: number, isPractice: boolean): GameRoom | undefined {
  return Array.from(activeRooms.values()).find(
    (room) =>
      room.gameId === gameId &&
      room.status === "waiting" &&
      room.entryFee === entryFee &&
      room.isPractice === isPractice &&
      room.players.length < room.maxPlayers
  );
}

export function joinRoom(
  roomCode: string,
  player: Omit<GamePlayer, "score" | "rank" | "earnings" | "connected" | "gameData">
): GameRoom | null {
  const room = activeRooms.get(roomCode);
  if (!room || room.status !== "waiting" || room.players.length >= room.maxPlayers) {
    return null;
  }

  // Check if player already in room
  if (room.players.find((p) => p.id === player.id)) {
    return room;
  }

  room.players.push({
    ...player,
    score: 0,
    rank: 0,
    earnings: 0,
    connected: !player.isBot,
    gameData: {},
  });

  return room;
}

export function removePlayer(roomCode: string, playerId: string): GameRoom | null {
  const room = activeRooms.get(roomCode);
  if (!room) return null;

  room.players = room.players.filter((p) => p.id !== playerId);
  if (room.players.filter((p) => !p.isBot).length === 0) {
    activeRooms.delete(roomCode);
    return null;
  }
  return room;
}

export function startCountdown(roomCode: string): GameRoom | null {
  const room = activeRooms.get(roomCode);
  if (!room || room.status !== "waiting") return null;
  room.status = "countdown";
  return room;
}

export function startGame(roomCode: string): GameRoom | null {
  const room = activeRooms.get(roomCode);
  if (!room) return null;

  const controller = gameControllers.get(room.gameId);
  if (!controller) return null;

  room.status = "active";
  room.startedAt = Date.now();

  // Calculate prize pool
  const humanPlayers = room.players.filter((p) => !p.isBot).length;
  const totalPool = humanPlayers * room.entryFee;
  room.commission = totalPool * (room.commissionPercent / 100);
  room.prizePool = totalPool - room.commission;

  // Initialize game-specific state
  room.gameData = controller.initializeGame(room);

  return room;
}

export function handleAction(
  roomCode: string,
  playerId: string,
  action: Record<string, unknown>
) {
  const room = activeRooms.get(roomCode);
  if (!room || room.status !== "active") return null;

  const controller = gameControllers.get(room.gameId);
  if (!controller) return null;

  // Anti-cheat: validate action
  const validation = controller.validateAction(room, playerId, action);
  if (!validation.valid) {
    return { error: validation.reason };
  }

  return controller.handlePlayerAction(room, playerId, action);
}

export function endGame(roomCode: string): GameRoom | null {
  const room = activeRooms.get(roomCode);
  if (!room) return null;

  const controller = gameControllers.get(room.gameId);
  if (!controller) return null;

  room.status = "completed";

  // Calculate final scores & ranks
  const rankedPlayers = controller.calculateScores(room);
  room.players = rankedPlayers;

  // Distribute prizes (only in non-practice mode)
  if (!room.isPractice && room.prizePool > 0) {
    const dist = room.rewardDistribution;
    const humanPlayers = room.players.filter(p => !p.isBot).length;
    const totalPlayers = room.players.length;

    rankedPlayers.forEach((player) => {
      // 1vs1 Special Rule: Winner takes all
      if (totalPlayers === 2) {
        if (player.rank === 1) player.earnings = room.prizePool;
        else player.earnings = 0;
      } else {
        // Multi-player distribution
        if (player.rank === 1) player.earnings = room.prizePool * (dist.top1 / 100);
        else if (player.rank === 2) player.earnings = room.prizePool * (dist.top2 / 100);
        else if (player.rank === 3) player.earnings = room.prizePool * (dist.top3 / 100);
      }
    });
  }

  return room;
}

export function cleanupRoom(roomCode: string) {
  const room = activeRooms.get(roomCode);
  if (room) {
    if (room.countdownTimer) clearTimeout(room.countdownTimer);
    if (room.gameTimer) clearTimeout(room.gameTimer);
    activeRooms.delete(roomCode);
  }
}

// ===== BOT NAME GENERATOR =====
const botNames = [
  "ProGamer99", "SwiftFox", "NightHawk", "StormBreaker", "CyberWolf",
  "PhantomX", "BlazeMaster", "IronClad", "ShadowKing", "PixelSniper",
  "ThunderBolt", "NovaFlare", "VortexRush", "ZeroGravity", "TurboShift",
  "AlphaStrike", "BetaCrush", "DarkMatter", "EpicSurge", "FrostByte",
  "GhostRider", "HyperDrive", "InfiniteLoop", "JetStream", "KnightOwl",
  "LightYear", "MegaVolt", "NeonPulse", "OmegaWave", "PowerSurge",
];

export function getRandomBotName(): string {
  return botNames[Math.floor(Math.random() * botNames.length)] +
    Math.floor(Math.random() * 999);
}

export function selectBotDifficulty(
  distribution: { easy: number; medium: number; hard: number }
): "easy" | "medium" | "hard" {
  const rand = Math.random() * 100;
  if (rand < distribution.easy) return "easy";
  if (rand < distribution.easy + distribution.medium) return "medium";
  return "hard";
}
