import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [bannedUsers, totalGames] = await Promise.all([
      prisma.user.count({ where: { status: "banned" } }),
      prisma.gameSession.count({ where: { status: "completed" } }),
    ]);

    // For now, flags are computed from suspicious patterns
    // In production, you'd have a FraudFlag model
    const activeFlags = 0;
    const flagRate = totalGames > 0 ? `${((activeFlags / totalGames) * 100).toFixed(2)}%` : "0%";

    return NextResponse.json({
      activeFlags,
      bannedUsers,
      totalGames,
      flagRate,
    });
  } catch (error) {
    console.error("GET fraud stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
