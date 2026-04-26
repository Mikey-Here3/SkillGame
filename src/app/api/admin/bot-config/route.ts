import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Use upsert to guarantee it exists
    const config = await prisma.botSettings.upsert({
      where: { id: "global" },
      update: {},
      create: { id: "global" },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("GET bot config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    const updated = await prisma.botSettings.upsert({
      where: { id: "global" },
      update: {
        botsEnabled: body.botsEnabled,
        easyWinRate: body.easyWinRate,
        mediumWinRate: body.mediumWinRate,
        hardWinRate: body.hardWinRate,
        maxBotsPer1v1: body.maxBotsPer1v1,
        maxBotsPerTourney: body.maxBotsPerTourney,
      },
      create: {
        id: "global",
        botsEnabled: body.botsEnabled ?? true,
        easyWinRate: body.easyWinRate ?? 20,
        mediumWinRate: body.mediumWinRate ?? 50,
        hardWinRate: body.hardWinRate ?? 80,
        maxBotsPer1v1: body.maxBotsPer1v1 ?? 1,
        maxBotsPerTourney: body.maxBotsPerTourney ?? 100,
      },
    });

    return NextResponse.json({ message: "Bot configuration updated", config: updated });
  } catch (error) {
    console.error("POST bot config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
