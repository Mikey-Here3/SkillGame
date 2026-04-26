import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Detect suspicious patterns from real DB data
    const flags: Array<{
      id: string; username: string; type: string;
      detail: string; severity: string; userId: string; createdAt: string;
    }> = [];

    // 1. Rapid wins: users who won > 10 consecutive games recently
    const rapidWinners = await prisma.user.findMany({
      where: {
        gamesWon: { gte: 10 },
        winRate: { gte: 80 },
        gamesPlayed: { gte: 10 },
        status: "active",
      },
      select: { id: true, username: true, gamesWon: true, winRate: true, gamesPlayed: true, updatedAt: true },
      take: 20,
    });

    for (const u of rapidWinners) {
      flags.push({
        id: `rapid-${u.id}`,
        username: u.username,
        type: "rapid_wins",
        detail: `Won ${u.gamesWon}/${u.gamesPlayed} games (${u.winRate}% win rate) — statistically suspicious`,
        severity: u.winRate >= 90 ? "critical" : "high",
        userId: u.id,
        createdAt: u.updatedAt.toISOString(),
      });
    }

    // 2. Multi-account: users sharing same IP
    const ipGroups = await prisma.user.groupBy({
      by: ["lastLoginIp"],
      where: { lastLoginIp: { not: null }, status: "active" },
      having: { lastLoginIp: { _count: { gt: 2 } } },
      _count: { lastLoginIp: true },
    });

    for (const group of ipGroups) {
      if (!group.lastLoginIp) continue;
      const usersOnIp = await prisma.user.findMany({
        where: { lastLoginIp: group.lastLoginIp, status: "active" },
        select: { id: true, username: true, createdAt: true },
        take: 5,
      });
      if (usersOnIp.length > 1) {
        flags.push({
          id: `multi-ip-${group.lastLoginIp}`,
          username: usersOnIp.map((u) => u.username).join(", "),
          type: "multi_account",
          detail: `${usersOnIp.length} accounts sharing IP ${group.lastLoginIp}`,
          severity: usersOnIp.length >= 4 ? "high" : "medium",
          userId: usersOnIp[0].id,
          createdAt: usersOnIp[0].createdAt.toISOString(),
        });
      }
    }

    return NextResponse.json({ flags });
  } catch (error) {
    console.error("GET fraud flags error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
