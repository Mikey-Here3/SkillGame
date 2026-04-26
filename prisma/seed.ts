// ===== Database Seed: GameConfig for all 11 games =====
// Run with: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts
// Or: npx prisma db seed

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const gameConfigs = [
  {
    gameId: "reaction-speed",
    gameName: "Reaction Speed Battle",
    gameDescription: "Test your reflexes! React faster than your opponents across 5 rounds.",
    gameIcon: "⚡",
    entryFees: [10, 20, 50, 100, 500],
    commissionPercent: 10,
    rewardDistribution: { top1: 50, top2: 30, top3: 20 },
    maxPlayers: 4,
    minPlayers: 2,
    gameDuration: 30,
    botsEnabled: true,
    maxBots: 2,
    botDifficulty: { easy: 40, medium: 40, hard: 20 },
    practiceEnabled: true,
  },
  {
    gameId: "fruit-slice",
    gameName: "Fruit Slice",
    gameDescription: "Slice fruits, dodge bombs, and build combos in this fast-paced canvas game!",
    gameIcon: "🍉",
    entryFees: [10, 20, 50, 100],
    commissionPercent: 10,
    rewardDistribution: { top1: 50, top2: 30, top3: 20 },
    maxPlayers: 4,
    minPlayers: 2,
    gameDuration: 45,
    botsEnabled: true,
    maxBots: 2,
    botDifficulty: { easy: 30, medium: 45, hard: 25 },
    practiceEnabled: true,
  },
  {
    gameId: "word-search",
    gameName: "Word Search Puzzle",
    gameDescription: "Find hidden words faster than anyone else in the grid.",
    gameIcon: "🔤",
    entryFees: [10, 20, 50, 100],
    commissionPercent: 10,
    rewardDistribution: { top1: 50, top2: 30, top3: 20 },
    maxPlayers: 4,
    minPlayers: 2,
    gameDuration: 60,
    botsEnabled: true,
    maxBots: 2,
    botDifficulty: { easy: 40, medium: 40, hard: 20 },
    practiceEnabled: true,
  },
  {
    gameId: "memory-match",
    gameName: "Memory Match",
    gameDescription: "Flip cards and match emoji pairs from memory. Fewer attempts = higher score!",
    gameIcon: "🧠",
    entryFees: [10, 20, 50, 100],
    commissionPercent: 10,
    rewardDistribution: { top1: 50, top2: 30, top3: 20 },
    maxPlayers: 4,
    minPlayers: 2,
    gameDuration: 60,
    botsEnabled: true,
    maxBots: 2,
    botDifficulty: { easy: 50, medium: 35, hard: 15 },
    practiceEnabled: true,
  },
  {
    gameId: "math-speed",
    gameName: "Math Speed Challenge",
    gameDescription: "Solve 20 math problems with increasing difficulty. Streaks give bonus points!",
    gameIcon: "🔢",
    entryFees: [10, 20, 50, 100, 500],
    commissionPercent: 10,
    rewardDistribution: { top1: 50, top2: 30, top3: 20 },
    maxPlayers: 4,
    minPlayers: 2,
    gameDuration: 60,
    botsEnabled: true,
    maxBots: 2,
    botDifficulty: { easy: 40, medium: 40, hard: 20 },
    practiceEnabled: true,
  },
  {
    gameId: "typing-speed",
    gameName: "Typing Speed Battle",
    gameDescription: "Race to type a sentence fastest with the highest accuracy. WPM * accuracy = score!",
    gameIcon: "⌨️",
    entryFees: [10, 20, 50, 100],
    commissionPercent: 10,
    rewardDistribution: { top1: 50, top2: 30, top3: 20 },
    maxPlayers: 4,
    minPlayers: 2,
    gameDuration: 45,
    botsEnabled: true,
    maxBots: 2,
    botDifficulty: { easy: 35, medium: 45, hard: 20 },
    practiceEnabled: true,
  },
  {
    gameId: "target-hit",
    gameName: "Target Hit",
    gameDescription: "Click targets as they appear! Smaller targets = bigger points. Miss = penalty!",
    gameIcon: "🎯",
    entryFees: [10, 20, 50, 100],
    commissionPercent: 10,
    rewardDistribution: { top1: 50, top2: 30, top3: 20 },
    maxPlayers: 4,
    minPlayers: 2,
    gameDuration: 45,
    botsEnabled: true,
    maxBots: 2,
    botDifficulty: { easy: 40, medium: 40, hard: 20 },
    practiceEnabled: true,
  },
  {
    gameId: "sequence-memory",
    gameName: "Sequence Memory",
    gameDescription: "Remember and repeat number sequences that get longer each round. 3 lives!",
    gameIcon: "🔗",
    entryFees: [10, 20, 50, 100],
    commissionPercent: 10,
    rewardDistribution: { top1: 50, top2: 30, top3: 20 },
    maxPlayers: 4,
    minPlayers: 2,
    gameDuration: 90,
    botsEnabled: true,
    maxBots: 2,
    botDifficulty: { easy: 40, medium: 40, hard: 20 },
    practiceEnabled: true,
  },
  {
    gameId: "tic-tac-toe",
    gameName: "Tic Tac Toe",
    gameDescription: "Classic strategy game. Outsmart your opponent in a battle of X's and O's!",
    gameIcon: "❌",
    entryFees: [10, 20, 50, 100],
    commissionPercent: 10,
    rewardDistribution: { top1: 60, top2: 40, top3: 0 },
    maxPlayers: 2,
    minPlayers: 2,
    gameDuration: 120,
    botsEnabled: true,
    maxBots: 1,
    botDifficulty: { easy: 30, medium: 40, hard: 30 },
    practiceEnabled: true,
  },
  {
    gameId: "chess-blitz",
    gameName: "Chess Blitz",
    gameDescription: "3-minute chess. Think fast, play faster. Full chess rules apply!",
    gameIcon: "♟️",
    entryFees: [20, 50, 100, 500],
    commissionPercent: 10,
    rewardDistribution: { top1: 60, top2: 40, top3: 0 },
    maxPlayers: 2,
    minPlayers: 2,
    gameDuration: 180,
    botsEnabled: false,
    maxBots: 0,
    botDifficulty: { easy: 0, medium: 50, hard: 50 },
    practiceEnabled: true,
  },
  {
    gameId: "crash-timing",
    gameName: "Crash Timing",
    gameDescription: "Watch the multiplier rise and cash out before it crashes. Skill-based timing!",
    gameIcon: "📈",
    entryFees: [10, 20, 50, 100, 500],
    commissionPercent: 15,
    rewardDistribution: { top1: 40, top2: 35, top3: 25 },
    maxPlayers: 10,
    minPlayers: 2,
    gameDuration: 30,
    botsEnabled: true,
    maxBots: 5,
    botDifficulty: { easy: 30, medium: 40, hard: 30 },
    practiceEnabled: true,
  },
];

