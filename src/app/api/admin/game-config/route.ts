import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET all game configs (public for game list, admin for full data)
export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    const isAdmin = payload?.role === "admin";

    const configs = await prisma.gameConfig.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { gameName: "asc" },
    });

    return NextResponse.json({ configs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch game configs" }, { status: 500 });
  }
}

// POST create new game config (admin only)
export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      gameId, gameName, gameDescription, gameIcon,
      entryFees, commissionPercent, rewardDistribution,
      maxPlayers, minPlayers, gameDuration,
      botsEnabled, maxBots, botDifficulty, practiceEnabled,
    } = body;

    if (!gameId || !gameName) {
      return NextResponse.json({ error: "gameId and gameName are required" }, { status: 400 });
    }

    // Validate commission
    const commission = commissionPercent || 10;
    if (commission < 5 || commission > 20) {
      return NextResponse.json({ error: "Commission must be between 5% and 20%" }, { status: 400 });
    }

    // Validate reward distribution
    const rewards = rewardDistribution || { top1: 50, top2: 30, top3: 20 };
    const total = (rewards.top1 || 0) + (rewards.top2 || 0) + (rewards.top3 || 0);
    if (total !== 100) {
      return NextResponse.json({ error: "Reward percentages must total 100%" }, { status: 400 });
    }

    // Validate entry fees
    const fees = entryFees || [10, 20, 50, 100, 500];
    if (!Array.isArray(fees) || fees.some((f: number) => f <= 0)) {
      return NextResponse.json({ error: "Entry fees must be positive numbers" }, { status: 400 });
    }

    const existing = await prisma.gameConfig.findUnique({ where: { gameId } });
    if (existing) {
      return NextResponse.json({ error: "Game config with this gameId already exists" }, { status: 409 });
    }

    const config = await prisma.gameConfig.create({
      data: {
        gameId,
        gameName,
        gameDescription: gameDescription || "",
        gameIcon: gameIcon || "gamepad",
        entryFees: fees,
        commissionPercent: commission,
        rewardDistribution: rewards,
        maxPlayers: maxPlayers || 4,
        minPlayers: minPlayers || 2,
        gameDuration: gameDuration || 60,
        botsEnabled: botsEnabled !== false,
        maxBots: maxBots || 2,
        botDifficulty: botDifficulty || { easy: 40, medium: 40, hard: 20 },
        practiceEnabled: practiceEnabled !== false,
      },
    });

    return NextResponse.json({ message: "Game config created", config }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create game config error:", error);
    return NextResponse.json({ error: "Failed to create game config" }, { status: 500 });
  }
}
