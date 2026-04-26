import { Server as SocketIOServer, Socket } from "socket.io";
import prisma from "../db";
import {
  createRoom,
  getRoom,
  joinRoom,
  removePlayer,
  startCountdown,
  startGame,
  handleAction,
  endGame,
  cleanupRoom,
  getWaitingRoom,
  getGameController,
  getRandomBotName,
  selectBotDifficulty,
  GameRoom,
} from "./index";

let io: SocketIOServer | null = null;

// ===== CONFIG CACHE (60s TTL) =====
const configCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60_000; // 60 seconds

async function getGameConfig(gameId: string) {
  const cached = configCache.get(gameId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const config = await prisma.gameConfig.findUnique({
    where: { gameId },
  });

  if (config) {
    configCache.set(gameId, { data: config, timestamp: Date.now() });
  }

  return config;
}

// Invalidate cache when admin updates config
export function invalidateConfigCache(gameId?: string) {
  if (gameId) {
    configCache.delete(gameId);
  } else {
    configCache.clear();
  }
}

export function initializeSocketServer(socketServer: SocketIOServer) {
  io = socketServer;

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // === JOIN MATCHMAKING ===
    socket.on("join_matchmaking", async (data: {
      gameId: string;
      entryFee: number;
      userId: string;
      username: string;
      isPractice: boolean;
    }) => {
      try {
        // SECURITY: Fetch config from DB server-side (never trust client)
        const config = await getGameConfig(data.gameId);
        if (!config) {
          socket.emit("matchmaking_error", { error: "Game not found or disabled" });
          return;
        }

        if (!config.isActive) {
          socket.emit("matchmaking_error", { error: "This game is currently disabled" });
          return;
        }

        // Validate entry fee is in allowed fees
        const entryFees = config.entryFees as number[];
        if (!data.isPractice && !entryFees.includes(data.entryFee)) {
          socket.emit("matchmaking_error", { error: "Invalid entry fee" });
          return;
        }

        const rewardDistribution = config.rewardDistribution as { top1: number; top2: number; top3: number };
        const botDifficulty = config.botDifficulty as { easy: number; medium: number; hard: number };

        let room = getWaitingRoom(data.gameId, data.isPractice ? 0 : data.entryFee, data.isPractice);

        // Fetch User Stats for DB Sync & Smart Matchmaking
        let userDb = null;
        if (!data.isPractice) {
          userDb = await prisma.user.findUnique({
            where: { id: data.userId },
            include: { transactions: { where: { type: "deposit", status: "completed" } } },
          });

          if (!userDb || userDb.balance < data.entryFee) {
            socket.emit("matchmaking_error", { error: "Insufficient balance" });
            return;
          }

          // SECURITY: Check for any 'waiting' session in DB for this user & game to avoid double charging
          const existingSession = await prisma.gameSession.findFirst({
            where: {
              status: "waiting",
              gameConfig: { gameId: data.gameId },
              players: { some: { playerId: data.userId } }
            }
          });

          if (existingSession || (room && room.players.find(p => p.id === data.userId))) {
            console.log(`[Socket] Player ${data.username} already has a waiting session, skipping fee deduction.`);
          } else {
            // Deduct Fee and Log Transaction
            await prisma.$transaction([
              prisma.user.update({
                where: { id: data.userId },
                data: { balance: { decrement: data.entryFee } },
              }),
              prisma.transaction.create({
                data: {
                  userId: data.userId,
                  type: "game_fee",
                  amount: -data.entryFee,
                  status: "completed",
                  description: `Entry fee for ${data.gameId}`,
                },
              }),
            ]);
            console.log(`[Socket] Deducted Rs. ${data.entryFee} from ${data.username} for ${data.gameId}`);
          }
        }

        if (!room) {
          room = createRoom(data.gameId, {
            maxPlayers: config.maxPlayers,
            minPlayers: config.minPlayers,
            entryFee: data.entryFee,
            commissionPercent: config.commissionPercent,
            rewardDistribution,
            gameDuration: config.gameDuration,
            isPractice: data.isPractice,
          });
        }

        // Join room
        const updated = joinRoom(room.roomCode, {
          id: data.userId,
          username: data.username,
          isBot: false,
        });

        if (!updated) {
          socket.emit("matchmaking_error", { error: "Could not join room" });
          return;
        }

        socket.join(room.roomCode);
        (socket as Socket & { roomCode?: string; userId?: string }).roomCode = room.roomCode;
        (socket as Socket & { userId?: string }).userId = data.userId;

        io!.to(room.roomCode).emit("room_update", sanitizeRoom(updated));

        // Check if we should fill with bots and start
        if (config.botsEnabled && updated.players.length >= config.minPlayers) {
          // Fetch Global Bot Config
          const botConfig = await prisma.botSettings.findUnique({ where: { id: "global" } });
          const isGlobalBotsEnabled = botConfig ? botConfig.botsEnabled : true;

          if (isGlobalBotsEnabled) {
            const botsToAdd = Math.min(
              config.maxBots,
              updated.maxPlayers - updated.players.length
            );

            // SMART BOT ENGINE: Determine difficulty based on user stats
            let targetDifficulty: "easy" | "medium" | "hard" = "medium";
            
            if (userDb) {
              const totalDeposits = userDb.transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
              const winRate = userDb.winRate || 0;

              // Rule 1: High Rollers get harder bots
              if (totalDeposits > 10000) targetDifficulty = "hard";
              // Rule 2: Low deposits get easier bots
              else if (totalDeposits >= 500 && totalDeposits <= 1000) targetDifficulty = "easy";
              // Rule 3: Win Rate overrides
              if (winRate > 60) targetDifficulty = "hard"; // Winning streak -> harder
              if (winRate < 40) targetDifficulty = "easy"; // Losing streak -> easier
            }

            for (let i = 0; i < botsToAdd; i++) {
              joinRoom(room.roomCode, {
                id: `bot_${Date.now()}_${i}`,
                username: getRandomBotName(),
                isBot: true,
                botDifficulty: targetDifficulty, // Smart assigned
              });
            }

            // Start countdown
            startCountdownSequence(room.roomCode);
          }
        } else if (updated.players.length >= updated.maxPlayers) {
          startCountdownSequence(room.roomCode);
        }

        // Auto-start with bots after 5 seconds total
        if (!config.botsEnabled || updated.players.length < config.minPlayers) {
          const waitTime = 5000; // 5 seconds as requested
          console.log(`[Socket] Matchmaking timeout set to ${waitTime}ms for room ${room!.roomCode}`);
          
          setTimeout(async () => {
            const currentRoom = getRoom(room!.roomCode);
            if (currentRoom && currentRoom.status === "waiting") {
              const botConfig = await prisma.botSettings.findUnique({ where: { id: "global" } });
              const isGlobalBotsEnabled = botConfig ? botConfig.botsEnabled : true;

              if (config.botsEnabled && isGlobalBotsEnabled) {
                console.log(`[Socket] No real player found after 5s, adding bots to ${room!.roomCode}`);
                const needed = config.minPlayers - currentRoom.players.length;
                for (let i = 0; i < Math.max(needed, 1); i++) {
                  joinRoom(room!.roomCode, {
                    id: `bot_${Date.now()}_${i}`,
                    username: getRandomBotName(),
                    isBot: true,
                    botDifficulty: "medium",
                  });
                }
              }
              startCountdownSequence(room!.roomCode);
            }
          }, waitTime);
        }
      } catch (err) {
        console.error("[Socket] Join error:", err);
        socket.emit("matchmaking_error", { error: "Failed to join" });
      }
    });

    // === PLAYER ACTION ===
    socket.on("game_action", (data: { roomCode: string; action: Record<string, unknown> }) => {
      const userId = (socket as Socket & { userId?: string }).userId;
      if (!userId) return;

      const result = handleAction(data.roomCode, userId, data.action);
      if (!result) return;

      if ("error" in result) {
        socket.emit("action_error", { error: result.error });
        return;
      }

      if (result.broadcast) {
        io!.to(data.roomCode).emit("game_update", result.broadcast);
        
        // CHECK FOR EARLY GAME END (e.g. Checkmate, Win state reached)
        const room = getRoom(data.roomCode);
        if (room && room.gameData && (room.gameData.gameOver === true || (result.broadcast as any).gameOver === true)) {
          console.log(`[Socket] Early game end detected for room ${data.roomCode}`);
          if (room.gameTimer) clearTimeout(room.gameTimer);
          endGameSequence(data.roomCode);
        }
      }
      if (result.playerUpdate) {
        io!.to(data.roomCode).emit("player_update", result.playerUpdate);
      }

      // Send updated scores
      const room = getRoom(data.roomCode);
      if (room) {
        io!.to(data.roomCode).emit("scores_update", {
          scores: room.players.map((p) => ({
            id: p.id, username: p.username, score: p.score, isBot: p.isBot,
          })),
        });
      }
    });

    // === LEAVE ROOM ===
    socket.on("leave_room", () => {
      const roomCode = (socket as Socket & { roomCode?: string }).roomCode;
      const userId = (socket as Socket & { userId?: string }).userId;
      if (roomCode && userId) {
        removePlayer(roomCode, userId);
        socket.leave(roomCode);
        const room = getRoom(roomCode);
        if (room) {
          io!.to(roomCode).emit("room_update", sanitizeRoom(room));
        }
      }
    });

    // === DISCONNECT ===
    socket.on("disconnect", () => {
      const roomCode = (socket as Socket & { roomCode?: string }).roomCode;
      const userId = (socket as Socket & { userId?: string }).userId;
      if (roomCode && userId) {
        const room = getRoom(roomCode);
        if (room) {
          const player = room.players.find((p) => p.id === userId);
          if (player) player.connected = false;
          io!.to(roomCode).emit("player_disconnected", { playerId: userId });
        }
      }
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

// === COUNTDOWN & START SEQUENCE ===
function startCountdownSequence(roomCode: string) {
  const room = startCountdown(roomCode);
  if (!room || !io) return;

  io.to(roomCode).emit("room_update", sanitizeRoom(room));
  io.to(roomCode).emit("countdown", { seconds: 3 });

  let count = 3;
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      io!.to(roomCode).emit("countdown", { seconds: count });
    } else {
      clearInterval(interval);
      startGameSequence(roomCode);
    }
  }, 1000);

  room.countdownTimer = interval as unknown as ReturnType<typeof setTimeout>;
}

async function startGameSequence(roomCode: string) {
  const room = startGame(roomCode);
  if (!room || !io) return;

  const controller = getGameController(room.gameId);
  if (!controller) return;

  // Fetch bot settings for dynamic handicapping
  const botConfig = await prisma.botSettings.findUnique({ where: { id: "global" } });
  if (botConfig) {
    room.gameData.botConfig = botConfig;
  }

  // === DB PERSISTENCE: Create GameSession ===
  try {
    const gameConfig = await getGameConfig(room.gameId);
    if (gameConfig) {
      const session = await prisma.gameSession.create({
        data: {
          gameConfigId: gameConfig.id,
          roomCode: room.roomCode,
          entryFee: room.entryFee,
          prizePool: room.prizePool,
          commission: room.commission,
          status: "active",
          isPractice: room.isPractice,
          maxPlayers: room.maxPlayers,
          gameData: {},
          startedAt: new Date(),
        },
      });
      room.sessionId = session.id;
      console.log(`[Socket] GameSession created: ${session.id} for room ${roomCode}`);
    }
  } catch (err) {
    console.error("[Socket] Failed to create GameSession:", err);
  }

  // Emit game_start to each player individually to provide player-specific state (like color or perspective)
  room.players.forEach((p) => {
    if (!p.isBot) {
      // Find the socket for this user
      const playerSocketId = Array.from(io!.sockets.adapter.rooms.get(roomCode) || []).find(sid => {
        const s = io!.sockets.sockets.get(sid);
        return (s as any)?.userId === p.id;
      });

      if (playerSocketId) {
        io!.to(playerSocketId).emit("game_start", {
          room: sanitizeRoom(room),
          gameState: controller.getGameState ? controller.getGameState(room, p.id) : room.gameData,
        });
      }
    }
  });

  // Start bot actions loop
  startBotLoop(room);

  // Game timer
  room.gameTimer = setTimeout(() => {
    endGameSequence(roomCode);
  }, room.gameDuration * 1000);
}

function startBotLoop(room: GameRoom) {
  const controller = getGameController(room.gameId);
  if (!controller) return;

  const bots = room.players.filter((p) => p.isBot);
  if (bots.length === 0) return;

  const botInterval = setInterval(() => {
    if (room.status !== "active") {
      clearInterval(botInterval);
      return;
    }

    for (const bot of bots) {
      // Dynamic Handicapping Logic
      const botConfig = room.gameData.botConfig as any;
      let actionChance = 100; // default 100% chance to act

      if (botConfig) {
        if (bot.botDifficulty === "easy") actionChance = botConfig.easyWinRate;
        else if (bot.botDifficulty === "medium") actionChance = botConfig.mediumWinRate;
        else if (bot.botDifficulty === "hard") actionChance = botConfig.hardWinRate;
      }

      // If random roll fails, the bot skips this turn (blunder/miss)
      const roll = Math.random() * 100;
      if (roll > actionChance) {
        continue; // skip this bot's turn to enforce the strict win rate
      }

      const action = controller.getBotAction(
        room,
        bot,
        (bot.botDifficulty || "medium") as "easy" | "medium" | "hard"
      );

      if (action) {
        // Simulate human delay
        const delay = Math.floor(Math.random() * 1500) + 500;
        setTimeout(() => {
          if (room.status !== "active") return;
          const result = controller.handlePlayerAction(room, bot.id, action);
          if (result.broadcast && io) {
            io.to(room.roomCode).emit("game_update", result.broadcast);
            
            // CHECK FOR EARLY GAME END FROM BOT MOVE
            if (room.gameData && (room.gameData.gameOver === true || (result.broadcast as any).gameOver === true)) {
              console.log(`[Socket] Bot triggered early game end for room ${room.roomCode}`);
              if (room.gameTimer) clearTimeout(room.gameTimer);
              endGameSequence(room.roomCode);
            }
          }
          if (io) {
            io.to(room.roomCode).emit("scores_update", {
              scores: room.players.map((p) => ({
                id: p.id, username: p.username, score: p.score, isBot: p.isBot,
              })),
            });
          }
        }, delay);
      }
    }
  }, 2000); // Bot acts every 2 seconds
}

async function endGameSequence(roomCode: string) {
  const room = endGame(roomCode);
  if (!room || !io) return;

  io.to(roomCode).emit("game_end", {
    players: room.players.map((p) => ({
      id: p.id,
      username: p.username,
      score: p.score,
      rank: p.rank,
      earnings: p.earnings,
      isBot: p.isBot,
    })),
    prizePool: room.prizePool,
    commission: room.commission,
  });

  // DB Sync: Reward payouts, stats, session, and commission recording
  if (!room.isPractice) {
    try {
      const dbTransactions = [];
      
      for (const p of room.players) {
        if (p.isBot) continue;

        // Base updates
        const updateData: any = {
          gamesPlayed: { increment: 1 },
        };

        if (p.rank === 1) {
          updateData.gamesWon = { increment: 1 };
        }

        // Earnings
        if (p.earnings > 0) {
          updateData.balance = { increment: p.earnings };
          
          dbTransactions.push(
            prisma.transaction.create({
              data: {
                userId: p.id,
                type: "game_reward",
                amount: p.earnings,
                status: "completed",
                description: `Winnings for ${room.gameId} (Rank ${p.rank})`,
                metadata: {
                  gameId: room.gameId,
                  sessionId: room.sessionId || null,
                  roomCode: room.roomCode,
                  rank: p.rank,
                  score: p.score,
                },
              },
            })
          );
        }

        // Apply User update
        dbTransactions.push(
          prisma.user.update({
            where: { id: p.id },
            data: updateData,
          })
        );
      }

      // === PLATFORM COMMISSION RECORDING ===
      if (room.commission > 0) {
        // Find the admin user to attach the commission transaction
        const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
        if (adminUser) {
          dbTransactions.push(
            prisma.transaction.create({
              data: {
                userId: adminUser.id,
                type: "platform_commission",
                amount: room.commission,
                status: "completed",
                description: `Commission from ${room.gameId} game (${room.commissionPercent}%)`,
                metadata: {
                  gameId: room.gameId,
                  sessionId: room.sessionId || null,
                  roomCode: room.roomCode,
                  totalPool: room.prizePool + room.commission,
                  commissionPercent: room.commissionPercent,
                  playerCount: room.players.filter((p) => !p.isBot).length,
                },
              },
            })
          );
        }
      }

      // Execute all wallet updates atomically
      if (dbTransactions.length > 0) {
        await prisma.$transaction(dbTransactions);
      }

      // Re-calculate Win Rates
      for (const p of room.players) {
        if (!p.isBot) {
          const user = await prisma.user.findUnique({ where: { id: p.id }, select: { gamesPlayed: true, gamesWon: true } });
          if (user && user.gamesPlayed > 0) {
            const newWinRate = (user.gamesWon / user.gamesPlayed) * 100;
            await prisma.user.update({
              where: { id: p.id },
              data: { winRate: newWinRate },
            });
          }
        }
      }

      // === UPDATE GAME SESSION IN DB ===
      if (room.sessionId) {
        await prisma.gameSession.update({
          where: { id: room.sessionId },
          data: {
            status: "completed",
            prizePool: room.prizePool,
            commission: room.commission,
            endedAt: new Date(),
            gameData: {
              finalScores: room.players.map((p) => ({
                id: p.id,
                username: p.username,
                score: p.score,
                rank: p.rank,
                earnings: p.earnings,
                isBot: p.isBot,
              })),
            },
          },
        });

        // Save GamePlayer records
        const playerRecords = room.players.map((p) => ({
          sessionId: room.sessionId!,
          playerId: p.isBot ? null : p.id,
          isBot: p.isBot,
          botDifficulty: p.botDifficulty || null,
          username: p.username,
          score: p.score,
          rank: p.rank,
          earnings: p.earnings,
          gameData: p.gameData || {},
        }));

        await prisma.gamePlayer.createMany({ data: playerRecords });
      }

      console.log(`[Socket] Saved game ${roomCode} to DB successfully.`);
    } catch (err) {
      console.error(`[Socket] Error saving game ${roomCode} to DB:`, err);
    }
  }

  // Cleanup after 30 seconds
  setTimeout(() => {
    cleanupRoom(roomCode);
  }, 30000);
}

function sanitizeRoom(room: GameRoom) {
  return {
    roomCode: room.roomCode,
    gameId: room.gameId,
    players: room.players.map((p) => ({
      id: p.id,
      username: p.username,
      isBot: p.isBot,
      score: p.score,
      connected: p.connected,
    })),
    maxPlayers: room.maxPlayers,
    entryFee: room.entryFee,
    prizePool: room.prizePool,
    status: room.status,
    isPractice: room.isPractice,
    gameDuration: room.gameDuration,
  };
}

export { io };
