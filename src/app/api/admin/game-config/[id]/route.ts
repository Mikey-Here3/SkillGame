import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { invalidateConfigCache } from "@/lib/game-engine/socket-server";

// PUT update game config (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.gameConfig.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Game config not found" }, { status: 404 });
    }

    // Validate commission if provided
    if (body.commissionPercent !== undefined) {
      if (body.commissionPercent < 5 || body.commissionPercent > 20) {
        return NextResponse.json({ error: "Commission must be between 5% and 20%" }, { status: 400 });
      }
    }

    // Validate reward distribution if provided
    if (body.rewardDistribution) {
      const r = body.rewardDistribution;
      const total = (r.top1 || 0) + (r.top2 || 0) + (r.top3 || 0);
      if (total !== 100) {
        return NextResponse.json({ error: "Reward percentages must total 100%" }, { status: 400 });
      }
    }

    // Validate entry fees if provided
    if (body.entryFees) {
      if (!Array.isArray(body.entryFees) || body.entryFees.some((f: number) => f <= 0)) {
        return NextResponse.json({ error: "Entry fees must be positive numbers" }, { status: 400 });
      }
    }

    const config = await prisma.gameConfig.update({
      where: { id },
      data: {
        ...(body.gameName && { gameName: body.gameName }),
        ...(body.gameDescription !== undefined && { gameDescription: body.gameDescription }),
        ...(body.gameIcon && { gameIcon: body.gameIcon }),
        ...(body.entryFees && { entryFees: body.entryFees }),
        ...(body.commissionPercent !== undefined && { commissionPercent: body.commissionPercent }),
        ...(body.rewardDistribution && { rewardDistribution: body.rewardDistribution }),
        ...(body.maxPlayers !== undefined && { maxPlayers: body.maxPlayers }),
        ...(body.minPlayers !== undefined && { minPlayers: body.minPlayers }),
        ...(body.gameDuration !== undefined && { gameDuration: body.gameDuration }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.botsEnabled !== undefined && { botsEnabled: body.botsEnabled }),
        ...(body.maxBots !== undefined && { maxBots: body.maxBots }),
        ...(body.botDifficulty && { botDifficulty: body.botDifficulty }),
        ...(body.practiceEnabled !== undefined && { practiceEnabled: body.practiceEnabled }),
      },
    });

    // Invalidate the server-side config cache so changes apply instantly
    try { invalidateConfigCache(config.gameId); } catch { /* socket server may not be running */ }

    return NextResponse.json({ message: "Game config updated", config });
  } catch (error: unknown) {
    console.error("Update game config error:", error);
    return NextResponse.json({ error: "Failed to update game config" }, { status: 500 });
  }
}

// GET single game config
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const config = await prisma.gameConfig.findUnique({ where: { id } });
    if (!config) {
      return NextResponse.json({ error: "Game config not found" }, { status: 404 });
    }

    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "Failed to fetch game config" }, { status: 500 });
  }
}
