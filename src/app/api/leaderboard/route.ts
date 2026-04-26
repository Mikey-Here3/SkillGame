import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "weekly";
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const now = new Date();
    let dateFilter: Date;
    switch (period) {
      case "daily":
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const users = await prisma.user.findMany({
      where: {
        status: "active",
        gamesPlayed: { gt: 0 },
        updatedAt: { gte: dateFilter },
      },
      select: {
        username: true,
        gamesPlayed: true,
        gamesWon: true,
        winRate: true,
        coins: true,
      },
      orderBy: [{ winRate: "desc" }, { gamesWon: "desc" }],
      take: limit,
    });

    return NextResponse.json({
      leaderboard: users.map((user, index) => ({ rank: index + 1, ...user })),
      period,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
