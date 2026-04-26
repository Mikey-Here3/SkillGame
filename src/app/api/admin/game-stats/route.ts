import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/admin/game-stats — Admin analytics dashboard data
export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Aggregate all stats in parallel
    const [
      totalSessions,
      completedSessions,
      activeSessions,
      activeGames,
      totalCommission,
      recentSessions,
      revenueByGame,
    ] = await Promise.all([
      // Total game sessions ever
      prisma.gameSession.count(),

      // Completed game sessions
      prisma.gameSession.count({ where: { status: "completed" } }),

      // Currently active sessions
      prisma.gameSession.count({ where: { status: { in: ["waiting", "countdown", "active"] } } }),

      // Active game configs
      prisma.gameConfig.count({ where: { isActive: true } }),

      // Total platform commission earned
      prisma.transaction.aggregate({
        where: { type: "platform_commission", status: "completed" },
        _sum: { amount: true },
      }),

      // Recent 10 completed sessions
      prisma.gameSession.findMany({
        where: { status: "completed" },
        orderBy: { endedAt: "desc" },
        take: 10,
        include: {
          gameConfig: { select: { gameName: true, gameIcon: true, gameId: true } },
          _count: { select: { players: true } },
        },
      }),

      // Revenue per game (commission grouped by game config)
      prisma.gameSession.groupBy({
        by: ["gameConfigId"],
        where: { status: "completed", isPractice: false },
        _sum: { commission: true, prizePool: true },
        _count: true,
      }),
    ]);

    // Resolve game names for revenue breakdown
    const gameConfigs = await prisma.gameConfig.findMany({
      select: { id: true, gameId: true, gameName: true, gameIcon: true },
    });
    type ConfigItem = { id: string; gameId: string; gameName: string; gameIcon: string };
    const configMap = new Map<string, ConfigItem>(gameConfigs.map((c: ConfigItem) => [c.id, c]));

    type RevenueItem = { gameId: string; gameName: string; gameIcon: string; totalGames: number; totalCommission: number; totalPrizePool: number };
    const revenueBreakdown: RevenueItem[] = revenueByGame.map((r: typeof revenueByGame[0]) => {
      const cfg = configMap.get(r.gameConfigId);
      return {
        gameId: cfg?.gameId || "unknown",
        gameName: cfg?.gameName || "Unknown",
        gameIcon: cfg?.gameIcon || "🎮",
        totalGames: r._count,
        totalCommission: r._sum.commission || 0,
        totalPrizePool: r._sum.prizePool || 0,
      };
    }).sort((a: RevenueItem, b: RevenueItem) => b.totalCommission - a.totalCommission);

    return NextResponse.json({
      stats: {
        totalSessions,
        completedSessions,
        activeSessions,
        activeGames,
        totalRevenue: totalCommission._sum.amount || 0,
      },
      revenueBreakdown,
      recentSessions: recentSessions.map((s: typeof recentSessions[0]) => ({
        id: s.id,
        roomCode: s.roomCode,
        gameName: s.gameConfig.gameName,
        gameIcon: s.gameConfig.gameIcon,
        gameId: s.gameConfig.gameId,
        entryFee: s.entryFee,
        prizePool: s.prizePool,
        commission: s.commission,
        playerCount: s._count.players,
        isPractice: s.isPractice,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
      })),
    });
  } catch (error: unknown) {
    console.error("Game stats error:", error);
    return NextResponse.json({ error: "Failed to fetch game stats" }, { status: 500 });
  }
}