async function main() {
  console.log("🌱 Seeding SkillArena database...\n");

  // Seed game configs
  for (const config of gameConfigs) {
    const existing = await prisma.gameConfig.findUnique({
      where: { gameId: config.gameId },
    });

    if (existing) {
      await prisma.gameConfig.update({
        where: { gameId: config.gameId },
        data: config,
      });
      console.log(`  ✅ Updated: ${config.gameName}`);
    } else {
      await prisma.gameConfig.create({ data: config });
      console.log(`  ✅ Created: ${config.gameName}`);
    }
  }

  // Create admin user if not exists
  const adminEmail = "admin@skillarena.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: {
        username: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        referralCode: "ADMIN000",
        balance: 10000,
        coins: 99999,
      },
    });
    console.log("\n  👤 Admin user created: admin@skillarena.com / admin123");
  } else {
    console.log("\n  👤 Admin user already exists");
  }

  // Create sample quests
  const quests = [
    { title: "Play 3 Games", description: "Play any 3 games today", type: "daily", action: "games_played", target: 3, rewardCoins: 50 },
    { title: "Win 1 Game", description: "Win any game today", type: "daily", action: "games_won", target: 1, rewardCoins: 100 },
    { title: "Play 10 Games", description: "Play 10 games this week", type: "weekly", action: "games_played", target: 10, rewardCoins: 300 },
    { title: "Win 5 Games", description: "Win 5 games this week", type: "weekly", action: "games_won", target: 5, rewardCoins: 500 },
    { title: "Refer a Friend", description: "Invite a friend to join", type: "hard", action: "referrals", target: 1, rewardCoins: 200, rewardCash: 5 },
  ];

  for (const quest of quests) {
    const existing = await prisma.quest.findFirst({
      where: { title: quest.title, type: quest.type },
    });
    if (!existing) {
      await prisma.quest.create({ data: quest });
      console.log(`  🎯 Quest created: ${quest.title}`);
    }
  }

  console.log("\n✨ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
